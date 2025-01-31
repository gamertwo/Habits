import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { connectToDatabase } from '../../../db/mongodb';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url));
  }

  try {
    const oAuth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );

    const { tokens } = await oAuth2Client.getToken(code);
    
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });
    
    const userData = await userResponse.json();

    const db = await connectToDatabase();
    
    let user = await db.collection('users').findOne({
      email: userData.email
    });

    if (!user) {
      const result = await db.collection('users').insertOne({
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        googleId: userData.sub,
        createdAt: new Date(),
        provider: 'google'
      });
      user = {
        _id: result.insertedId,
        email: userData.email,
        name: userData.name
      };
    }

    const response = NextResponse.redirect(new URL('/track', request.url));
    
    // Set both userId and user email in cookies
    response.cookies.set('userId', user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60
    });

    response.cookies.set('userEmail', user.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60
    });

    return response;

  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.redirect(new URL('/login?error=google_auth_failed', request.url));
  }
}
