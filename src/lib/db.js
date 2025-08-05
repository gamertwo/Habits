// lib/db.js - Database connection and utilities
import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'challenge_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',
  supportBigNumbers: true,
  bigNumberStrings: true,
  dateStrings: false,
  debug: false,
  multipleStatements: false,
  reconnect: true,
  ssl: false
};

// Create connection pool with error handling
let pool;

export const getConnection = async () => {
  if (!pool) {
    try {
      pool = mysql.createPool(dbConfig);
      
      // Test the connection
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      
      console.log('✅ Database connection pool created successfully');
    } catch (error) {
      console.error('❌ Failed to create database connection pool:', error.message);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }
  return pool;
};

// Challenge-related database operations
export const challengeQueries = {
  // Get all active challenges
  getAllChallenges: async () => {
    try {
      const connection = await getConnection();
      const [rows] = await connection.execute(`
        SELECT c.*, 
               COUNT(cp.id) as total_progress,
               COUNT(CASE WHEN cp.is_completed = true THEN 1 END) as completed_days,
               ROUND((COUNT(CASE WHEN cp.is_completed = true THEN 1 END) / c.total_days) * 100, 1) as completion_percentage
        FROM challenges c
        LEFT JOIN challenge_progress cp ON c.id = cp.challenge_id
        WHERE c.is_active = true
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `);
      return rows;
    } catch (error) {
      console.error('getAllChallenges error:', error);
      throw error;
    }
  },

  // Get challenge by ID with progress
  getChallengeById: async (id) => {
    const connection = await getConnection();
    const [challengeRows] = await connection.execute(`
      SELECT * FROM challenges WHERE id = ? AND is_active = true
    `, [id]);
    
    if (challengeRows.length === 0) return null;
    
    const [progressRows] = await connection.execute(`
      SELECT * FROM challenge_progress 
      WHERE challenge_id = ? 
      ORDER BY day_number ASC
    `, [id]);
    
    return {
      ...challengeRows[0],
      progress: progressRows
    };
  },

  // Create new challenge
  createChallenge: async (challengeData) => {
    const connection = await getConnection();
    const { title, description, totalDays, startDate, colorScheme } = challengeData;
    
    // Calculate end date
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalDays - 1);
    
    const [result] = await connection.execute(`
      INSERT INTO challenges (title, description, total_days, start_date, end_date, color_scheme)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [title, description, totalDays, startDate, endDate.toISOString().split('T')[0], colorScheme]);
    
    // Create progress entries for each day
    const challengeId = result.insertId;
    const progressEntries = [];
    
    for (let day = 1; day <= totalDays; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + day - 1);
      progressEntries.push([challengeId, day, currentDate.toISOString().split('T')[0]]);
    }
    
    await connection.execute(`
      INSERT INTO challenge_progress (challenge_id, day_number, date)
      VALUES ${progressEntries.map(() => '(?, ?, ?)').join(', ')}
    `, progressEntries.flat());
    
    return challengeId;
  },

  // Toggle day completion
  toggleDayCompletion: async (challengeId, dayNumber) => {
    const connection = await getConnection();
    
    // Get current status
    const [current] = await connection.execute(`
      SELECT is_completed FROM challenge_progress 
      WHERE challenge_id = ? AND day_number = ?
    `, [challengeId, dayNumber]);
    
    if (current.length === 0) return false;
    
    const newStatus = !current[0].is_completed;
    const completedAt = newStatus ? new Date() : null;
    
    await connection.execute(`
      UPDATE challenge_progress 
      SET is_completed = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE challenge_id = ? AND day_number = ?
    `, [newStatus, completedAt, challengeId, dayNumber]);
    
    return newStatus;
  },

  // Update challenge notes
  updateDayNotes: async (challengeId, dayNumber, notes) => {
    const connection = await getConnection();
    await connection.execute(`
      UPDATE challenge_progress 
      SET notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE challenge_id = ? AND day_number = ?
    `, [notes, challengeId, dayNumber]);
  },

  // Get day notes
  getDayNotes: async (challengeId, dayNumber) => {
    const connection = await getConnection();
    const [rows] = await connection.execute(`
      SELECT notes FROM challenge_progress 
      WHERE challenge_id = ? AND day_number = ?
    `, [challengeId, dayNumber]);
    
    return rows.length > 0 ? rows[0].notes : '';
  },

  // Update challenge details
  updateChallenge: async (challengeId, updateData) => {
    const connection = await getConnection();
    const { title, description, colorScheme } = updateData;
    
    await connection.execute(`
      UPDATE challenges 
      SET title = ?, description = ?, color_scheme = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [title, description, colorScheme, challengeId]);
  },

  // Delete challenge
  deleteChallenge: async (id) => {
    const connection = await getConnection();
    await connection.execute(`
      UPDATE challenges SET is_active = false WHERE id = ?
    `, [id]);
  },

  // Get challenge statistics
  getChallengeStats: async (challengeId) => {
    const connection = await getConnection();
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_days,
        COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_days,
        COUNT(CASE WHEN is_completed = false THEN 1 END) as remaining_days,
        MAX(CASE WHEN is_completed = true THEN day_number END) as longest_streak,
        ROUND(AVG(CASE WHEN is_completed = true THEN 1 ELSE 0 END) * 100, 1) as completion_rate
      FROM challenge_progress 
      WHERE challenge_id = ?
    `, [challengeId]);
    
    return stats[0];
  }
};

// Initialize database (run this once)
export const initializeDatabase = async () => {
  try {
    const connection = await getConnection();
    console.log('Database connected successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};