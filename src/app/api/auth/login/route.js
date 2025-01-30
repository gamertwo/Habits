import { connectToDatabase } from '@/app/api/db/mongodb';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs'; // For password hashing and comparison

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    console.log('Login attempt:', { username });

    const db = await connectToDatabase();
    const user = await db.collection('users').findOne({ username });

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create response object
    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
      },
    });

    // Set the userId cookie with proper configuration
    response.cookies.set({
      name: 'userId',
      value: user._id.toString(),
      httpOnly: true, // Prevent client-side access
      secure: process.env.NODE_ENV === 'production', // Secure in production
      sameSite: 'lax', // Prevent CSRF attacks
      path: '/', // Accessible across the entire site
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}