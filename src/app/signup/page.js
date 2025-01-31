"use client";
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (userData.password !== userData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/login');
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (error) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-2 justify-center mb-4">
              <UserPlus className="h-8 w-8 text-blue-400" />
              <CardTitle className="text-2xl text-white">Sign Up</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-2 text-red-400 bg-red-900/20 rounded-lg text-center">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={userData.name}
                  onChange={(e) => setUserData({...userData, name: e.target.value})}
                  className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({...userData, email: e.target.value})}
                  className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={userData.password}
                  onChange={(e) => setUserData({...userData, password: e.target.value})}
                  className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={userData.confirmPassword}
                  onChange={(e) => setUserData({...userData, confirmPassword: e.target.value})}
                  className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
              <div className="text-center text-gray-400">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-400 hover:text-blue-300">
                  Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
