import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = 'super-secret-key-finans-takip-scripti'; // Prod. ortamlarda process.env.JWT_SECRET olmalı
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // 30 Gün açık kalsın
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function createSession(profileId: number, username: string, name: string) {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ profileId, username, name, expires });

  (await cookies()).set('session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function logout() {
  (await cookies()).set('session', '', { expires: new Date(0), path: '/' });
}

export async function getSession() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
}
