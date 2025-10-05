//server/index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const db = require('./db');


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.put('/api/test-body', (req, res) => {
  console.log('--- TESTING /api/test-body ---');
  console.log('Received body:', req.body); // เราจะดู Log จากตรงนี้
  console.log('--- END TEST ---');
  res.status(200).json({
      message: 'Test successful',
      receivedBody: req.body
  });
});

const authRoutes = require('./routes/authRoutes');
const locationRoutes = require('./routes/locationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const productRoutes = require('./routes/admin/productRoutes');
const orderRoutes = require('./routes/admin/orderRoutes');
const adminOrderRoutes = require('./routes/admin/orderRoutes');
const adminReportRoutes = require('./routes/admin/reportRoutes');

app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/reports', adminReportRoutes);


app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);


app.use('/api', productRoutes);
app.use('/api', categoryRoutes);
app.use('/api', locationRoutes);
app.use('/api', authRoutes);
app.use('/api', uploadRoutes);





const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
