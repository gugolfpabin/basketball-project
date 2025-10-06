// // backend/controllers/uploadController.js
// const multer = require('multer');
// const path = require('path');

// // Configure storage for uploaded files
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(__dirname, '../public/images'));
//   },
//   filename: (req, file, cb) => {

//     cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//   },
// });

// // Create the multer upload middleware
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
//   fileFilter: (req, file, cb) => {

//     const filetypes = /jpeg|jpg|png|gif/;
//     const mimetype = filetypes.test(file.mimetype);
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       cb(new Error('Only images (jpeg, jpg, png, gif) are allowed!'));
//     }
//   },
// }).array('images', 5); // 'images' is the field name in the form, allow up to 5 files

// // Controller function to handle image upload
// exports.uploadImages = (req, res) => {
//   upload(req, res, (err) => {
//     if (err) {
//       console.error('Multer upload error:', err);
//       // Check if it's a Multer error specifically
//       if (err instanceof multer.MulterError) {
//         if (err.code === 'LIMIT_FILE_SIZE') {
//           return res.status(400).json({ message: 'File size too large. Max 5MB per image.' });
//         }
//         // Other Multer errors can be handled here
//       }
//       return res.status(400).json({ message: err.message });
//     }

//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ message: 'No image files uploaded.' });
//     }

//     // Map uploaded files to their accessible URLs
//     const imageUrls = req.files.map(file => {
//       return `http://localhost:5000/images/${file.filename}`;
//     });

//     res.status(200).json({
//       message: 'Images uploaded successfully!',
//       imageUrls: imageUrls,
//     });
//   });
// };
// backend/controllers/uploadController.js
const multer = require('multer');
const path = require('path');

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/images'));
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png, gif) are allowed!'));
    }
  },
}).array('images', 5); // field name = 'images'

exports.uploadImages = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size too large. Max 5MB per image.' });
        }
      }
      return res.status(400).json({ message: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No image files uploaded.' });
    }

    const imageUrls = req.files.map(file => `http://localhost:5000/images/${file.filename}`);

    // คืนค่าให้ครอบคลุมหลายรูปแบบที่ frontend อาจคาดหวัง
    res.status(200).json({
      message: 'Images uploaded successfully!',
      success: true,
      imageUrls,                 // array of urls
      PictureURLs: imageUrls,    // alias
      PictureURL: imageUrls[0],  // first image (convenience)
    });
  });
};
