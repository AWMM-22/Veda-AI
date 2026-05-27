import { NextRequest, NextResponse } from 'next/server';

const protectedPaths = [
  '/dashboard',
  '/upload',
  '/create-exam',
  '/exam-management',
  '/results',
  '/analytics',
  '/assignments',
  '/library',
  '/groups',
  '/toolkit',
  '/quizzes',
];

const isProtectedPath = (pathname: string) => protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get('teacher_session')?.value;

  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/upload/:path*', '/create-exam/:path*', '/exam-management/:path*', '/results/:path*', '/analytics/:path*', '/assignments/:path*', '/library/:path*', '/groups/:path*', '/toolkit/:path*', '/quizzes/:path*'],
};
