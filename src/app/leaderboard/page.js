"use client";
import { useState, useEffect } from 'react';
import { Trophy, Medal, Star } from 'lucide-react';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      const response = await fetch('/api/leaderboard', {
        credentials: 'include'
      });
      const data = await response.json();
      // Filter out users with 0 levels and sort by level
      const activeUsers = data
        .filter(user => user.level > 0)
        .sort((a, b) => b.level - a.level || b.totalXp - a.totalXp);
      setUsers(activeUsers);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-400" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-300" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <Star className="h-6 w-6 text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="h-8 w-8 text-yellow-400" />
          <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user, index) => (
              <div
                key={user._id}
                className="bg-gray-800 rounded-lg p-4 flex items-center gap-4 transition-transform hover:scale-102"
              >
                <div className="flex-shrink-0 w-12 flex justify-center">
                  {getRankIcon(index + 1)}
                </div>
                
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-white">
                    {user.username}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Level {user.level}</span>
                    <span>•</span>
                    <span>{user.totalXp} XP</span>
                  </div>
                </div>

                <div className="flex-shrink-0 text-2xl font-bold text-gray-400">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
