import { connectToDatabase } from '@/app/api/db/mongodb';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const db = await connectToDatabase();

    // Create new user
    const result = await db.collection('users').insertOne({
      username,
      password,
      createdAt: new Date()
    });

    // Return success response
    return NextResponse.json({
      success: true,
      userId: result.insertedId
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ 
      error: 'Failed to create account' 
    }, { status: 500 });
  }
}
