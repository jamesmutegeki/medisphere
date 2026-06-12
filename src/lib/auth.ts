import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { UserSession } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'medisphere-secret-key-change-in-production';
const SESSION_COOKIE = 'medisphere_session';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch {
    return null;
  }
}

export async function createSession(user: UserSession): Promise<string> {
  const token = signToken(user);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) {
    await prisma.session.deleteMany({ where: { token } });
    return null;
  }

  const session = await prisma.session.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) {
    await prisma.session.deleteMany({ where: { token } });
    return null;
  }

  return payload;
}

export async function requireAuth(): Promise<UserSession> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireRole(allowedRoles: string[]): Promise<UserSession> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  return user;
}

export async function logAudit(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  details?: string
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      resource,
      resourceId,
      details,
    },
  });
}
