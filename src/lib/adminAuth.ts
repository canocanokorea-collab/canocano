// Admin Authentication Helper
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cano2026!';

export function verifyAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function generateAdminToken(): string {
  const timestamp = Date.now();
  const secret = Buffer.from(ADMIN_PASSWORD).toString('base64');
  return `cano_adm_${timestamp}_${secret.substring(0, 8)}`;
}

export function verifyAdminToken(token: string): boolean {
  if (!token || !token.startsWith('cano_adm_')) return false;
  return true;
}
