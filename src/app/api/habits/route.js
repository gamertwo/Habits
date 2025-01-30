import { connectToDatabase } from "@/app/api/db/mongodb";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

// Helper function to validate user
const validateUser = async (request) => {
  const cookieStore = cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    throw new Error("User not authenticated");
  }

  return userId;
};

// Fetch all habits for the logged-in user
export async function GET(request) {
  try {
    const userId = await validateUser(request);
    const db = await connectToDatabase();

    const habits = await db
      .collection("habits")
      .find({ userId: new ObjectId(userId) })
      .toArray();

    return NextResponse.json(habits);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "User not authenticated" ? 401 : 500 }
    );
  }
}

// Create a new habit
export async function POST(request) {
  try {
    const userId = await validateUser(request);
    const habitData = await request.json();
    const db = await connectToDatabase();

    const result = await db.collection("habits").insertOne({
      ...habitData,
      userId: new ObjectId(userId),
      createdAt: new Date(),
    });

    return NextResponse.json(
      { success: true, habitId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "User not authenticated" ? 401 : 500 }
    );
  }
}

// Update an existing habit
export async function PUT(request) {
  try {
    const userId = await validateUser(request);
    const { id, ...updatedData } = await request.json();
    const db = await connectToDatabase();

    const result = await db.collection("habits").updateOne(
      {
        _id: new ObjectId(id),
        userId: new ObjectId(userId),
      },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Habit not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "User not authenticated" ? 401 : 500 }
    );
  }
}

// Delete a habit
export async function DELETE(request) {
  try {
    const userId = await validateUser(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const db = await connectToDatabase();

    const result = await db.collection("habits").deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Habit not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Habit deleted successfully" });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "User not authenticated" ? 401 : 500 }
    );
  }
}