//server\controllers\authController.js
const db = require('../db');  
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret'; // ควรเก็บใน .env


///Register ///
exports.registerUser = async (req, res) => {
  const {
    Title, FirstName, LastName, Phone,
    Email, Password, Address,
    Province_ID, District_ID, Subdistrict_ID, PostalCode
  } = req.body;

  if (!Email || !Password) {
    return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
  }

  try {
    // 1. เช็คว่า Email ซ้ำไหม
    const [existingUsers] = await db.query(
      'SELECT * FROM member WHERE Email = ?', 
      [Email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }   

    // 2. เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(Password, 10);

    // 3. บันทึกข้อมูล
    await db.query(
      `INSERT INTO member 
       (Title, FirstName, LastName, Phone, Email, Password, Address, Province_ID, District_ID, Subdistrict_ID, PostalCode) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Title || null,
        FirstName || null,
        LastName || null,
        Phone || null,
        Email,
        hashedPassword,
        Address || null,
        Province_ID || null,
        District_ID || null,
        Subdistrict_ID || null,
        PostalCode || null
      ]
    );

    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ' });
  } catch (err) {
    console.error('Error registerUser:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
  }
};

exports.loginUser = async (req, res) => {
    const { Email, Password } = req.body;
    if (!Email || !Password) {
        return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }
    try {
        // [ถูกต้อง] ดึงข้อมูลจากตาราง member
        const [users] = await db.query('SELECT * FROM member WHERE Email = ?', [Email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(Password, user.Password);
        if (!isMatch) {
            return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        const token = jwt.sign(
            { id: user.Member_ID, role: user.Role }, 
            process.env.JWT_SECRET,                   
            { expiresIn: '1h' }
        );
        
        // Log เพื่อตรวจสอบค่า JWT_SECRET ที่ใช้
        console.log('[Login Function] JWT_SECRET used to SIGN:', process.env.JWT_SECRET);

        res.json({
            message: 'เข้าสู่ระบบสำเร็จ',
            token,
            user: {
                id: user.Member_ID,
                email: user.Email,
                role: user.Role
            }
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
};



exports.getUserProfile = async (req, res) => {
       try {
           // ใช้ req.user.id ที่ได้มาจาก authMiddleware (ซึ่งก็คือ Member_ID)
          const [rows] = await db.query(
            // v--- เปลี่ยนชื่อตารางเป็น 'member'
          'SELECT Member_ID, Title, FirstName, LastName, Phone, Email, Address, Province_ID, District_ID, Subdistrict_ID, PostalCode, Role FROM member WHERE Member_ID = ?', 
            //                                                                                                                       ^--- เปลี่ยนชื่อคอลัมน์เป็น 'Member_ID'
           [req.user.id]
        );

          if (rows.length === 0) {
          return res.status(404).json({ message: 'User not found' });
         }
       res.json(rows[0]);
    } catch (error) {
         console.error("Error in getUserProfile:", error);
         res.status(500).json({ message: 'Server error while fetching profile.' });
     }
};
// [เพิ่ม] ฟังก์ชันสำหรับอัปเดตโปรไฟล์
exports.updateUserProfile = async (req, res) => {
    // รับค่าทั้งหมดที่ส่งมาจากฟอร์ม Frontend
    const {
        Title,
        FirstName,
        LastName,
        Phone,
        Address,
        Province_ID,
        District_ID,
        Subdistrict_ID,
        PostalCode
    } = req.body;

    // ตรวจสอบว่า req.user.id มีค่าหรือไม่ (มาจาก Middleware)
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized: No user ID found' });
    }
    const memberId = req.user.id;

    try {
        // สร้าง SQL Query สำหรับอัปเดตทุกฟิลด์
        const sql = `
            UPDATE member 
            SET 
                Title = ?, 
                FirstName = ?, 
                LastName = ?, 
                Phone = ?, 
                Address = ?, 
                Province_ID = ?, 
                District_ID = ?, 
                Subdistrict_ID = ?, 
                PostalCode = ?
            WHERE Member_ID = ?`;

        // สร้าง Array ของค่าที่จะใส่ลงใน Query
        const values = [
            Title,
            FirstName,
            LastName,
            Phone,
            Address,
            Province_ID,
            District_ID,
            Subdistrict_ID,
            PostalCode,
            memberId
        ];

        await db.query(sql, values);
        res.json({ message: 'อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว' });

    } catch (error) {
        console.error("Error updating profile:", error); // แสดง error ใน console ของ server
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
    }
};

// [เพิ่ม] ฟังก์ชันสำหรับเปลี่ยนรหัสผ่าน
exports.changePassword = async (req, res) => {
     const { currentPassword, newPassword } = req.body;
        try {
        //                       v--- เปลี่ยนเป็น 'member' v--- เปลี่ยนเป็น 'Member_ID'
        const [rows] = await db.query('SELECT Password FROM member WHERE Member_ID = ?', [req.user.id]);
        if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
        }
        const user = rows[0];

         const isMatch = await bcrypt.compare(currentPassword, user.Password);
         if (!isMatch) {
           return res.status(400).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
       }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        //            v--- เปลี่ยนเป็น 'member'                         v--- เปลี่ยนเป็น 'Member_ID'
         await db.query('UPDATE member SET Password = ? WHERE Member_ID = ?', [hashedPassword, req.user.id]);
         res.json({ message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' });

      } catch (error) {
         res.status(500).json({ message: 'Server error on password change' });
      }
};