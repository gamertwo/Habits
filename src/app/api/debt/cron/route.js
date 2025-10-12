// app/api/debt/cron/route.js
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function postToDiscord(debt) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) throw new Error('Missing DISCORD_WEBHOOK_URL');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      username: 'XP Task Forge',
      content: `⏰ Debt reminder: **${debt} XP**`,
      embeds: [{
        title: 'Instagram Debt',
        description: debt > 0
          ? `You currently owe **${debt} XP**.\nFinish tasks to pay it down.`
          : 'No debt right now 🎉',
        color: debt > 0 ? 0xEF4444 : 0x22C55E,
        timestamp: new Date().toISOString(),
      }]
    })
  });
  if (!res.ok) throw new Error(`Discord failed: ${res.status} ${await res.text()}`);
}

export async function GET() {
  try {
    const debt = Number(await redis.get('xpforge:debt')) || 0;
    await postToDiscord(debt);
    return NextResponse.json({ ok: true, debt });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'server error' }, { status: 500 });
  }
}
