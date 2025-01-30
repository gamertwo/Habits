"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { UserCircle } from "lucide-react";

export default function AuthPage() {
  const [username, setUsername] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem('currentUser', username);
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-2 justify-center mb-4">
              <UserCircle className="h-8 w-8 text-blue-400" />
              <CardTitle className="text-2xl text-white">Welcome</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Enter your username"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
