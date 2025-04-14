import { connectToDatabase } from '../../db/mongodb';

export async function GET(request) {
  const { cookies } = request;
  const userId = cookies.get('userId')?.value;
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const db = await connectToDatabase();
    
    // Get all moods for the user
    const moods = await db.collection('moods')
      .find({ userId })
      .sort({ date: -1 })
      .toArray();
    
    // Clean up internal fields before export
    const sanitizedMoods = moods.map(mood => {
      // Convert MongoDB ObjectId to string for safe export
      const { _id, ...moodData } = mood;
      return {
        ...moodData,
        id: _id.toString() // Add a string version of the ID
      };
    });
    
    return Response.json(sanitizedMoods);
  } catch (error) {
    console.error('Error exporting moods:', error);
    return Response.json({ error: 'Failed to export moods' }, { status: 500 });
  }
}