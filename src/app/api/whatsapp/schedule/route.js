import { NextResponse } from 'next/server';

export async function POST(req) {
  const { message, time, date } = await req.json();
  
  try {
    const response = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: process.env.RECIPIENT_PHONE_NUMBER,
        type: "template",
        template: {
          name: "habit_reminder",
          language: {
            code: "en"
          },
          components: [
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  text: message
                },
                {
                  type: "text",
                  text: `${date} ${time}`
                }
              ]
            }
          ]
        }
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
