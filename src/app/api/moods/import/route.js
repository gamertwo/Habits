import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../db/mongodb';

export async function POST(request) {
  const { cookies } = request;
  const userId = cookies.get('userId')?.value;
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  let importData;
  try {
    importData = await request.json();
  } catch (error) {
    return Response.json({ error: 'Invalid JSON data' }, { status: 400 });
  }
  
  if (!importData.moods || !Array.isArray(importData.moods)) {
    return Response.json({ error: 'Invalid data format: Expected "moods" array' }, { status: 400 });
  }
  
  try {
    const db = await connectToDatabase();
    
    // Process each mood entry
    const moodsCollection = db.collection('moods');
    let importCount = 0;
    let errorCount = 0;
    
    for (const mood of importData.moods) {
      // Validate required fields
      if (!mood.type || !mood.intensity || !mood.date) {
        errorCount++;
        continue;
      }
      
      try {
        // Remove any existing ID fields that might conflict
        const { _id, id, ...moodData } = mood;
        
        // Ensure the mood belongs to the current user
        moodData.userId = userId;
        
        // Check if an entry with the same date and type already exists
        const existingMood = await moodsCollection.findOne({
          userId,
          date: moodData.date,
          type: moodData.type
        });
        
        if (existingMood) {
          // Update existing entry
          await moodsCollection.updateOne(
            { _id: existingMood._id },
            { $set: moodData }
          );
        } else {
          // Create new entry
          await moodsCollection.insertOne({
            ...moodData,
            createdAt: new Date().toISOString()
          });
        }
        
        importCount++;
      } catch (entryError) {
        console.error('Error importing mood entry:', entryError);
        errorCount++;
      }
    }
    
    return Response.json({
      success: true,
      imported: importCount,
      errors: errorCount
    });
    
  } catch (error) {
    console.error('Error importing moods:', error);
    return Response.json({ error: 'Failed to import moods' }, { status: 500 });
  }
}