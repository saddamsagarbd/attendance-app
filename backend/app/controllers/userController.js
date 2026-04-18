import { toBuffer } from 'bwip-js';
import { existsSync, mkdirSync, writeFileSync, createWriteStream, unlink, createReadStream } from 'fs';
import archiver from 'archiver';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import UserModel from '../models/userModel.js';

// Ensure the barcode directory exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const barcodeDir = join(__dirname, '../barcodes');
if (!existsSync(barcodeDir)) {
    mkdirSync(barcodeDir);
}

// Controller to generate barcode for a user
const createUserC = async(req, res) => {
    const { name, empid, designation, department, sbu } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }
    if (!empid) {
        return res.status(400).json({ message: 'Employee ID is required' });
    }
    if (!designation) {
        return res.status(400).json({ message: 'Designation is required' });
    }
    if (!department) {
        return res.status(400).json({ message: 'Designation is required' });
    }
    if (!sbu) {
        return res.status(400).json({ message: 'Company is required' });
    }

    try {
        const userId = await UserModel.createUser(name, empid, designation, department, sbu);
        const barcodeText = `${empid}`;
        const fileName = `barcode-${userId}.png`;
        const filePath = join(barcodeDir, fileName);

        const barcodeBuffer = await toBuffer({
            bcid:        'code128',
            text:        barcodeText,
            scale:       3,
            height:      10,
            includetext: true,
            textxalign:  'center',
            textsize:    12
        });

        writeFileSync(filePath, barcodeBuffer);

        const updatedUsers = [];

        // Store the barcode file name in the database
        await updateBarcode(userId, fileName);

        const users = await UserModel.getUserDetails(userId);

        updatedUsers.push({
            id: user.id,
            emp_id: user.emp_id,
            name: user.name,
            sbu: user.sbu,
            designation: user.designation,
            department: user.department,
            barcode: `${process.env.BASE_URL}/barcodes/${fileName}`
        });

        res.json({
            message: 'Barcode generated successfully',
            id: userId,
            users,
            file: `${process.env.BASE_URL}/barcodes/${fileName}`
        });
    } catch (err) {
        res.status(500).json({ message: 'Error generating barcode', error: err });
    }
}

const createUserInternal = async(userData) => {
    const { emp_id, name, designation, department, sbu } = userData;

    if (!name) {
        return { message: 'Name is required' };
    }
    if (!emp_id) {
        return { message: 'Employee ID is required' };
    }
    if (!designation) {
        return { message: 'Designation is required' };
    }
    if (!department) {
        return { message: 'Designation is required' };
    }
    if (!sbu) {
        return { message: 'Company is required' };
    }

    try {
        const userId = await UserModel.createUser(emp_id, name, designation, department, sbu);
        const barcodeText = `${emp_id}`;
        const fileName = `barcode-${userId}.png`;
        const filePath = join(barcodeDir, fileName);

        const barcodeBuffer = await toBuffer({
            bcid:        'code128',
            text:        barcodeText,
            scale:       3,
            height:      10,
            includetext: true,
            textxalign:  'center',
            textsize:    12
        });

        writeFileSync(filePath, barcodeBuffer);

        const updatedUsers = [];

        // Store the barcode file name in the database
        await UserModel.updateBarcode(userId, fileName);

        const user = await UserModel.getUserDetails(userId);

        // updatedUsers.push({
        //     id: user.id,
        //     emp_id: user.emp_id,
        //     name: user.name,
        //     sbu: user.sbu,
        //     designation: user.designation,
        //     department: user.department,
        //     barcode: `${process.env.BASE_URL}/barcodes/${fileName}`
        // });

        return {
            id: user.id,
            emp_id: user.emp_id,
            name: user.name,
            sbu: user.sbu,
            designation: user.designation,
            department: user.department,
            barcode: `${process.env.BASE_URL}/barcodes/${fileName}`
        };
    } catch (err) {
        return { message: 'Error generating barcode', error: err.message };
    }
}

const saveUsersC = async (req, res) => {
    const { users } = req.body;

    if (!users || users.length === 0) {
        return res.status(400).json({ message: 'Empty user list' });
    }

    try {
        const results = await Promise.all(
            users.map(user => createUserInternal(user))   // see below
        );

        res.json({
            success: true,
            message: 'All users created successfully',
            count: results.length,
            users: results
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: 'Error creating users', 
            error: error.message 
        });
    }

}

// Controller to generate barcode for a user
const generateBarcodeC = async(req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }

    try {
        const userId = await UserModel.createUser(name);
        const barcodeText = `USER${userId}`;
        const barcodeFileName = `barcode-${userId}.png`;
        const filePath = join(barcodeDir, barcodeFileName);

        const barcodeBuffer = await toBuffer({
            bcid:        'code128',
            text:        barcodeText,
            scale:       3,
            height:      10,
            includetext: true,
            textxalign:  'center',
            textsize:    12
        });

        writeFileSync(filePath, barcodeBuffer);

        // Store the barcode file name in the database
        await UserModel.updateBarcode(userId, barcodeFileName);

        res.json({
            message: 'Barcode generated successfully',
            id: userId,
            file: `${process.env.BASE_URL}/barcodes/${barcodeFileName}`
        });
    } catch (err) {
        res.status(500).json({ message: 'Error generating barcode', error: err });
    }
}


// Controller to generate barcode for all user
const generateBarcodesC = async(req, res) => {
    try {

        const users = await UserModel.getAllUsersWithoutBarcode();

        if (users.length === 0) {
            return res.json({ message: 'All users already have barcodes' });
        }

        const updatedUsers = [];

        for (const user of users) {
            const barcodeText = `${user.emp_id}`;
            const fileName = `barcode-${user.id}.png`;
            const filePath = join(__dirname, '../barcodes', fileName);

            try {
                const png = await toBuffer({
                    bcid: 'code128',
                    text: barcodeText,
                    scale: 3,
                    height: 10,
                    includetext: true,
                    textxalign: 'center',
                    textsize: 12
                });

                writeFileSync(filePath, png);

                await UserModel.updateBarcode(user.id, fileName)

                updatedUsers.push({
                    id: user.id,
                    emp_id: user.emp_id,
                    name: user.name,
                    sbu: user.sbu,
                    designation: user.designation,
                    department: user.department,
                    barcode: `${process.env.BASE_URL}/barcodes/${fileName}`
                });

            } catch (barcodeErr) {
                console.error(`Error generating barcode for user ${user.id}:`, barcodeErr);
            }
        }

        res.status(200).json({
            message: 'Successfully generated',
            users: updatedUsers
        });
    } catch (err) {
        res.status(500).json({ message: 'Error generating barcodes', error: err });
    }
}

// Controller to get a list of all barcodes
const getBarcodeListC = async(req, res) => {
    try {
        const users = await UserModel.getAllUsers();
        res.json(users.map(user => ({
            id: user.id,
            emp_id: user.emp_id,
            name: user.name,
            sbu: user.sbu,
            designation: user.designation,
            department: user.department,
            barcode: `${process.env.BASE_URL}/barcodes/${user.barcode}`
        })));
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving barcode list', error: err });
    }
}

// Controller to get a list of all barcodes
const getAttendedListC = async(req, res) => {
    try {
        const users = await UserModel.getAllAttendedUsers();
        res.json(users.map(user => ({
            id: user.id,
            emp_id: user.emp_id,
            name: user.name,
            sbu: user.sbu,
            designation: user.designation,
            department: user.department,
            barcode: `${process.env.BASE_URL}/barcodes/${user.barcode}`
        })));
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving barcode list', error: err });
    }
}
// Controller to get a list of all barcodes
const getAttendenceSummeryC = async(req, res) => {
    try {
        const datas = await UserModel.getCompanywiseAttendance();
        res.json(datas.map(data => ({
            sbu: data.sbu,
            total_present: data.total_present,
        })));
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving barcode list', error: err });
    }
}

// Controller to mark attendance
const markAttendanceC = async(req, res) => {
    const { barcode } = req.body;

    try {
        const user = await UserModel.getAllUsers();  // You can modify this to retrieve a user by barcode
        const userId = user.find(u => u.emp_id === barcode)?.id;

        if (!userId) {
            return res.status(404).json({ message: 'User not found' });
        }

        await UserModel.markAttendance(userId);

        const result = await UserModel.getUserDetails(userId);

        if (result.length === 0) {
            return res.status(404).json({ isFound: false, message: 'User not found' });
        }

        const userDetails = result[0];

        res.json({
            message: 'Attendance marked successfully',
            userId,
            name: userDetails.name,
            emp_id: userDetails.emp_id,
            sbu: userDetails.sbu,
            designation: userDetails.designation,
            department: userDetails.department,
            isFound: true
        });
    } catch (err) {
        res.status(500).json({ message: 'Error marking attendance', error: err });
    }
}

const downloadBarcodesC = async(req, res) => {
    const zipPath = join(__dirname, '../barcodes.zip');
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', function () {
        res.download(zipPath, 'barcodes.zip', (err) => {
            if (err) console.error('Download error:', err);
            unlink(zipPath, () => {}); // Silent cleanup
        });
    });

    archive.on('error', function (err) {
        console.error('Archive error:', err);
        res.status(500).json({ error: err.message });
    });

    archive.pipe(output);

    try {
        const users = await UserModel.getAllUsersWithBarcode();

        if (!users.length) {
            return res.status(400).json({ message: 'No users found with barcodes.' });
        }

        // Add barcode images
        users.forEach(user => {
            const filePath = join(__dirname, '../barcodes', user.barcode);
            if (existsSync(filePath)) {
                archive.file(filePath, { name: user.barcode });
            }
        });

        // Add user details (you could also generate a CSV if preferred)
        const userDetails = JSON.stringify(users, null, 2);
        archive.append(userDetails, { name: 'users.json' });

        await archive.finalize();
    } catch (err) {
        console.error('Download barcodes error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}

// exports.previewPdfList = async (req, res) => {
//     const users = await User.getAllUsersWithBarcode(); // Ensure this gets users with `barcode`, `name`, `emp_id`, `company_name`

//     const doc = new PDFDocument({ margin: 30, size: 'A4' });
//     const filePath = path.join(__dirname, '../temp', 'user-barcodes.pdf');

//     // Ensure the temp folder exists
//     if (!fs.existsSync(path.join(__dirname, '../temp'))) {
//         fs.mkdirSync(path.join(__dirname, '../temp'));
//     }

//     const stream = fs.createWriteStream(filePath);
//     doc.pipe(stream);

//     // Header
//     doc.fontSize(16).text('User Barcode Report', { align: 'center' }).moveDown();

//     // Table headers
//     const startX = 30;
//     const columnWidths = { sl: 30, name: 150, empId: 100, company: 150, barcode: 100 };
//     const startY = doc.y;

//     doc.fontSize(12).text('SL', startX, startY);
//     doc.text('Name', startX + columnWidths.sl, startY);
//     doc.text('Emp ID', startX + columnWidths.sl + columnWidths.name, startY);
//     doc.text('Company', startX + columnWidths.sl + columnWidths.name + columnWidths.empId, startY);
//     doc.text('Barcode', startX + columnWidths.sl + columnWidths.name + columnWidths.empId + columnWidths.company, startY);

//     doc.moveDown(0.5);

//     users.forEach((user, index) => {
//         const y = doc.y;
//         doc.text(index + 1, startX, y);
//         doc.text(user.name, startX + columnWidths.sl, y);
//         doc.text(user.emp_id, startX + columnWidths.sl + columnWidths.name, y);
//         doc.text(user.company_name, startX + columnWidths.sl + columnWidths.name + columnWidths.empId, y);

//         const barcodePath = path.join(__dirname, '../barcodes', user.barcode);
//         if (fs.existsSync(barcodePath)) {
//             doc.image(barcodePath, startX + columnWidths.sl + columnWidths.name + columnWidths.empId + columnWidths.company, y - 5, {
//                 width: 100,
//                 height: 30
//             });
//         }

//         doc.moveDown(2);
//     });

//     doc.end();

//     stream.on('finish', () => {
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', 'inline; filename="user-barcodes.pdf"');
//         const fileStream = fs.createReadStream(filePath);
//         fileStream.pipe(res);
//     });
// };

const previewPdfListC = async(req, res) => {
    const users = await UserModel.getAllUsersWithBarcode(); // Fetch users with barcode data

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const filePath = join(__dirname, '../temp', 'user-barcodes.pdf');

    // Ensure the temp folder exists
    if (!existsSync(join(__dirname, '../temp'))) {
        mkdirSync(join(__dirname, '../temp'));
    }

    const stream = createWriteStream(filePath);
    doc.pipe(stream);

    // Header (optional, if you want to add a title)
    doc.fontSize(18).text('User Barcode List', { align: 'center' });
    doc.moveDown(2); // Move down to create space for the content
    
    let x = 30;
    let y = doc.y;
    let count = 0;

    // users.forEach((user, index) => {
    //     const y = doc.y;

    //     // Add barcode image
    //     const barcodePath = path.join(__dirname, '../barcodes', user.barcode);
    //     if (fs.existsSync(barcodePath)) {
    //         doc.image(barcodePath, 30, y, { width: 100, height: 30 });
    //     }

    //     // Add user name, designation, and company below the barcode
    //     doc.fontSize(10)
    //         .text(`${user.name}`, 30, y + 35)
    //         .text(`${user.designation || 'N/A'}`, 30, y + 50)
    //         .text(`${user.company_name || 'N/A'}`, 30, y + 65);

    //     // Add some space after each entry
    //     doc.moveDown(2);

    //     // Optional: To prevent overlapping content, check if it's too close to the bottom and start a new page
    //     if (doc.y > 700) {
    //         doc.addPage();
    //     }
    // });

    users.forEach((user, index) => {
        const barcodePath = join(__dirname, '../barcodes', user.barcode);
    
        if (existsSync(barcodePath)) {
            // Draw barcode
            doc.image(barcodePath, x, y, { width: 100, height: 30 });
    
            // Draw text below barcode
            doc.fontSize(10)
                .text(`${user.name}`, x, y + 35)
                .text(`${user.designation || 'N/A'}`, x, y + 50)
                .text(`${user.department || 'N/A'}, ${user.sbu || 'N/A'}`, x, y + 65);
        }
    
        count++;
    
        if (count % 3 === 0) {
            // After every 3 items, go to the next row
            y += 90; // Move Y position down
            x = 30;  // Reset X to left margin
    
            if (y > 700) {
                doc.addPage();
                y = 30;
            }
        } else {
            // Move X to the next column (rough spacing)
            x += 180;
        }
    });
    doc.end();

    stream.on('finish', () => {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="user-barcodes.pdf"');
        const fileStream = createReadStream(filePath);
        fileStream.pipe(res);
    });
}

const userController = {
    createUserC,
    generateBarcodeC,
    generateBarcodesC,
    getBarcodeListC,
    getAttendedListC,
    getAttendenceSummeryC,
    markAttendanceC,
    downloadBarcodesC,
    previewPdfListC,
    saveUsersC
}

export default userController;