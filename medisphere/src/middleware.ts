import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'medisphere_session';

type Role = 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN' | 'BILLING' | 'SUPER_ADMIN';

const routeAccess: Record<string, Role[]> = {
  '/dashboard': ['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'BILLING', 'SUPER_ADMIN'],
  '/dashboard/appointments': ['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN'],
  '/dashboard/appointments/new': ['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN'],
  '/dashboard/records': ['DOCTOR', 'NURSE', 'PATIENT'],
  '/dashboard/records/new': ['DOCTOR', 'NURSE'],
  '/dashboard/prescriptions': ['DOCTOR', 'NURSE', 'PATIENT'],
  '/dashboard/prescriptions/new': ['DOCTOR', 'NURSE'],
  '/dashboard/vitals': ['DOCTOR', 'NURSE'],
  '/dashboard/wards': ['ADMIN', 'NURSE'],
  '/dashboard/staff': ['ADMIN'],
  '/dashboard/staff/new': ['ADMIN'],
  '/dashboard/billing': ['BILLING', 'PATIENT'],
  '/dashboard/billing/new': ['BILLING'],
  '/dashboard/insurance': ['BILLING', 'PATIENT'],
  '/dashboard/insurance/new': ['BILLING'],
  '/dashboard/portal': ['PATIENT'],
  '/dashboard/laboratory': ['DOCTOR', 'NURSE', 'PATIENT'],
  '/dashboard/pharmacy': ['DOCTOR', 'NURSE', 'ADMIN'],
  '/dashboard/symptom-checker': ['PATIENT'],
  '/dashboard/immunizations': ['DOCTOR', 'NURSE', 'PATIENT'],
  '/dashboard/availability': ['DOCTOR', 'ADMIN'],
  '/dashboard/intake': ['NURSE', 'ADMIN'],
  '/dashboard/waitlist': ['NURSE', 'ADMIN', 'DOCTOR'],
  '/dashboard/referrals': ['DOCTOR', 'ADMIN'],
  '/dashboard/revenue': ['ADMIN', 'BILLING'],
  '/dashboard/doctor-profiles': ['ADMIN'],
  '/dashboard/audit-log': ['ADMIN', 'SUPER_ADMIN'],
  '/dashboard/leave-management': ['ADMIN', 'NURSE', 'DOCTOR'],
  '/dashboard/inventory': ['ADMIN', 'NURSE'],
};

function getAccessibleRoles(path: string): Role[] | null {
  const exact = routeAccess[path];
  if (exact) return exact;

  const matchingPrefix = Object.keys(routeAccess)
    .filter((key) => path.startsWith(key + '/'))
    .sort((a, b) => b.length - a.length)[0];

  if (matchingPrefix) return routeAccess[matchingPrefix];

  const dynamicPattern = Object.keys(routeAccess).find((key) => {
    const pattern = key.replace(/\[.*?\]/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(path);
  });
  if (dynamicPattern) return routeAccess[dynamicPattern];

  return null;
}

function parseJwtPayload(token: string): { role: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return { role: payload.role };
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = parseJwtPayload(token);
  if (!payload) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  const allowedRoles = getAccessibleRoles(pathname);
  if (allowedRoles && !allowedRoles.includes(payload.role as Role)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
