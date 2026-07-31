import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const TAG_LENGTH = 16

function getKey(): Buffer {
  const keyHex = process.env.BINANCE_ENCRYPTION_KEY
  if (!keyHex) {
    throw new Error("BINANCE_ENCRYPTION_KEY not set")
  }
  return Buffer.from(keyHex, "hex")
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, "utf8", "hex")
  encrypted += cipher.final("hex")
  const tag = cipher.getAuthTag()

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`
}

export function decrypt(ciphertext: string): string {
  const key = getKey()
  const [ivHex, tagHex, encrypted] = ciphertext.split(":")
  const iv = Buffer.from(ivHex, "hex")
  const tag = Buffer.from(tagHex, "hex")
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}

export function maskKey(key: string): string {
  if (key.length <= 8) return "****"
  return key.slice(0, 4) + "****" + key.slice(-4)
}
