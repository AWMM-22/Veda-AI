import { NextResponse } from 'next/server';
import { createTeacherSessionToken } from '@/lib/teacher-session';

export async function POST(request: Request) {
  const { password } = await request.json();
  const teacherPassword = process.env.TEACHER_PASSWORD || '';
  const sessionSecret = process.env.TEACHER_SESSION_SECRET || teacherPassword;

  if (!teacherPassword || !sessionSecret) {
    return NextResponse.json({ success: false, error: 'Teacher password is not configured' }, { status: 500 });
  }

  if (!password || password !== teacherPassword) {
    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
  }

  const token = await createTeacherSessionToken(teacherPassword!, sessionSecret!);
  const response = NextResponse.json({ success: true });

  response.cookies.set('teacher_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
