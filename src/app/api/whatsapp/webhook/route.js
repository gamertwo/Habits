import { NextResponse } from 'next/server';

export default function handler(req, res) {
    console.log('Incoming webhook request:', req.method);
    
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
  
      console.log('Verification attempt with:');
      console.log('Mode:', mode);
      console.log('Token:', token);
      console.log('Challenge:', challenge);
      console.log('ENV Token:', process.env.WHATSAPP_VERIFY_TOKEN);
  
      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('Verification successful');
        return res.status(200).send(challenge);
      }
  
      console.log('Verification failed');
      return res.status(403).send('Forbidden');
    }
  
    if (req.method === 'POST') {
      console.log('Received webhook data:', JSON.stringify(req.body, null, 2));
      return res.status(200).json({ status: 'ok' });
    }
  }
  
export async function POST(req) {
  console.log('Webhook POST Request Received');
  
  const body = await req.json();
  console.log('Request Headers:', req.headers);
  console.log('Full Request Body:', JSON.stringify(body, null, 2));
  
  if (body.entry && body.entry[0]) {
    console.log('Entry Data:', body.entry[0]);
    
    if (body.entry[0].changes && body.entry[0].changes[0]) {
      console.log('Change Data:', body.entry[0].changes[0]);
      console.log('Message Data:', body.entry[0].changes[0].value);
    }
  }

  console.log('Processing complete, sending response');
  return NextResponse.json({ status: 'ok' });
}
