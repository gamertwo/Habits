import { NextResponse } from 'next/server';

let localHabits = [];

export async function GET() {
  return NextResponse.json(localHabits);
}

export async function POST(request) {
  const habit = await request.json();
  const newHabit = { ...habit, _id: Date.now().toString() };
  localHabits.push(newHabit);
  return NextResponse.json({
    insertedId: newHabit._id,
    habit: newHabit
  }, { status: 201 });
}

export async function PUT(request) {
  const { id, completedDates } = await request.json();
  const habitIndex = localHabits.findIndex(h => h._id === id);
  if (habitIndex !== -1) {
    localHabits[habitIndex].completedDates = completedDates;
  }
  return NextResponse.json({ message: 'Habit updated successfully' });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  localHabits = localHabits.filter(h => h._id !== id);
  return NextResponse.json({ message: 'Habit deleted successfully' });
}
