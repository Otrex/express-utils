import crypto from "crypto";

export function generateRandomCode(length: number) {
  return crypto
    .randomBytes(length * 3)
    .toString("base64")
    .split("+")
    .join("")
    .split("/")
    .join("")
    .split("=")
    .join("")
    .substr(0, length);
}

export function generateHash(seed: string) {
  const data = seed.toString() + Date.now().toString();
  return crypto.createHash("sha256").update(data).digest("hex");
}
