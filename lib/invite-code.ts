import { randomBytes } from "crypto";

export function generateInviteCode() {
  return randomBytes(12).toString("base64url");
}
