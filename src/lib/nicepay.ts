/**
 * NICEPAY Helper Module
 * Supports SHA-256 signature generation for both Node and Edge/Browser
 */

export const NICEPAY_CONFIG = {
  MID: process.env.NEXT_PUBLIC_NICEPAY_MID || 'PIcanocanm',
  SIGN_KEY:
    process.env.NICEPAY_SIGN_KEY ||
    'lTHRv+aLU0X9ANGv9wEEAXv5iim352wBp3DzFiakQtXFGzIfELzjDL4QlcJieHNY3Wl68eqSk//MXimADCPOMw==',
};

/**
 * Generate YYYYMMDDHHmmss string
 */
export function getEdiDate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Generate SHA-256 hex string using Web Crypto API
 */
export async function generateSha256Hex(plainText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate NicePay Web Standard SignData
 * Formula: hex(sha256(EdiDate + MID + Amt + SignKey))
 */
export async function generateNicePaySignData(params: {
  ediDate: string;
  mid: string;
  amt: number;
  signKey: string;
}): Promise<string> {
  const plain = `${params.ediDate}${params.mid}${params.amt}${params.signKey}`;
  return generateSha256Hex(plain);
}
