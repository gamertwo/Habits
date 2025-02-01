import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;

export async function GET() {
  try {
    const client = await MongoClient.connect(uri);
    const db = client.db("habits-tracker");
    
    const users = await db.collection('users').find({}).toArray();
    const habits = await db.collection('habits').find({}).toArray();

    const userStats = users.map(user => {
      const userHabits = habits.filter(habit => 
        habit.userId && habit.userId.toString() === user._id.toString()
      );
      
      const totalXp = userHabits.reduce((sum, habit) => {
        const completions = habit.completedDates?.length || 0;
        return sum + (completions * 50);
      }, 0);

      const level = Math.floor(1 + Math.sqrt(totalXp / 100));

      return {
        _id: user._id,
        username: user.username,
        totalXp,
        level
      };
    });

    const rankedUsers = userStats
      .filter(user => user.level > 0)
      .sort((a, b) => b.level - a.level || b.totalXp - a.totalXp);

    await client.close();
    return Response.json(rankedUsers);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return Response.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
