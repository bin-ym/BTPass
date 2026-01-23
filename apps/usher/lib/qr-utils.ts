import CryptoJS from "crypto-js";

const ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_QR_ENCRYPTION_KEY ||
  "btpass-default-key-change-in-production";

/**
 * Decrypts QR token back to invitation data
 */
export function decryptInvitationData(token: string): {
  id: string;
  name: string;
  timestamp: number;
} | null {
  try {
    // Restore URL-safe characters + base64 padding
    let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);

    const decrypted = CryptoJS.AES.decrypt(base64, ENCRYPTION_KEY);
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedString) {
      return null;
    }

    return JSON.parse(decryptedString);
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
}

/**
 * Validates a QR token
 */
export function validateQRToken(token: string): boolean {
  const data = decryptInvitationData(token);
  if (!data) return false;

  // Token is valid (you can add additional validation like expiry check)
  return true;
}
