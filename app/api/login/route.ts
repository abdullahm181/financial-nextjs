import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Hardcoded credentials logic
    const isValidAmin = username === 'amin' && password === 'maya';
    const isValidMaya = username === 'maya' && password === 'amin';

    if (isValidAmin || isValidMaya) {
      const cookieStore = await cookies();
      cookieStore.set('auth_session', username, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600 * 24 * 7, // 1 week
        path: '/',
        sameSite: 'lax',
      });
      return NextResponse.json({ success: true, user: username });
    }

    return NextResponse.json({ success: false, message: 'Gagal Login: Username atau password salah.' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Gagal Login: Terjadi kesalahan sistem.' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_session');
  return NextResponse.json({ success: true });
}
