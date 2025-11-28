// app/api/habits/route.js
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "../db/mongodb";

/** Utility */
const json = (data, init = {}) =>
  new NextResponse(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

const toObjectId = (val) => {
  try {
    return new ObjectId(val);
  } catch {
    return null;
  }
};

// helper: default 7-day array [Sun..Sat]
const defaultDaysOfWeek = () => [true, true, true, true, true, true, true];

/** GET /api/habits
 *  Returns all habits for the cookie userId
 */
export async function GET() {
  try {
    const userId = cookies().get("userId")?.value;
    if (!userId) return json({ error: "Unauthorized" }, { status: 401 });

    const db = await connectToDatabase();
    const habits = await db
      .collection("habits")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    // Ensure arrays/objects exist (defensive for legacy docs)
    const safe = habits.map((h) => ({
      ...h,
      completedDates: Array.isArray(h.completedDates) ? h.completedDates : [],
      timeSpentByDate:
        h.timeSpentByDate && typeof h.timeSpentByDate === "object"
          ? h.timeSpentByDate
          : {},
      xpPerCompletion:
        typeof h.xpPerCompletion === "number" && h.xpPerCompletion > 0
          ? h.xpPerCompletion
          : 50,
      color: typeof h.color === "string" ? h.color : "#10B981",
      daysOfWeek:
        Array.isArray(h.daysOfWeek) && h.daysOfWeek.length === 7
          ? h.daysOfWeek.map(Boolean)
          : defaultDaysOfWeek(),
    }));

    return json(safe);
  } catch (e) {
    console.error("GET /habits error:", e);
    return json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/** POST /api/habits
 *  Body: {
 *    name,
 *    category?,
 *    emoji?,
 *    maxCheckOffs?,
 *    completedDates?,
 *    timeSpentByDate?,
 *    xpPerCompletion?,
 *    color?,
 *    daysOfWeek? [bool,bool,...] length 7
 *  }
 */
export async function POST(request) {
  try {
    const userId = cookies().get("userId")?.value;
    if (!userId) return json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    // Basic validation
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return json({ error: "Name is required" }, { status: 400 });

    const maxCheckOffs =
      typeof body.maxCheckOffs === "number" && body.maxCheckOffs > 0
        ? Math.floor(body.maxCheckOffs)
        : 1;

    const xpPerCompletion =
      typeof body.xpPerCompletion === "number" && body.xpPerCompletion > 0
        ? Math.floor(body.xpPerCompletion)
        : 50;

    const color =
      typeof body.color === "string" && body.color.trim()
        ? body.color.trim()
        : "#10B981";

    const daysOfWeek =
      Array.isArray(body.daysOfWeek) && body.daysOfWeek.length === 7
        ? body.daysOfWeek.map(Boolean)
        : defaultDaysOfWeek();

    const doc = {
      name,
      category:
        typeof body.category === "string" && body.category.trim()
          ? body.category.trim()
          : "General",
      emoji: typeof body.emoji === "string" ? body.emoji : "",
      maxCheckOffs,
      completedDates: Array.isArray(body.completedDates)
        ? body.completedDates.map(String)
        : [], // UI normalizes to YYYY-MM-DD (local)
      timeSpentByDate:
        body.timeSpentByDate && typeof body.timeSpentByDate === "object"
          ? body.timeSpentByDate
          : {},
      xpPerCompletion,
      color,
      daysOfWeek,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await connectToDatabase();
    const result = await db.collection("habits").insertOne(doc);

    return json({ success: true, _id: result.insertedId });
  } catch (e) {
    console.error("POST /habits error:", e);
    return json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/** PUT /api/habits
 *  Body: { id, ...fields }
 *  Only whitelisted fields are set.
 */
export async function PUT(request) {
  try {
    const userId = cookies().get("userId")?.value;
    if (!userId) return json({ error: "Unauthorized" }, { status: 401 });

    const { id, ...rest } = await request.json();
    const _id = toObjectId(id);
    if (!_id) return json({ error: "Invalid id" }, { status: 400 });

    // Whitelist fields
    const update = {};
    if (typeof rest.name === "string") update.name = rest.name.trim();
    if (typeof rest.category === "string") update.category = rest.category.trim();
    if (typeof rest.emoji === "string") update.emoji = rest.emoji;

    if (typeof rest.maxCheckOffs === "number" && rest.maxCheckOffs > 0) {
      update.maxCheckOffs = Math.floor(rest.maxCheckOffs);
    }

    if (Array.isArray(rest.completedDates)) {
      // UI sends local YYYY-MM-DD strings; we accept as-is
      update.completedDates = rest.completedDates.map(String);
    }

    if (rest.timeSpentByDate && typeof rest.timeSpentByDate === "object") {
      update.timeSpentByDate = rest.timeSpentByDate;
    }

    if (typeof rest.xpPerCompletion === "number" && rest.xpPerCompletion > 0) {
      update.xpPerCompletion = Math.floor(rest.xpPerCompletion);
    }

    if (typeof rest.color === "string" && rest.color.trim()) {
      update.color = rest.color.trim();
    }

    if (Array.isArray(rest.daysOfWeek) && rest.daysOfWeek.length === 7) {
      update.daysOfWeek = rest.daysOfWeek.map(Boolean);
    }

    // Note: "attributions" (the “Done on …” pills) are local-only in the UI,
    // and intentionally NOT stored on server.

    update.updatedAt = new Date();

    const db = await connectToDatabase();
    const result = await db
      .collection("habits")
      .updateOne({ _id, userId }, { $set: update });

    return json({ success: true, modifiedCount: result.modifiedCount });
  } catch (e) {
    console.error("PUT /habits error:", e);
    return json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/** DELETE /api/habits?id=... */
export async function DELETE(request) {
  try {
    const userId = cookies().get("userId")?.value;
    if (!userId) return json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const _id = toObjectId(id);
    if (!_id) return json({ error: "Invalid id" }, { status: 400 });

    const db = await connectToDatabase();
    const result = await db.collection("habits").deleteOne({ _id, userId });

    return json({ success: true, deletedCount: result.deletedCount });
  } catch (e) {
    console.error("DELETE /habits error:", e);
    return json({ error: "Internal Server Error" }, { status: 500 });
  }
}
