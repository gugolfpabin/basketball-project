const db = require('../db');

exports.getProvinces = async (req, res) => {
  const [rows] = await db.query('SELECT Province_ID, ProvinceName FROM province');
  res.json(rows);
};

exports.getDistricts = async (req, res) => {
  const { provinceId } = req.query;
  const [rows] = await db.query('SELECT District_ID, DistrictName FROM district WHERE Province_ID = ?', [provinceId]);
  res.json(rows);
};

exports.getSubdistricts = async (req, res) => {
  const { districtId } = req.query;
  const [rows] = await db.query('SELECT Subdistrict_ID, SubdistrictName FROM subdistrict WHERE District_ID = ?', [districtId]);
  res.json(rows);
};

exports.getZipcode = async (req, res) => {
  const { subdistrictId } = req.query;
  const [rows] = await db.query('SELECT PostalCode FROM subdistrict WHERE Subdistrict_ID = ?', [subdistrictId]);
  res.json(rows[0]);
};

exports.getProvinces = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT Province_ID, ProvinceName FROM province');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลดจังหวัด' });
  }
};