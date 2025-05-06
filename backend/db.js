const mysql = require('mysql2');

// Create a connection to the database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Your MySQL username
    password: 'root', // Your MySQL password (empty if no password set)
    database: 'barcode_app', // Replace with your database name
    port: 8889,
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the MySQL database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

module.exports = connection;

