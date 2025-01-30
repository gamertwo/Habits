import { NextResponse } from 'next/server';

export async function POST(request) {
  const { username } = await request.json();
  
  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  const users = JSON.parse(localStorage.getItem('users') || '[]');
  
  if (!users.includes(username)) {
    users.push(username);
    localStorage.setItem('users', JSON.stringify(users));
  }

  return NextResponse.json({ username });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const exists = users.includes(username);
  
  return NextResponse.json({ exists });
}
