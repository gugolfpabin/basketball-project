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

// login //
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

    // สร้าง JWT token
    const token = jwt.sign(
      { Member_ID: user.Member_ID, Email: user.Email, Role: user.Role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'เข้าสู่ระบบสำเร็จ', token, user: { id: user.Member_ID, email: user.Email, role: user.Role  } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

