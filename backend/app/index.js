// app.js
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import dotenv from 'dotenv';

import barcodeRoutes from './routes/barcode.js';
import pool from './db.js';
import userRouter from './routes/userRoute.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middlewares
app.use(cors());
app.use(express.json());                    // Fixed: use express.json()
app.use(express.urlencoded({ extended: true }));

// Serve static barcode images
app.use('/barcodes', express.static(join(__dirname, 'barcodes')));

// API Routes
app.use('/api', barcodeRoutes);
app.use('/api/import-users', userRouter);

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Attendance Backend is running!' });
});

// Graceful shutdown (recommended)
const shutdown = async () => {
    console.log('Shutting down server...');
    await pool.end();   // Close database pool
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server (no need for pool callback)
const startServer = async () => {
    try {
        // Test database connection
        const connection = await pool.getConnection();
        console.log('✅ Connected to MySQL successfully');
        connection.release();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
};

startServer();