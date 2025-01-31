import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json(
    { success: true },
    { status: 200 }
  );

  // Clear all authentication cookies
  response.cookies.delete('userId');
  response.cookies.delete('userEmail');

  return response;
}
