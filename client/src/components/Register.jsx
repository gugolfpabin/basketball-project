import React, { useEffect, useState } from "react";
import axios from "axios";

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
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [showPassword, setShowPassword] = useState(false);
  const apiBase = "http://localhost:5000/api";



  useEffect(() => {
    axios.get(`${apiBase}/provinces`)
      .then(res => setProvinces(res.data))
      .catch(err => {
        console.error("Error fetching provinces:", err);
        showSnackbar("ไม่สามารถโหลดข้อมูลจังหวัดได้", "error");
      });
  }, []);


  useEffect(() => {
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

  useEffect(() => {
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
    
    if (name === 'phone') {
        const numericValue = value.replace(/[^0-9]/g, '');
        if (numericValue.length <= 10) {
            setForm(prev => ({ ...prev, [name]: numericValue }));
        }
    } else {
        setForm(prev => ({ ...prev, [name]: value }));
    }

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

    // --- Validation Checks ---
    if (form.password !== form.confirmPassword) {
      showSnackbar("รหัสผ่านไม่ตรงกัน", "error");
      return;
    }

    if (form.phone.length !== 10) {
        showSnackbar("กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก", "error");
        return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])[A-Za-z0-9]{8,}$/;
    if (!passwordRegex.test(form.password)) {
        showSnackbar("รหัสผ่านต้องมีอย่างน้อย 8 ตัว, และประกอบด้วยตัวพิมพ์เล็กและพิมพ์ใหญ่", "error");
        return;
    }

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
        bgcolor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
        flexDirection: 'column',
      }}
    >
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
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Box sx={{ alignSelf: 'flex-start' }}>
          <IconButton
            onClick={() => window.history.back()}
            color="inherit"
            aria-label="back"
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography component="h2" variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
            สมัครสมาชิก
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                <MenuItem value="นาง">นาง</MenuItem>
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
              inputProps={{ maxLength: 10 }}
            />
          </Box>

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

          <TextField
            label="อีเมล"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            required
          />

          <TextField
            label="รหัสผ่าน"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange}
            fullWidth
            required
            helperText="รหัสผ่านต้องมีอย่างน้อย 8 ตัว, และประกอบด้วยตัวพิมพ์เล็กและพิมพ์ใหญ่"
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

          <TextField
            label="ที่อยู่เลขที่"
            name="address"
            value={form.address}
            onChange={handleChange}
            fullWidth
            required
          />

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
              <InputLabel id="district-label">อำเภอ/เขต</InputLabel>
              <Select
                labelId="district-label"
                id="districtId"
                name="districtId"
                value={form.districtId}
                label="อำเภอ/เขต *"
                onChange={handleChange}
                disabled={districts.length === 0 || !form.provinceId}
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

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel id="subdistrict-label">ตำบล/แขวง</InputLabel>
              <Select
                labelId="subdistrict-label"
                id="subdistrictId"
                name="subdistrictId"
                value={form.subdistrictId}
                label="ตำบล/แขวง *"
                onChange={handleChange}
                disabled={subdistricts.length === 0 || !form.districtId}
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
              InputProps={{ readOnly: true }}
              sx={{ bgcolor: '#eeeeee' }}
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
