import crypto from "node:crypto";

export interface EncryptedPayload {
  ciphertext: Uint8Array<ArrayBuffer>;
  iv: Uint8Array<ArrayBuffer>;
  authTag: Uint8Array<ArrayBuffer>;
  keyVersion: number;
}

function toUint8Array(buf: Buffer): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(buf.byteLength);
  out.set(buf);
  return out;
}

/** Dev fallbacks are opt-in with an explicit local-only flag, never inferred. */
function devFallbackAllowed(): boolean {
  return process.env.FORMO_ALLOW_DEV_SECRETS === "1";
}

function requireProductionSecrets(): void {
  if (process.env.NODE_ENV === "production" && devFallbackAllowed()) {
    throw new Error("FORMO_ALLOW_DEV_SECRETS=1 is not allowed in production");
  }
}

/** @internal - called at startup to enforce production secret requirements */ requireProductionSecrets();

function getMasterKey(version = currentKeyVersion()): Buffer {
  const keyring = encryptionKeyring();
  if (keyring) {
    const key = keyring.get(version)?.trim();
    if (!key || key.length < 32) {
      throw new Error(`No encryption key configured for version ${version}`);
    }
    return crypto.createHash("sha256").update(key).digest();
  }

  if (version !== 1) {
    throw new Error(
      `Encryption key version ${version} requires FORMO_ENCRYPTION_KEYS; only version 1 is available`
    );
  }

  const raw = process.env.FORMO_ENCRYPTION_KEY?.trim();
  if (!raw || raw.length < 32) {
    if (devFallbackAllowed()) {
      return crypto.createHash("sha256").update("formo-dev-fallback-encryption-key-32b").digest();
    }
    throw new Error("FORMO_ENCRYPTION_KEY must be at least 32 characters");
  }
  return crypto.createHash("sha256").update(raw).digest();
}

/**
 * Optional keyring for rotation: `FORMO_ENCRYPTION_KEYS={"1":"old","2":"new"}`.
 * When present it is authoritative, so every version still in use must be listed.
 */
function encryptionKeyring(): Map<number, string> | null {
  const raw = process.env.FORMO_ENCRYPTION_KEYS?.trim();
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("FORMO_ENCRYPTION_KEYS must be a JSON object mapping version to key");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("FORMO_ENCRYPTION_KEYS must be a JSON object mapping version to key");
  }

  const keyring = new Map<number, string>();
  for (const [version, key] of Object.entries(parsed as Record<string, unknown>)) {
    if (!/^\d+$/.test(version) || typeof key !== "string") {
      throw new Error("FORMO_ENCRYPTION_KEYS must map numeric versions to string keys");
    }
    keyring.set(Number(version), key);
  }
  return keyring;
}

/** The version written for new secrets: highest configured, else 1. */
export function currentKeyVersion(): number {
  const keyring = encryptionKeyring();
  if (!keyring || keyring.size === 0) return 1;
  return Math.max(...keyring.keys());
}

function getHmacPepper(): Buffer {
  const raw = process.env.FORMO_HMAC_PEPPER?.trim();
  if (!raw || raw.length < 32) {
    if (devFallbackAllowed()) {
      return Buffer.from("formo-dev-fallback-hmac-pepper-32bytes", "utf8");
    }
    throw new Error("FORMO_HMAC_PEPPER must be at least 32 characters");
  }
  return Buffer.from(raw, "utf8");
}

/**
 * Encrypts sensitive strings (e.g., custom SMTP passwords) using AES-256-GCM with a random 96-bit IV.
 */
export function encryptSecret(plaintext: string, keyVersion = currentKeyVersion()): EncryptedPayload {
  const key = getMasterKey(keyVersion);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: toUint8Array(encrypted),
    iv: toUint8Array(iv),
    authTag: toUint8Array(authTag),
    keyVersion,
  };
}

/**
 * Decrypts an AES-256-GCM sealed secret. Throws if the authentication tag or ciphertext was tampered with.
 */
export function decryptSecret(record: {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  authTag: Uint8Array;
  keyVersion?: number;
}): string {
  const key = getMasterKey(record.keyVersion ?? 1);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(record.iv));
  decipher.setAuthTag(Buffer.from(record.authTag));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(record.ciphertext)),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Computes a peppered HMAC-SHA256 digest for API keys and anonymized client IP hashes.
 */
export function hmacDigest(value: string): Uint8Array<ArrayBuffer> {
  const digest = crypto.createHmac("sha256", getHmacPepper()).update(value).digest();
  return toUint8Array(digest);
}

/**
 * Constant-time comparison of two byte buffers/arrays.
 */
export function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Generates a URL-safe CSPRNG form endpoint identifier (`fmo_<12-char-base64url>`).
 */
export function generateFormEndpoint(): string {
  const token = crypto.randomBytes(9).toString("base64url");
  return `fmo_${token}`;
}

/**
 * Generates a workspace API key (`fmo_live_<8-char-prefix>_<48-char-secret>`), returning the raw key once
 * along with its stored prefix and HMAC-SHA256 hash.
 */
export function generateApiKey(): {
  rawKey: string;
  keyPrefix: string;
  keyHash: Uint8Array<ArrayBuffer>;
} {
  const shortId = crypto.randomBytes(4).toString("hex");
  const secretPart = crypto.randomBytes(24).toString("base64url");
  const keyPrefix = `fmo_live_${shortId}`;
  const rawKey = `${keyPrefix}_${secretPart}`;

  return {
    rawKey,
    keyPrefix,
    keyHash: hmacDigest(rawKey),
  };
}
