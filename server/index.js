//server/index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const db = require('./db');

const authRoutes = require('./routes/authRoutes');
const locationRoutes = require('./routes/locationRoutes');
const productRoutes = require('./routes/productRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', categoryRoutes);
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/api', locationRoutes);
app.use('/api', authRoutes);
app.use('/api', productRoutes);
app.use('/api', uploadRoutes);




app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
