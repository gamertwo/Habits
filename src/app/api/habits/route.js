import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../db/mongodb';

export async function GET(request) {
  const { cookies } = request;
  const userId = cookies.get('userId')?.value;
  
  const db = await connectToDatabase();
  const habits = await db.collection('habits')
    .find({ userId: userId })
    .toArray();
    
  return Response.json(habits);
}

export async function POST(request) {
  const habitData = await request.json();
  const { cookies } = request;
  const userId = cookies.get('userId')?.value;
  
  const db = await connectToDatabase();
  const result = await db.collection('habits').insertOne({
    ...habitData,
    // NEW: default structure for time tracking
    timeSpentByDate: habitData.timeSpentByDate || {},
    userId: userId,
    createdAt: new Date(),
  });

  return Response.json({
    success: true,
    _id: result.insertedId
  });
}

export async function PUT(request) {
  const { id, ...updateData } = await request.json();
  const { cookies } = request;
  const userId = cookies.get('userId')?.value;

  const db = await connectToDatabase();
  const result = await db.collection('habits').updateOne(
    { _id: new ObjectId(id), userId: userId },
    { $set: updateData } // can include completedDates and/or timeSpentByDate
  );

  return Response.json({
    success: true,
    modifiedCount: result.modifiedCount
  });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const { cookies } = request;
  const userId = cookies.get('userId')?.value;
  
  const db = await connectToDatabase();
  const result = await db.collection('habits').deleteOne({
    _id: new ObjectId(id),
    userId: userId
  });

  return Response.json({
    success: true,
    deletedCount: result.deletedCount
  });
}
