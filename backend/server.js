// app.js
const express = require('express');
const app = express();
const path = require('path');
const barcodeRoutes = require('./routes/barcode');
const db = require('./db');
const cors = require('cors');

// Enable CORS for all routes
app.use(cors());

app.use(express.json());

// Static folder to serve barcode images
app.use('/barcodes', express.static(path.join(__dirname, 'barcodes')));

// Use the barcode routes
app.use('/api', barcodeRoutes);

// Connect to the database and start the server
db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ', err);
        process.exit(1);
    } else {
        console.log('Connected to MySQL');
        app.listen(5000, () => {
            console.log('Server started on http://localhost:5000');
        });
    }
});
