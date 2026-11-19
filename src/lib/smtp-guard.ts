import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

export class SmtpEndpointError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SmtpEndpointError";
  }
}

export type Resolver = (
  host: string
) => Promise<Array<{ address: string; family: number }>>;

const BLOCKED_V4: Array<[string, number]> = [
  ["0.0.0.0", 8], // "this network"
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8],
  ["169.254.0.0", 16], // link-local / cloud metadata
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24], // documentation
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24], // documentation
  ["203.0.113.0", 24], // documentation
  ["224.0.0.0", 4], // multicast and above
];

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const bytes = parts.map((part) => Number(part));
  if (bytes.some((b) => !Number.isInteger(b) || b < 0 || b > 255)) return null;
  return (((bytes[0]! << 24) >>> 0) + (bytes[1]! << 16) + (bytes[2]! << 8) + bytes[3]!) >>> 0;
}

function inCidr(value: number, base: string, bits: number): boolean {
  const network = ipv4ToInt(base);
  if (network === null) return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (value & mask) === (network & mask);
}

/** Returns the embedded IPv4 for ::ffff:a.b.c.d, otherwise null. */
function mappedV4(ip: string): string | null {
  const lower = ip.toLowerCase();
  if (!lower.startsWith("::ffff:")) return null;
  const candidate = lower.slice(7);
  return ipv4ToInt(candidate) !== null ? candidate : null;
}

function isBlockedIp(ip: string, allowLoopback: boolean): boolean {
  const version = isIP(ip);
  if (version === 4) {
    if (allowLoopback && inCidr(ipv4ToInt(ip)!, "127.0.0.0", 8)) return false;
    return BLOCKED_V4.some(([base, bits]) => inCidr(ipv4ToInt(ip)!, base, bits));
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    const v4 = mappedV4(lower);
    if (v4) return isBlockedIp(v4, allowLoopback);
    if (allowLoopback && (lower === "::1" || lower === "::")) return false;
    if (lower === "::1" || lower === "::") return true;
    const first = parseInt(lower.split(":")[0] || "0", 16);
    if (first >= 0xfc00 && first <= 0xfdff) return true; // unique local fc00::/7
    if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true; // link-local fe80::/10
    if ((first & 0xff00) === 0xff00) return true; // multicast ff00::/8
    return false;
  }
  return true; // unparseable address fails closed
}

/**
 * Rejects SMTP endpoints that resolve to private, loopback, link-local,
 * metadata or otherwise non-public addresses. Pass a resolver to test without
 * touching DNS. Throws SmtpEndpointError before any socket is opened.
 */
export async function assertSmtpEndpoint(
  host: string,
  port: number,
  options: { allowLocal?: boolean; resolver?: Resolver } = {}
): Promise<void> {
  const trimmed = host.trim();
  if (!trimmed || trimmed.length > 253 || /[\r\n]/.test(trimmed)) {
    throw new SmtpEndpointError("Invalid SMTP host");
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new SmtpEndpointError("Invalid SMTP port");
  }

  const allowLocal = options.allowLocal === true;
  const addresses: Array<{ address: string; family: number }> = [];

  if (isIP(trimmed) > 0) {
    addresses.push({ address: trimmed, family: isIP(trimmed) });
  } else {
    if (!/^[A-Za-z0-9.-]+$/.test(trimmed) || trimmed.startsWith(".") || trimmed.endsWith(".")) {
      throw new SmtpEndpointError("Invalid SMTP host");
    }
    const resolve: Resolver = options.resolver ?? ((host) => lookup(host, { all: true }));
    try {
      addresses.push(...(await resolve(trimmed)));
    } catch {
      throw new SmtpEndpointError("SMTP host could not be resolved");
    }
  }

  if (addresses.length === 0) {
    throw new SmtpEndpointError("SMTP host could not be resolved");
  }
  if (addresses.some(({ address }) => isBlockedIp(address, allowLocal))) {
    throw new SmtpEndpointError("SMTP host is not allowed");
  }
}
