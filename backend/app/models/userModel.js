import pool from '../db.js';

const createUser = async (empid, name, designation, department, sbu) => {
    const [result] = await pool.execute(
        'INSERT INTO users (emp_id, name, designation, department, sbu) VALUES (?, ?, ?, ?, ?)',
        [empid, name, designation, department, sbu]
    );
    return result.insertId;
};

const getAllUsers = async () => {
    const [results] = await pool.execute('SELECT id, emp_id, name, designation, department, sbu, barcode, is_present FROM users');
    return results;
};

const getAllAttendedUsers = async () => {
    const [results] = await pool.execute('SELECT id, emp_id, name, designation, department, sbu, barcode, is_present FROM users WHERE is_present = 1');
    return results;
};

const getCompanywiseAttendance = async () => {
    const sql = `
        SELECT sbu,
            SUM(CASE WHEN is_present = 1 THEN 1 ELSE 0 END) AS total_present
        FROM users
        GROUP BY sbu
    `;
    const [results] = await pool.execute(sql);
    return results;
};

const getAllUsersWithoutBarcode = async () => {
    const [results] = await pool.execute(
        'SELECT id, emp_id, name, designation, department, sbu, barcode, is_present FROM users WHERE barcode IS NULL'
    );
    return results;
};

const getAllUsersWithBarcode = async () => {
    const [results] = await pool.execute(
        'SELECT id, emp_id, name, designation, department, sbu, barcode, is_present FROM users WHERE barcode IS NOT NULL'
    );
    return results;
};

const updateBarcode = async (userId, barcodeFile) => {
    const [result] = await pool.execute(
        'UPDATE users SET barcode = ? WHERE id = ?',
        [barcodeFile, userId]
    );
    return result;
};

const markAttendance = async (userId) => {
    const [result] = await pool.execute(
        'UPDATE users SET is_present = 1 WHERE id = ?',
        [userId]
    );
    return result;
};

const getUserDetails = async (userId) => {
    const [result] = await pool.execute(
        'SELECT id, emp_id, name, designation, department, sbu, barcode, is_present FROM users WHERE id = ?',
        [userId]
    );
    return result[0];
};

const UserModel = {
    createUser,
    getAllUsers,
    getAllAttendedUsers,
    getCompanywiseAttendance,
    getAllUsersWithoutBarcode,
    getAllUsersWithBarcode,
    updateBarcode,
    markAttendance,
    getUserDetails
};

export default UserModel;
