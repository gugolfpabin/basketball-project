// src/pages/AddProductPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Paper,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Input,
  Menu, // Fix: Import Menu component
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ArrowBack as ArrowBackIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';

export default function AddProductPage() {
  const navigate = useNavigate();
  const apiBase = 'http://localhost:5000/api';

  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [variants, setVariants] = useState([{ size: '', color: '', stock: '', price: '', cost: '' }]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);

  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Categories for the dropdown
  const categories = [
    { id: 1, name: 'เสื้อบาสเกตบอล' },
    { id: 2, name: 'เสื้อ T-Shirt' },
    { id: 3, name: 'กางเกงบาสเกตบอล' },
    { id: 4, name: 'รองเท้าบาสเกตบอล' },
    { id: 5, name: 'ถุงเท้า' },
  ];

  // --- Navbar states ---
  const [user, setUser] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.role !== 1) {
          navigate('/');
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleMenuClickUser = (event) => setAnchorElUser(event.currentTarget);
  const handleMenuCloseUser = () => setAnchorElUser(null);
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    handleMenuCloseUser();
  };

  // --- Variant Handlers ---
  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const handleAddVariant = () => {
    setVariants([...variants, { size: '', color: '', stock: '', price: '', cost: '' }]);
  };

  const handleRemoveVariant = (index) => {
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);
  };

  // --- Image File Handlers ---
  const handleFileChange = (event) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      setSelectedFiles((prevFiles) => [...prevFiles, ...filesArray]);
    }
  };

  const handleRemoveFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setUploadedImageUrls((prevUrls) => prevUrls.filter((_, i) => i !== index));
  };

  // --- Form Submission ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setSnackbarOpen(false);

    // Basic validation
    if (!productName || !categoryId) {
      setSnackbarMessage('กรุณากรอกชื่อสินค้าและเลือกหมวดหมู่');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setLoading(false);
      return;
    }

    if (variants.length === 0 || variants.some(v => !v.size || !v.color || v.stock === '' || v.price === '' || v.cost === '')) {
      setSnackbarMessage('กรุณากรอกรายละเอียด Variant (ขนาด, สี, สต็อก, ราคา, ต้นทุน) ให้ครบถ้วนอย่างน้อยหนึ่งรายการ');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setLoading(false);
      return;
    }

    let finalImageUrls = [];

    // 1. Upload images first if there are selected files
    if (selectedFiles.length > 0) {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        // 'images' must match the field name in your multer setup
        formData.append('images', file);
      });

      try {
        const uploadResponse = await axios.post(`${apiBase}/upload/images`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        finalImageUrls = uploadResponse.data.imageUrls;
        setUploadedImageUrls(finalImageUrls);
        setSnackbarMessage('รูปภาพอัปโหลดสำเร็จ!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (uploadError) {
        console.error('Error uploading images:', uploadError.response?.data || uploadError.message);
        setSnackbarMessage(`เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ${uploadError.response?.data?.message || uploadError.message}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoading(false);
        return; // Stop submission if image upload fails
      }
    }

    // 2. Prepare product data with the obtained image URLs
    const productData = {
      productName,
      productDescription,
      categoryId: parseInt(categoryId),
      variants: variants.map(v => ({
        ...v,
        stock: parseInt(v.stock),
        price: parseFloat(v.price),
        cost: parseFloat(v.cost),
      })),
      imageUrls: finalImageUrls,
    };

    try {
      const response = await axios.post(`${apiBase}/products`, productData);
      console.log('Product added successfully:', response.data);
      setSnackbarMessage('เพิ่มสินค้าเรียบร้อยแล้ว!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Error adding product:', error.response?.data || error.message);
      setSnackbarMessage(`เกิดข้อผิดพลาดในการเพิ่มสินค้า: ${error.response?.data?.message || error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  if (!user || user.role !== 1) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>กำลังตรวจสอบสิทธิ์...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            เพิ่มสินค้าใหม่
          </Typography>
          <Box sx={{ ml: 3 }}>
            {user && (
              <>
                <Button
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenuClickUser}
                  color="inherit"
                  endIcon={<KeyboardArrowDownIcon />}
                  sx={{ textTransform: 'none', fontSize: '1rem' }}
                >
                  {user.email}
                </Button>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  keepMounted
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  open={Boolean(anchorElUser)}
                  onClose={handleMenuCloseUser}
                >
                  <MenuItem onClick={handleLogout}>
                    ออกจากระบบ
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: '8px' }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            รายละเอียดสินค้า
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  select
                  label="หมวดหมู่สินค้า"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  fullWidth
                  required
                  sx={{ mb: 2 }}
                >
                  {categories.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="ชื่อสินค้า"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  fullWidth
                  required
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="คำอธิบายสินค้า"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  fullWidth
                  multiline
                  rows={4}
                  sx={{ mb: 3 }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                  Variants (ขนาด, สี, สต็อก, ราคา, ต้นทุน)
                </Typography>
                {variants.map((variant, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', border: '1px solid #e0e0e0', p: 2, borderRadius: '8px' }}>
                    <TextField
                      label="ขนาด"
                      value={variant.size}
                      onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                      required
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="สี"
                      value={variant.color}
                      onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                      required
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="สต็อก"
                      type="number"
                      value={variant.stock}
                      onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                      required
                      sx={{ flex: 0.5 }}
                    />
                    <TextField
                      label="ราคา"
                      type="number"
                      value={variant.price}
                      onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                      required
                      sx={{ flex: 0.5 }}
                    />
                    <TextField
                      label="ต้นทุน"
                      type="number"
                      value={variant.cost}
                      onChange={(e) => handleVariantChange(index, 'cost', e.target.value)}
                      required
                      sx={{ flex: 0.5 }}
                    />
                    {variants.length > 1 && (
                      <IconButton onClick={() => handleRemoveVariant(index)} color="error">
                        <RemoveIcon />
                      </IconButton>
                    )}
                  </Box>
                ))}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddVariant}
                  sx={{ mt: 1, textTransform: 'none', borderRadius: '20px' }}
                >
                  เพิ่ม Variant
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2, mt: 3 }}>
                  รูปภาพสินค้า
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    sx={{ textTransform: 'none', borderRadius: '20px', py: 1.5 }}
                  >
                    
                    <Input
                      type="file"
                      multiple
                      hidden
                      onChange={handleFileChange}
                      inputProps={{ accept: "image/*" }}
                    />
                  </Button>
                  {selectedFiles.map((file, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #e0e0e0', p: 1, borderRadius: '8px' }}>
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {file.name}
                      </Typography>
                      <IconButton onClick={() => handleRemoveFile(index)} color="error">
                        <RemoveIcon />
                      </IconButton>
                      {/* Optional: Display image preview */}
                      {file instanceof File && (
                        <Box
                          component="img"
                          src={URL.createObjectURL(file)}
                          alt="Preview"
                          sx={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '4px' }}
                        />
                      )}
                    </Box>
                  ))}
                  {uploadedImageUrls.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        รูปภาพที่อัปโหลดแล้ว:
                      </Typography>
                      {uploadedImageUrls.map((url, index) => (
                        <Typography key={index} variant="caption" display="block">
                          {url}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} sx={{ mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '8px' }}
                >
                  {loading ? 'กำลังเพิ่มสินค้า...' : 'เพิ่มสินค้า'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
