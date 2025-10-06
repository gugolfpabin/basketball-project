import React, { useEffect, useState } from "react";
import axios from "axios";

// Import MUI Components
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  Snackbar,
  InputAdornment,
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; 
import IconButton from '@mui/material/IconButton'; 
import { useNavigate } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
    title: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    provinceId: "",
    districtId: "",
    subdistrictId: "",
    postalCode: ""
  });

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false); // สถานะสำหรับควบคุม Snackbar
  const [snackbarMessage, setSnackbarMessage] = useState(""); // ข้อความใน Snackbar
  const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // ชนิดของ Snackbar (success, error, warning, info)
  const [showPassword, setShowPassword] = useState(false);
  const apiBase = "http://localhost:5000/api";


  // โหลดจังหวัดเมื่อเปิดหน้า
  useEffect(() => {
    axios.get(`${apiBase}/provinces`)
      .then(res => setProvinces(res.data))
      .catch(err => {
        console.error("Error fetching provinces:", err);
        showSnackbar("ไม่สามารถโหลดข้อมูลจังหวัดได้", "error");
      });
  }, []);

  // โหลดอำเภอเมื่อเลือกจังหวัด
  useEffect(() => {
    // เคลียร์ค่าอำเภอ ตำบล รหัสไปรษณีย์ เมื่อจังหวัดเปลี่ยน
    setDistricts([]);
    setSubdistricts([]);
    setForm(prev => ({ ...prev, districtId: "", subdistrictId: "", postalCode: "" }));

    if (form.provinceId) {
      axios.get(`${apiBase}/districts?provinceId=${form.provinceId}`)
        .then(res => setDistricts(res.data))
        .catch(err => {
          console.error("Error fetching districts:", err);
          showSnackbar("ไม่สามารถโหลดข้อมูลอำเภอได้", "error");
        });
    }
  }, [form.provinceId]);

  // โหลดตำบลเมื่อเลือกอำเภอ
  useEffect(() => {
    // เคลียร์ค่าตำบล รหัสไปรษณีย์ เมื่ออำเภอเปลี่ยน
    setSubdistricts([]);
    setForm(prev => ({ ...prev, subdistrictId: "", postalCode: "" }));

    if (form.districtId) {
      axios.get(`${apiBase}/subdistricts?districtId=${form.districtId}`)
        .then(res => setSubdistricts(res.data))
        .catch(err => {
          console.error("Error fetching subdistricts:", err);
          showSnackbar("ไม่สามารถโหลดข้อมูลตำบลได้", "error");
        });
    }
  }, [form.districtId]);

  // โหลดรหัสไปรษณีย์เมื่อเลือกตำบล
  useEffect(() => {
    if (form.subdistrictId) {
      axios.get(`${apiBase}/zipcode?subdistrictId=${form.subdistrictId}`)
        .then(res => {
          setForm(prev => ({ ...prev, postalCode: res.data?.PostalCode || "" }));
        })
        .catch(err => {
          console.error("Error fetching postal code:", err);
          showSnackbar("ไม่สามารถโหลดรหัสไปรษณีย์ได้", "error");
        });
    } else {
      setForm(prev => ({ ...prev, postalCode: "" }));
    }
  }, [form.subdistrictId]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (openSnackbar) {
      setOpenSnackbar(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (openSnackbar) {
      setOpenSnackbar(false);
    }

    if (form.password !== form.confirmPassword) {
      showSnackbar("รหัสผ่านไม่ตรงกัน", "error");
      return;
    }
    // ตรวจสอบฟิลด์ที่จำเป็นทั้งหมด
    if (!form.title || !form.firstName || !form.lastName || !form.phone || !form.email || !form.password || !form.confirmPassword || !form.address || !form.provinceId || !form.districtId || !form.subdistrictId) {
        showSnackbar("กรุณากรอกข้อมูลที่มีเครื่องหมายดอกจัน (*) ให้ครบถ้วน", "warning");
        return;
    }


    try {
      const payload = {
        Title: form.title,
        FirstName: form.firstName,
        LastName: form.lastName,
        Phone: form.phone,
        Email: form.email,
        Password: form.password,
        Address: form.address,
        Province_ID: form.provinceId,
        District_ID: form.districtId,
        Subdistrict_ID: form.subdistrictId,
        PostalCode: form.postalCode
      };

      const res = await axios.post(`${apiBase}/register`, payload);
      showSnackbar("สมัครสมาชิกสำเร็จ! คุณสามารถเข้าสู่ระบบได้แล้ว", "success");
      setTimeout(() => {
        navigate('/login');
    }, 2000);
      // Optional: Clear form after successful registration
      setForm({
        title: "", firstName: "", lastName: "", phone: "", email: "",
        password: "", confirmPassword: "", address: "", provinceId: "",
        districtId: "", subdistrictId: "", postalCode: ""
      });

    } catch (err) {
      console.error("Registration error:", err);
      if (err.response && err.response.status === 409) {
        showSnackbar("อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น", "error");
      } else {
        showSnackbar("เกิดข้อผิดพลาดในการสมัครสมาชิก โปรดลองอีกครั้ง", "error");
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f5f5', // Light gray background
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
        flexDirection: 'column', // เพิ่มเพื่อให้หัวข้อ "ระบบขายเสื้อผ้าบาสเกตบอล" อยู่ด้านบนสุด
      }}
    >
      {/* หัวข้อใหญ่สุดด้านบน: ระบบขายเสื้อผ้าบาสเกตบอล */}
      <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', color: '#333', mb: 4, textAlign: 'center' }}>
        ระบบขายเสื้อผ้าบาสเกตบอล
      </Typography>

      <Box
        sx={{
          maxWidth: '500px',
          width: '100%',
          p: 4,
          bgcolor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', // Soft shadow
          display: 'flex',
          flexDirection: 'column',
          gap: 3, // Space between sections
        }}
      >
        {/* Back Button */}
        <Box sx={{ alignSelf: 'flex-start' }}>
          <IconButton
            onClick={() => window.history.back()}
            color="inherit"
            aria-label="back"
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>

        {/* Header Section - Centered (เฉพาะคำว่า "สมัครสมาชิก") */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography component="h2" variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
            สมัครสมาชิก
          </Typography>
        </Box>

        {/* Form Section */}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Row 1: Title, Phone */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel id="title-label">คำนำหน้า</InputLabel>
              <Select
                labelId="title-label"
                id="title"
                name="title"
                value={form.title}
                label="คำนำหน้า *"
                onChange={handleChange}
              >
                <MenuItem value="">-- เลือกคำนำหน้า --</MenuItem>
                <MenuItem value="นาย">นาย</MenuItem>
                <MenuItem value="นางสาว">นางสาว</MenuItem>
               
              </Select>
            </FormControl>
            <TextField
              label="เบอร์โทรศัพท์ *"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              fullWidth
              required
            />
          </Box>

          {/* Row 2: First Name, Last Name */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label="ชื่อ"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="นามสกุล"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              fullWidth
              required
            />
          </Box>

          {/* Row 3: Email */}
          <TextField
            label="อีเมล"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            required
          />

          {/* Row 4: Password, Confirm Password */}
          <TextField
                      label="รหัสผ่าน"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      fullWidth
                      required
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowPassword}
                              onMouseDown={handleMouseDownPassword}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
          <TextField
            label="ยืนยันรหัสผ่าน"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={handleChange}
            fullWidth
            required
            InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowPassword}
                              onMouseDown={handleMouseDownPassword}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
          />

          {/* Row 5: Address */}
          <TextField
            label="บ้านเลขที่ / ที่อยู่"
            name="address"
            value={form.address}
            onChange={handleChange}
            fullWidth
            required
          />

          {/* New Row for Province & District */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel id="province-label">จังหวัด</InputLabel>
              <Select
                labelId="province-label"
                id="provinceId"
                name="provinceId"
                value={form.provinceId}
                label="จังหวัด "
                onChange={handleChange}
              >
                <MenuItem value="">-- เลือกจังหวัด --</MenuItem>
                {provinces.map(p => (
                  <MenuItem key={p.Province_ID} value={p.Province_ID}>
                    {p.ProvinceName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel id="district-label">อำเภอ</InputLabel>
              <Select
                labelId="district-label"
                id="districtId"
                name="districtId"
                value={form.districtId}
                label="อำเภอ *"
                onChange={handleChange}
                disabled={districts.length === 0 || !form.provinceId} // ปิดถ้ายังไม่มีอำเภอ หรือยังไม่เลือกจังหวัด
              >
                <MenuItem value="">-- เลือกอำเภอ --</MenuItem>
                {districts.map(d => (
                  <MenuItem key={d.District_ID} value={d.District_ID}>
                    {d.DistrictName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* New Row for Subdistrict & Postal Code */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel id="subdistrict-label">ตำบล</InputLabel>
              <Select
                labelId="subdistrict-label"
                id="subdistrictId"
                name="subdistrictId"
                value={form.subdistrictId}
                label="ตำบล *"
                onChange={handleChange}
                disabled={subdistricts.length === 0 || !form.districtId} // ปิดถ้ายังไม่มีตำบล หรือยังไม่เลือกอำเภอ
              >
                <MenuItem value="">-- เลือกตำบล --</MenuItem>
                {subdistricts.map(s => (
                  <MenuItem key={s.Subdistrict_ID} value={s.Subdistrict_ID}>
                    {s.SubdistrictName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="รหัสไปรษณีย์"
              name="postalCode"
              value={form.postalCode}
              fullWidth
              InputProps={{ readOnly: true }} // ทำให้เป็น read-only
              sx={{ bgcolor: '#eeeeee' }} // ทำให้ดูเป็น read-only ด้วยสีเทา
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            sx={{ mt: 3, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}
          >
            สมัครสมาชิก
          </Button>
        </Box>

        {/* Snackbar for notifications */}
        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}