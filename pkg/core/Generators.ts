import crypto from "crypto";

export function generateRandomCode(length: number, type: "numeric"| "alphanumeric" = "alphanumeric") {
  if (type === "alphanumeric") {
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
  } else {
    return `${Math.floor(Math.random() * Math.pow(10, length))}`.padStart(length, '0');
  }
}

export function generateHash(seed: string) {
  const data = seed.toString() + Date.now().toString();
  return crypto.createHash("sha256").update(data).digest("hex");
}

export default {
  generateRandomCode,
  generateHash,
};
