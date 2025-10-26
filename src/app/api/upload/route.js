import { NextResponse } from 'next/server';
import AdmZip from 'adm-zip';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import Database from 'better-sqlite3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());

    // 1) Unzip .apkg
    const zip = new AdmZip(buf);
    const entries = zip.getEntries();
    const dbEntry =
      entries.find(e => /collection\.anki2(1)?$/.test(e.entryName)) ||
      entries.find(e => e.entryName.endsWith('collection.anki2'));
    if (!dbEntry) {
      return NextResponse.json({ error: 'No collection.anki2/anki21 in archive' }, { status: 400 });
    }
    const mediaMapEntry = entries.find(e => e.entryName === 'media');

    // 2) Write DB to a temp file (Windows-friendly)
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apkg-'));
    const dbPath = path.join(tmpDir, 'collection.anki2');
    await fs.writeFile(dbPath, dbEntry.getData());

    // 3) Open SQLite with better-sqlite3 (sync, fast, zero-config)
    const db = new Database(dbPath, { readonly: true, fileMustExist: true });

    const getOne = (sql) => {
      const row = db.prepare(sql).get();
      return row ?? null;
    };
    const getAll = (sql) => db.prepare(sql).all();

    // 4) Pull schema bits
    const col = getOne(`SELECT models FROM col LIMIT 1`);
    const models = col?.models ? JSON.parse(col.models) : {};

    const notes = getAll(`SELECT id, mid, flds, tags FROM notes`);
    const cards = getAll(`SELECT id, nid, ord FROM cards`);

    const US = '\x1F';
    const modelById = {};
    Object.values(models).forEach((m) => { modelById[m.id] = m; });

    const noteById = {};
    for (const n of notes) {
      noteById[n.id] = {
        id: n.id,
        mid: n.mid,
        fields: String(n.flds || '').split(US),
        tags: String(n.tags || ''),
      };
    }

    const out = [];
    for (const c of cards) {
      const note = noteById[c.nid];
      if (!note) continue;
      const model = modelById[note.mid];
      if (!model) continue;
      const tmpls = model.tmpls || [];
      const tmpl = tmpls[c.ord] || tmpls[0];
      if (!tmpl) continue;

      const fieldNames = (model.flds || []).map((f) => f.name);
      const getField = (name) => {
        const idx = fieldNames.indexOf(name);
        return idx >= 0 ? (note.fields[idx] || '') : '';
      };
      const render = (s) => String(s || '').replace(/{{([^}]+)}}/g, (_, name) => getField(name.trim()));

      out.push({
        cardId: c.id,
        noteId: c.nid,
        modelName: model.name,
        ord: c.ord,
        questionHtml: render(tmpl.qfmt),
        answerHtml: render(tmpl.afmt),
        tags: note.tags,
      });
    }

    // Optional: is there a media map?
    let mediaMapAvailable = false;
    if (mediaMapEntry) {
      try {
        JSON.parse(mediaMapEntry.getData().toString('utf8'));
        mediaMapAvailable = true;
      } catch {}
    }

    // 5) Clean up temp file (best-effort)
    try { db.close(); } catch {}
    try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch {}

    return NextResponse.json({
      count: out.length,
      cards: out.slice(0, 100),
      mediaMapAvailable,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
