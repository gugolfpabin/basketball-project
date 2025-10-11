const db = require('../db');  
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret'; 


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
    // เช็คว่า Email ซ้ำไหม
    const [existingUsers] = await db.query(
      'SELECT * FROM member WHERE Email = ?', 
      [Email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }   

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(Password, 10);

    // บันทึกข้อมูล
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
          const [rows] = await db.query(
          'SELECT Member_ID, Title, FirstName, LastName, Phone, Email, Address, Province_ID, District_ID, Subdistrict_ID, PostalCode, Role FROM member WHERE Member_ID = ?', 
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


exports.updateUserProfile = async (req, res) => {
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

    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized: No user ID found' });
    }
    const memberId = req.user.id;

    try {
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
        console.error("Error updating profile:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
    }
};

exports.changePassword = async (req, res) => {
     const { currentPassword, newPassword } = req.body;
        try {
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
        
         await db.query('UPDATE member SET Password = ? WHERE Member_ID = ?', [hashedPassword, req.user.id]);
         res.json({ message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' });

      } catch (error) {
         res.status(500).json({ message: 'Server error on password change' });
      }
};
