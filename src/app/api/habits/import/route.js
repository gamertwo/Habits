import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req) {
  try {
    const { db } = await connectToDatabase();
    const data = await req.json();
    
    await db.collection('habits').deleteMany({});
    await db.collection('habits').insertMany(data);
    
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
