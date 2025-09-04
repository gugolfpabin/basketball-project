    // // //src/pages/AddProductPage.jsx
    import React, { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
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
        Menu,
        Card,
        CardContent,
        Checkbox,
        FormGroup,
        FormControlLabel,
        InputAdornment,
    } from '@mui/material';
    import {
        Add as AddIcon,
        ArrowBack as ArrowBackIcon,
        KeyboardArrowDown as KeyboardArrowDownIcon,
        CloudUpload as CloudUploadIcon,
        Delete as DeleteIcon,
        Close as CloseIcon,
    } from '@mui/icons-material';

    export default function AddProductPage() {
        const navigate = useNavigate();
        const apiBase = 'http://localhost:5000/api';

        const [productName, setProductName] = useState('');
        const [productDescription, setProductDescription] = useState('');
        const [categoryId, setCategoryId] = useState('');
        const [colorVariants, setColorVariants] = useState([
            {
                color: '',
                sizes: [],
                price: '',
                cost: '',
                imageFile: null,
                imageUrl: '',
            },
        ]);

        const [loading, setLoading] = useState(false);
        const [snackbarOpen, setSnackbarOpen] = useState(false);
        const [snackbarMessage, setSnackbarMessage] = useState('');
        const [snackbarSeverity, setSnackbarSeverity] = useState('success');

        const categories = [
            { id: 1, name: 'เสื้อบาสเกตบอล' },
            { id: 2, name: 'เสื้อ T-Shirt' },
            { id: 3, name: 'กางเกงบาสเกตบอล' },
            { id: 4, name: 'รองเท้าบาสเกตบอล' },
            { id: 5, name: 'ถุงเท้า' },
        ];
        
        // กำหนดขนาดมาตรฐาน
        const standardSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

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

        // --- Color Variant Handlers ---
        const handleAddColorVariant = () => {
            setColorVariants([
                ...colorVariants,
                {
                    color: '',
                    sizes: [], // sizes is now an array of objects: { name: 'S', stock: 10 }
                    price: '',
                    cost: '',
                    imageFile: null,
                    imageUrl: '',
                },
            ]);
        };

        const handleRemoveColorVariant = (index) => {
            const newColorVariants = colorVariants.filter((_, i) => i !== index);
            setColorVariants(newColorVariants);
        };

        const handleColorVariantChange = (index, field, value) => {
            const newColorVariants = [...colorVariants];
            newColorVariants[index][field] = value;
            setColorVariants(newColorVariants);
        };

        const handleSizeStockChange = (colorIndex, size, value) => {
            const newColorVariants = [...colorVariants];
            const newSizes = newColorVariants[colorIndex].sizes.map(s => 
                s.name === size ? { ...s, stock: value } : s
            );
            newColorVariants[colorIndex].sizes = newSizes;
            setColorVariants(newColorVariants);
        };

        const handleSizeCheck = (colorIndex, size) => {
            const newColorVariants = [...colorVariants];
            const sizes = newColorVariants[colorIndex].sizes;
            
            if (sizes.some(s => s.name === size)) {
                newColorVariants[colorIndex].sizes = sizes.filter(s => s.name !== size);
            } else {
                newColorVariants[colorIndex].sizes = [...sizes, { name: size, stock: '' }].sort(
                    (a, b) => standardSizes.indexOf(a.name) - standardSizes.indexOf(b.name)
                );
            }
            setColorVariants(newColorVariants);
        };

        const handleImageChange = (index, event) => {
            const file = event.target.files[0];
            if (file) {
                const newColorVariants = [...colorVariants];
                newColorVariants[index].imageFile = file;
                newColorVariants[index].imageUrl = URL.createObjectURL(file);
                setColorVariants(newColorVariants);
            }
        };

        const handleRemoveImage = (index) => {
            const newColorVariants = [...colorVariants];
            newColorVariants[index].imageFile = null;
            newColorVariants[index].imageUrl = '';
            setColorVariants(newColorVariants);
        };

        // --- Form Submission ---
const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setSnackbarOpen(false);

    if (!productName || !categoryId) {
        setSnackbarMessage('กรุณากรอกชื่อสินค้าและเลือกหมวดหมู่');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoading(false);
        return;
    }

    try {
        // Step 1: อัปโหลดรูปภาพทั้งหมดก่อน แล้วเก็บ URL ไว้ใน Map
        const colorImageUrlMap = {};
        for (const cv of colorVariants) {
            // อัปโหลดเฉพาะสีที่มีไฟล์รูปภาพและยังไม่เคยอัปโหลด
            if (cv.imageFile && !colorImageUrlMap[cv.color]) {
                const formData = new FormData();
                formData.append('image', cv.imageFile); // Server คาดหวัง field 'image' ไม่ใช่ 'images'

                // [แก้ไข] แก้ไข URL ให้ถูกต้องเป็น /upload-images
                const uploadRes = await axios.post(`${apiBase}/upload-images`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                if (uploadRes.data.success) {
                    colorImageUrlMap[cv.color] = uploadRes.data.imageUrl;
                } else {
                    throw new Error(`อัปโหลดรูปสำหรับสี "${cv.color}" ไม่สำเร็จ`);
                }
            }
        }

        // Step 2: สร้าง Array ของ variants ทั้งหมดจากข้อมูลใน State
        const variantsToCreate = [];
        colorVariants.forEach(cv => {
            // ตรวจสอบว่ามีข้อมูลสี, ราคา, ต้นทุน และขนาดหรือไม่
            if (cv.color && cv.price !== '' && cv.cost !== '' && cv.sizes.length > 0) {
                cv.sizes.forEach(sizeObj => {
                    // ตรวจสอบว่ามีการกรอกสต็อกหรือไม่
                    if (sizeObj.stock !== '') {
                        variantsToCreate.push({
                            size: sizeObj.name,
                            color: cv.color,
                            stock: parseInt(sizeObj.stock, 10),
                            price: parseFloat(cv.price),
                            cost: parseFloat(cv.cost),
                            // เพิ่ม imageUrl เข้าไปในแต่ละ variant
                            imageUrl: colorImageUrlMap[cv.color] || null 
                        });
                    }
                });
            }
        });

        if (variantsToCreate.length === 0) {
            throw new Error('กรุณากรอกรายละเอียดสี, ขนาด, ราคา, ต้นทุน และสต็อกอย่างน้อยหนึ่งรายการ');
        }

        // Step 3: สร้าง Payload สุดท้ายเพื่อส่งให้ Backend
        const productData = {
            productName,
            productDescription,
            categoryId: parseInt(categoryId, 10),
            variants: variantsToCreate,
        };
        
        // Step 4: ส่งข้อมูลไปสร้างสินค้า
        const response = await axios.post(`${apiBase}/products`, productData);

        setSnackbarMessage('เพิ่มสินค้าเรียบร้อยแล้ว!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        setTimeout(() => {
            navigate('/dashboard');
        }, 1500);

    } catch (err) {
        console.error('Error adding product:', err.response?.data || err.message);
        setSnackbarMessage(`เกิดข้อผิดพลาด: ${err.response?.data?.message || err.message}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
    } finally {
        setLoading(false);
    }
};

        const handleSnackbarClose = (event, reason) => {
            if (reason === 'clickaway') return;
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
                        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                            เพิ่มสินค้าใหม่
                        </Typography>
                        {user && (
                            <>
                                <Button
                                    onClick={handleMenuClickUser}
                                    color="inherit"
                                    endIcon={<KeyboardArrowDownIcon />}
                                    sx={{ textTransform: 'none', fontSize: '1rem' }}
                                >
                                    {user.email}
                                </Button>
                                <Menu
                                    anchorEl={anchorElUser}
                                    open={Boolean(anchorElUser)}
                                    onClose={handleMenuCloseUser}
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                >
                                    <MenuItem onClick={handleLogout}>ออกจากระบบ</MenuItem>
                                </Menu>
                            </>
                        )}
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
                                    >
                                        {categories.map(option => (
                                            <MenuItem key={option.id} value={option.id}>{option.name}</MenuItem>
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
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                                        ข้อมูล Variants ตามสี
                                    </Typography>
                                    {colorVariants.map((colorVariant, index) => (
                                        <Card key={index} variant="outlined" sx={{ mb: 3 }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                        สี #{index + 1}
                                                    </Typography>
                                                    {colorVariants.length > 1 && (
                                                        <IconButton onClick={() => handleRemoveColorVariant(index)} color="error">
                                                            <CloseIcon />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={12} sm={6}>
                                                        <TextField
                                                            label="สี"
                                                            value={colorVariant.color}
                                                            onChange={(e) => handleColorVariantChange(index, 'color', e.target.value)}
                                                            required
                                                            fullWidth
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={6}>
                                                        <TextField
                                                            label="ราคา"
                                                            type="number"
                                                            value={colorVariant.price}
                                                            onChange={(e) => handleColorVariantChange(index, 'price', e.target.value)}
                                                            required
                                                            fullWidth
                                                            InputProps={{
                                                                startAdornment: <InputAdornment position="start">฿</InputAdornment>,
                                                                inputProps: { min: 0 }
                                                            }}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={6}>
                                                        <TextField
                                                            label="ต้นทุน"
                                                            type="number"
                                                            value={colorVariant.cost}
                                                            onChange={(e) => handleColorVariantChange(index, 'cost', e.target.value)}
                                                            required
                                                            fullWidth
                                                            InputProps={{
                                                                startAdornment: <InputAdornment position="start">฿</InputAdornment>,
                                                                inputProps: { min: 0 }
                                                            }}
                                                        />
                                                    </Grid>
                                                    
                                                    <Grid item xs={12}>
                                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>เลือกขนาดและใส่สต็อก:</Typography>
                                                        <Grid container spacing={2}>
                                                            {standardSizes.map(size => {
                                                                const isChecked = colorVariant.sizes.some(s => s.name === size);
                                                                return (
                                                                    <Grid item xs={12} sm={6} md={4} key={size}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                            <FormControlLabel
                                                                                control={
                                                                                    <Checkbox
                                                                                        checked={isChecked}
                                                                                        onChange={() => handleSizeCheck(index, size)}
                                                                                    />
                                                                                }
                                                                                label={size}
                                                                                sx={{ mr: 1 }}
                                                                            />
                                                                            {isChecked && (
                                                                                <TextField
                                                                                    label="สต็อก"
                                                                                    type="number"
                                                                                    value={colorVariant.sizes.find(s => s.name === size)?.stock || ''}
                                                                                    onChange={(e) => handleSizeStockChange(index, size, e.target.value)}
                                                                                    size="small"
                                                                                    sx={{ width: 100 }}
                                                                                    required
                                                                                    InputProps={{
                                                                                        inputProps: { min: 0 }
                                                                                    }}
                                                                                />
                                                                            )}
                                                                        </Box>
                                                                    </Grid>
                                                                );
                                                            })}
                                                        </Grid>
                                                    </Grid>

                                                    <Grid item xs={12}>
                                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>รูปภาพสำหรับสีนี้:</Typography>
                                                        {colorVariant.imageUrl ? (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                                                                <img src={colorVariant.imageUrl} alt={`Preview ${index}`} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '4px' }} />
                                                                <Typography sx={{ flexGrow: 1 }}>{colorVariant.imageFile?.name || 'รูปภาพ'}</Typography>
                                                                <IconButton onClick={() => handleRemoveImage(index)} color="error">
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </Box>
                                                        ) : (
                                                            <Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />}>
                                                                อัปโหลดรูปภาพสำหรับสีนี้
                                                                <input type="file" hidden accept="image/*" onChange={(e) => handleImageChange(index, e)} />
                                                            </Button>
                                                        )}
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddColorVariant} sx={{ mt: 1, mb: 4, textTransform: 'none', borderRadius: '20px' }}>
                                        เพิ่มสีใหม่
                                    </Button>
                                </Grid>

                                <Grid item xs={12}>
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