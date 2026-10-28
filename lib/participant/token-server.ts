import "server-only";

import { randomBytes } from "node:crypto";
import { ACCESS_TOKEN_BYTES } from "./limits";

/** Fresh access token for a renewal, same shape as the database default. */
export function generateAccessToken(): string {
  return randomBytes(ACCESS_TOKEN_BYTES).toString("hex");
}
