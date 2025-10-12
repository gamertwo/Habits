export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const ACTIVE_START = 9;   // 09:00 PKT inclusive
const ACTIVE_END   = 23;  // 23:00 PKT exclusive (i.e., up to 22:59)

function hourInKarachi() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    hour: '2-digit',
    hour12: false
  }).formatToParts(new Date());
  const hourStr = parts.find(p => p.type === 'hour')?.value || '0';
  return parseInt(hourStr, 10);
}

async function postDebtToDiscord(debt) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) throw new Error('Missing DISCORD_WEBHOOK_URL');

  const body = {
    username: 'XP Task Forge',
    content: `⏰ Debt reminder: **${debt} XP**`,
    embeds: [
      {
        title: 'Instagram Debt',
        description:
          debt > 0
            ? `You currently owe **${debt} XP**.\nFinish tasks to pay it down.`
            : 'No debt right now 🎉',
        color: debt > 0 ? 0xEF4444 : 0x22C55E,
        timestamp: new Date().toISOString()
      }
    ]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Discord webhook failed: ${res.status} ${t}`);
  }
}

// Cron: GET /api/debt
export async function GET() {
  try {
    const hourPK = hourInKarachi();
    const withinActive = hourPK >= ACTIVE_START && hourPK < ACTIVE_END;
    if (!withinActive) {
      return NextResponse.json({ skipped: true, reason: 'outside active hours', hourPK });
    }
    const debt = Number(await kv.get('xpforge:debt')) || 0;
    await postDebtToDiscord(debt);
    return NextResponse.json({ ok: true, hourPK, debt });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'server error' }, { status: 500 });
  }
}

// Manual + Save: POST /api/debt
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const type = body?.type;

    if (type === 'save') {
      const debt = Number(body?.debt);
      if (!Number.isFinite(debt) || debt < 0) {
        return NextResponse.json({ error: 'invalid debt' }, { status: 400 });
      }
      await kv.set('xpforge:debt', debt);
      await kv.set('xpforge:debt:updatedAt', Date.now());
      return NextResponse.json({ ok: true });
    }

    if (type === 'post-now') {
      if (process.env.DEBT_POST_SECRET) {
        if (body?.secret !== process.env.DEBT_POST_SECRET) {
          return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }
      }
      const debt = Number(await kv.get('xpforge:debt')) || 0;
      await postDebtToDiscord(debt);
      return NextResponse.json({ ok: true, debt });
    }

    return NextResponse.json({ error: 'unknown type' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'server error' }, { status: 500 });
  }
}
