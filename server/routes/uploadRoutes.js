const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// 1. ตั้งค่า Destination และ Filename สำหรับ Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // กำหนดโฟลเดอร์ที่จะบันทึกไฟล์ (ต้องมีโฟลเดอร์นี้อยู่จริง)
    // path.resolve() ช่วยให้หา path ได้ถูกต้องไม่ว่าจะรัน server จากที่ไหน
    cb(null, path.resolve(__dirname, '..', 'public/images')); 
  },
  filename: (req, file, cb) => {
    // สร้างชื่อไฟล์ใหม่ไม่ให้ซ้ำกัน (image-timestamp.ext)
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  },
});

// 2. สร้าง Middleware ของ Multer
const upload = multer({ storage: storage });

// 3. สร้าง Route Endpoint สำหรับรับไฟล์รูปภาพ
// สังเกตว่า path คือ '/upload-images' เฉยๆ เพราะ '/api' ถูกกำหนดไว้ใน index.js แล้ว
router.post('/upload-images', upload.single('image'), (req, res) => {
  // ตรวจสอบว่ามีไฟล์ถูกอัปโหลดมาหรือไม่
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  // ถ้าสำเร็จ สร้าง URL เต็มของรูปภาพเพื่อส่งกลับไปให้ Frontend
  const imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
  
  // ส่ง Response กลับไปพร้อมกับ imageUrl ที่ Frontend ต้องการ
  res.json({ success: true, imageUrl: imageUrl });
});

module.exports = router;