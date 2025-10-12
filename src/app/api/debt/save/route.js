// app/api/debt/save/route.js
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function POST(req) {
  try {
    const { debt } = await req.json();
    const n = Number(debt);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: 'invalid debt' }, { status: 400 });
    }
    await redis.set('xpforge:debt', n);
    await redis.set('xpforge:debt:updatedAt', Date.now());
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'server error' }, { status: 500 });
  }
}
