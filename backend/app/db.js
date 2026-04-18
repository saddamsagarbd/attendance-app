import mysql from 'mysql2/promise';
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'attendance_app',
    waitForConnections: true,
    connectionLimit: 15,          // Slightly increased (good for small-medium app)
    maxIdle: 10,
    idleTimeout: 60000,           // 60 seconds
    queueLimit: 0,
    enableKeepAlive: true,
});

export default pool;