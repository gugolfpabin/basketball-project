import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Snackbar,
  IconButton,
  InputAdornment
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const apiBase = 'http://localhost:5000/api'; 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (openSnackbar) {
      setOpenSnackbar(false);
    }

    if (!form.email || !form.password) {
      showSnackbar("กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน", "warning");
      return;
    }

    try {
      const response = await axios.post(`${apiBase}/login`, {
        Email: form.email,
        Password: form.password,
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      showSnackbar('เข้าสู่ระบบสำเร็จ!', 'success');
      console.log('Login successful:', response.data);

      // ตรวจสอบ Role 
      if (user.role === 1) {
        navigate('/dashboard');
      } else if (user.role === 0) { 
        navigate('/');
      } else {
        navigate('/');
      }

    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        if (error.response.status === 401) {
          showSnackbar('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'error');
        } else if (error.response.data && error.response.data.message) {
          showSnackbar(`เกิดข้อผิดพลาด: ${error.response.data.message}`, 'error');
        } else {
          showSnackbar(`เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ${error.response.status} - ${error.response.statusText || 'โปรดลองอีกครั้ง'}`, 'error');
        }
      } else if (error.request) {
        showSnackbar("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต", "error");
      } else {
        showSnackbar("เกิดข้อผิดพลาดที่ไม่คาดคิด โปรดลองอีกครั้ง", "error");
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
        flexDirection: 'column',
        py: 4,
        px: 2,
      }}
    >
      {/* หัวข้อใหญ่สุดด้านบน: ระบบขายเสื้อผ้าบาสเกตบอล */}
      <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', color: '#333', mb: 4, textAlign: 'center' }}>
        ระบบขายเสื้อผ้าบาสเกตบอล
      </Typography>

      <Box
        sx={{
          maxWidth: '400px',
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
        {/* Back Button and "เข้าสู่ระบบ" Header */}
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            width: '100%',
            mb: 2
        }}>
          <IconButton
            onClick={() => navigate('/')} 
            color="inherit"
            aria-label="back"
            sx={{ position: 'absolute', left: 0 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography component="h2" variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
            เข้าสู่ระบบ
          </Typography>
        </Box>

        {/* Login Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

          {/* ปุ่ม "สมัครสมาชิก" และ "เข้าสู่ระบบ" ในแถวเดียวกัน */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Button
              component={Link}
              to="/register"
              variant="text"
              sx={{ textTransform: 'none', color: 'primary.main', fontSize: '1rem', p: 0 }}
            >
              สมัครสมาชิก
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              sx={{ py: 1, px: 3, fontSize: '1rem', fontWeight: 'bold' }}
            >
              เข้าสู่ระบบ
            </Button>
          </Box>
        </Box>

        {/* Snackbar */}
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
