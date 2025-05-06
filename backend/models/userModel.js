// models/userModel.js
const db = require('../db');

// User Model with database interaction
class User {
    static createUser(name, empid, designation, company) {
        return new Promise((resolve, reject) => {
            db.query('INSERT INTO users (name, emp_id, designation, company_name) VALUES (?,?,?,?)', [name, empid, designation, company], (err, result) => {
                if (err) return reject(err);
                resolve(result.insertId);
            });
        });
    }

    static getAllUsers() {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM users', (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    static getAllAttendedUsers() {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM users WHERE is_present=1', (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    static getCompanywiseAttendance() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT company_name, 
                    SUM(CASE WHEN is_present = 1 THEN 1 ELSE 0 END) AS total_present
                FROM users
                GROUP BY company_name
            `;
            db.query(sql, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }


    static getAllUsersWithoutBarcode() {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM users WHERE barcode IS NULL OR barcode = ""', (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    static getAllUsersWithBarcode() {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM users WHERE barcode IS NOT NULL', (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    static updateBarcode(userId, barcodeFile) {
        return new Promise((resolve, reject) => {
            db.query('UPDATE users SET barcode = ? WHERE id = ?', [barcodeFile, userId], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    static markAttendance(userId) {
        return new Promise((resolve, reject) => {
            db.query('UPDATE users SET is_present = 1 WHERE id = ?', [userId], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    static getUserDetails(userId) {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM users WHERE id = ?', [userId], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }
}

module.exports = User;
