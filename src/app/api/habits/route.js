import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'habits.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir);
  }
}

// Read habits from JSON file
async function readHabits() {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Write habits to JSON file
async function writeHabits(habits) {
  await ensureDataDirectory();
  await fs.writeFile(dataFilePath, JSON.stringify(habits, null, 2));
}

export async function GET() {
  try {
    const habits = await readHabits();
    return new Response(JSON.stringify(habits), { status: 200 });
  } catch (error) {
    console.error('Error in GET request:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const habit = await request.json();
    const habits = await readHabits();
    const newHabit = { ...habit, _id: Date.now().toString() };
    habits.push(newHabit);
    await writeHabits(habits);
    return new Response(JSON.stringify({
      insertedId: newHabit._id,
      habit: newHabit
    }), { status: 201 });
  } catch (error) {
    console.error('Error in POST request:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, completedDates } = await request.json();
    const habits = await readHabits();
    const habitIndex = habits.findIndex(h => h._id === id);
    if (habitIndex !== -1) {
      habits[habitIndex].completedDates = completedDates;
      await writeHabits(habits);
    }
    return new Response(JSON.stringify({ message: 'Habit updated successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error in PUT request:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const habits = await readHabits();
    const filteredHabits = habits.filter(h => h._id !== id);
    await writeHabits(filteredHabits);
    return new Response(JSON.stringify({ message: 'Habit deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error in DELETE request:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
