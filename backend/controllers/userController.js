const bwipjs = require('bwip-js');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const PDFDocument = require('pdfkit');

const User = require('../models/userModel');

// Ensure the barcode directory exists
const barcodeDir = path.join(__dirname, '../barcodes');
if (!fs.existsSync(barcodeDir)) {
    fs.mkdirSync(barcodeDir);
}

// Controller to generate barcode for a user
exports.createUser = async (req, res) => {
    const { name, empid, designation, company } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }
    if (!empid) {
        return res.status(400).json({ message: 'Employee ID is required' });
    }
    if (!designation) {
        return res.status(400).json({ message: 'Designation is required' });
    }
    if (!company) {
        return res.status(400).json({ message: 'Company is required' });
    }

    try {
        const userId = await User.createUser(name, empid, designation, company);
        const barcodeText = `${empid}`;
        const barcodeFileName = `barcode-${userId}.png`;
        const filePath = path.join(barcodeDir, barcodeFileName);

        const barcodeBuffer = await bwipjs.toBuffer({
            bcid:        'code128',
            text:        barcodeText,
            scale:       3,
            height:      10,
            includetext: true,
            textxalign:  'center',
            textsize:    12
        });

        fs.writeFileSync(filePath, barcodeBuffer);

        const updatedUsers = [];

        // Store the barcode file name in the database
        await User.updateBarcode(userId, barcodeFileName);

        const users = await User.getUserDetails(userId);

        updatedUsers.push({
            id: user.id,
            emp_id: user.emp_id,
            name: user.name,
            company_name: user.company_name,
            barcode: `http://localhost:5000/barcodes/${fileName}`
        });

        res.json({
            message: 'Barcode generated successfully',
            id: userId,
            users,
            file: `http://localhost:5000/barcodes/${barcodeFileName}`
        });
    } catch (err) {
        res.status(500).json({ message: 'Error generating barcode', error: err });
    }
};

// Controller to generate barcode for a user
exports.generateBarcode = async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }

    try {
        const userId = await User.createUser(name);
        const barcodeText = `USER${userId}`;
        const barcodeFileName = `barcode-${userId}.png`;
        const filePath = path.join(barcodeDir, barcodeFileName);

        const barcodeBuffer = await bwipjs.toBuffer({
            bcid:        'code128',
            text:        barcodeText,
            scale:       3,
            height:      10,
            includetext: true,
            textxalign:  'center',
            textsize:    12
        });

        fs.writeFileSync(filePath, barcodeBuffer);

        // Store the barcode file name in the database
        await User.updateBarcode(userId, barcodeFileName);

        res.json({
            message: 'Barcode generated successfully',
            id: userId,
            file: `http://localhost:5000/barcodes/${barcodeFileName}`
        });
    } catch (err) {
        res.status(500).json({ message: 'Error generating barcode', error: err });
    }
};


// Controller to generate barcode for all user
exports.generateBarcodes = async (req, res) => {
    try {

        const users = await User.getAllUsersWithoutBarcode();

        if (users.length === 0) {
            return res.json({ message: 'All users already have barcodes' });
        }

        const updatedUsers = [];

        for (const user of users) {
            const barcodeText = `${user.emp_id}`;
            const fileName = `barcode-${user.id}.png`;
            const filePath = path.join(__dirname, '../barcodes', fileName);

            try {
                const png = await bwipjs.toBuffer({
                    bcid: 'code128',
                    text: barcodeText,
                    scale: 3,
                    height: 10,
                    includetext: true,
                    textxalign: 'center',
                    textsize: 12
                });

                fs.writeFileSync(filePath, png);

                await User.updateBarcode(user.id, fileName)

                updatedUsers.push({
                    id: user.id,
                    emp_id: user.emp_id,
                    name: user.name,
                    company_name: user.company_name,
                    barcode: `http://localhost:5000/barcodes/${fileName}`
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
};

// Controller to get a list of all barcodes
exports.getBarcodeList = async (req, res) => {
    try {
        const users = await User.getAllUsers();
        res.json(users.map(user => ({
            id: user.id,
            emp_id: user.emp_id,
            name: user.name,
            company_name: user.company_name,
            barcode: `http://localhost:5000/barcodes/${user.barcode}`
        })));
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving barcode list', error: err });
    }
};

// Controller to get a list of all barcodes
exports.getAttendedList = async (req, res) => {
    try {
        const users = await User.getAllAttendedUsers();
        res.json(users.map(user => ({
            id: user.id,
            emp_id: user.emp_id,
            name: user.name,
            company_name: user.company_name,
            is_present: user.is_present,
            barcode: `http://localhost:5000/barcodes/${user.barcode}`
        })));
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving barcode list', error: err });
    }
};
// Controller to get a list of all barcodes
exports.getAttendenceSummery = async (req, res) => {
    try {
        const datas = await User.getCompanywiseAttendance();
        res.json(datas.map(data => ({
            company_name: data.company_name,
            total_present: data.total_present,
        })));
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving barcode list', error: err });
    }
};

// Controller to mark attendance
exports.markAttendance = async (req, res) => {
    const { barcode } = req.body;

    try {
        const user = await User.getAllUsers();  // You can modify this to retrieve a user by barcode
        const userId = user.find(u => u.emp_id === barcode)?.id;

        if (!userId) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.markAttendance(userId);

        const result = await User.getUserDetails(userId);

        if (result.length === 0) {
            return res.status(404).json({ isFound: false, message: 'User not found' });
        }

        const userDetails = result[0];

        res.json({
            message: 'Attendance marked successfully',
            userId,
            name: userDetails.name,
            emp_id: userDetails.emp_id,
            designation: userDetails.designation,
            company_name: userDetails.company_name,
            isFound: true
        });
    } catch (err) {
        res.status(500).json({ message: 'Error marking attendance', error: err });
    }
};

exports.downloadBarcodes = async (req, res) => {
    const zipPath = path.join(__dirname, '../barcodes.zip');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', function () {
        res.download(zipPath, 'barcodes.zip', (err) => {
            if (err) console.error('Download error:', err);
            fs.unlink(zipPath, () => {}); // Silent cleanup
        });
    });

    archive.on('error', function (err) {
        console.error('Archive error:', err);
        res.status(500).json({ error: err.message });
    });

    archive.pipe(output);

    try {
        const users = await User.getAllUsersWithBarcode();

        if (!users.length) {
            return res.status(400).json({ message: 'No users found with barcodes.' });
        }

        // Add barcode images
        users.forEach(user => {
            const filePath = path.join(__dirname, '../barcodes', user.barcode);
            if (fs.existsSync(filePath)) {
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
};

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

exports.previewPdfList = async (req, res) => {
    const users = await User.getAllUsersWithBarcode(); // Fetch users with barcode data

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const filePath = path.join(__dirname, '../temp', 'user-barcodes.pdf');

    // Ensure the temp folder exists
    if (!fs.existsSync(path.join(__dirname, '../temp'))) {
        fs.mkdirSync(path.join(__dirname, '../temp'));
    }

    const stream = fs.createWriteStream(filePath);
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
        const barcodePath = path.join(__dirname, '../barcodes', user.barcode);
    
        if (fs.existsSync(barcodePath)) {
            // Draw barcode
            doc.image(barcodePath, x, y, { width: 100, height: 30 });
    
            // Draw text below barcode
            doc.fontSize(10)
                .text(`${user.name}`, x, y + 35)
                .text(`${user.designation || 'N/A'}`, x, y + 50)
                .text(`${user.company_name || 'N/A'}`, x, y + 65);
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
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    });
};