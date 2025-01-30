import { connectToDatabase } from '@/app/api/db/mongodb';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs'; // Import bcrypt for password hashing

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const db = await connectToDatabase();

    // Hash the password before storing it
    const salt = await bcrypt.genSalt(10); // Generate a salt
    const hashedPassword = await bcrypt.hash(password, salt); // Hash the password

    // Create new user with the hashed password
    const result = await db.collection('users').insertOne({
      username,
      password: hashedPassword, // Store the hashed password
      createdAt: new Date(),
    });

    // Return success response
    return NextResponse.json({
      success: true,
      userId: result.insertedId,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}