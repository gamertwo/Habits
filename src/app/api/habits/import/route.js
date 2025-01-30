import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'habits.json');

export async function POST(req) {
  try {
    const newData = await req.json();
    const existingData = await fs.readFile(dataFilePath, 'utf8')
      .then(data => JSON.parse(data))
      .catch(() => []);
    
    // Merge existing and new data, avoiding duplicates by _id
    const mergedData = [
      ...existingData,
      ...newData.filter(newHabit => 
        !existingData.some(existingHabit => 
          existingHabit._id === newHabit._id
        )
      )
    ];

    await fs.writeFile(dataFilePath, JSON.stringify(mergedData, null, 2));
    return Response.json({ status: 'success', count: mergedData.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
