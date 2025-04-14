import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../db/mongodb';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
  const { cookies } = request;
  const userId = cookies.get('userId')?.value;
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const db = await connectToDatabase();
  
  let query = { userId };
  
  // Add date filtering if provided
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate).toISOString(),
      $lte: new Date(`${endDate}T23:59:59.999Z`).toISOString()
    };
  }
  
  try {
    const moods = await db.collection('moods')
      .find(query)
      .sort({ date: -1 })
      .toArray();
      
    return Response.json(moods);
  } catch (error) {
    console.error('Error fetching moods:', error);
    return Response.json({ error: 'Failed to fetch moods' }, { status: 500 });
  }
}

export async function POST(request) {
  const moodData = await request.json();
  const { cookies } = request;
  const userId = cookies.get('userId')?.value;
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Validate required fields
  if (!moodData.type || !moodData.intensity || !moodData.date) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  const db = await connectToDatabase();
  
  try {
    const result = await db.collection('moods').insertOne({
      ...moodData,
      userId,
      createdAt: new Date().toISOString()
    });

    return Response.json({
      success: true,
      _id: result.insertedId
    });
  } catch (error) {
    console.error('Error creating mood:', error);
    return Response.json({ error: 'Failed to create mood' }, { status: 500 });
  }
}

export async function PUT(request) {
  const { id, ...updateData } = await request.json();
  const { cookies } = request;
  const userId = cookies.get('userId')?.value;
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!id) {
    return Response.json({ error: 'Missing mood ID' }, { status: 400 });
  }
  
  const db = await connectToDatabase();
  
  try {
    const result = await db.collection('moods').updateOne(
      { _id: new ObjectId(id), userId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return Response.json({ error: 'Mood not found or unauthorized' }, { status: 404 });
    }

    return Response.json({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating mood:', error);
    return Response.json({ error: 'Failed to update mood' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const { cookies } = request;
  const userId = cookies.get('userId')?.value;
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!id) {
    return Response.json({ error: 'Missing mood ID' }, { status: 400 });
  }
  
  const db = await connectToDatabase();
  
  try {
    const result = await db.collection('moods').deleteOne({
      _id: new ObjectId(id),
      userId
    });

    if (result.deletedCount === 0) {
      return Response.json({ error: 'Mood not found or unauthorized' }, { status: 404 });
    }

    return Response.json({
      success: true,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting mood:', error);
    return Response.json({ error: 'Failed to delete mood' }, { status: 500 });
  }
}