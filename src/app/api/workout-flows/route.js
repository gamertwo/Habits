import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';


const FLOW_FILE = path.join(process.cwd(), 'data', 'workout-flow.json');

export async function POST(req) {
  try {
    const flow = await req.json();
    








    await fs.mkdir(path.dirname(FLOW_FILE), { recursive: true });
    await fs.writeFile(FLOW_FILE, JSON.stringify(flow, null, 2));





    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {











    const content = await fs.readFile(FLOW_FILE, 'utf-8');
    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function scheduleWorkoutReminder(flow) {
  const message = {
    messaging_product: "whatsapp",
    to: process.env.WHATSAPP_TO_NUMBER,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: `Time for your ${flow.name} workout! Ready to begin?`
      },
      action: {
        buttons: flow.nodes
          .filter(node => node.type !== 'input')
          .map(node => ({
            type: "reply",
            reply: {
              id: node.id,
              title: node.data.label
            }
          }))
      }
    }
  };

  const response = await fetch(
    `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    }
  );

  return response.json();
}
