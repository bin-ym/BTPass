import QRCode from "qrcode";
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_QR_ENCRYPTION_KEY ||
  "btpass-default-key-change-in-production";

/**
 * Encrypts invitation data into a secure token
 */
export function encryptInvitationData(
  invitationId: string,
  guestName: string
): string {
  const data = {
    id: invitationId,
    name: guestName,
    timestamp: Date.now(),
  };

  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(data),
    ENCRYPTION_KEY
  ).toString();

  // Make it URL-safe
  return encrypted.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

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
 * Generates a QR code from the encrypted token
 * @param token - The encrypted QR token
 * @returns Base64 encoded QR code image
 */
export async function generateQRCode(token: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(token, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error("QR generation error:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generates a unique QR token for an invitation
 */
export function generateQRToken(
  invitationId: string,
  guestName: string
): string {
  return encryptInvitationData(invitationId, guestName);
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

/**
 * Generates QR code as a downloadable blob URL
 */
export async function generateQRCodeBlob(token: string): Promise<Blob> {
  const dataURL = await generateQRCode(token);
  const base64 = dataURL.split(",")[1];
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: "image/png" });
}
