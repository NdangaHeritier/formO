import { NextRequest } from "next/server";
import { HttpError } from "@/server/auth/authorization";

/**
 * Reads and parses a JSON request body, converting any parse error into an
 * HttpError(400) so route handlers never leak a 500 for a malformed body.
 */
export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON");
  }
}
