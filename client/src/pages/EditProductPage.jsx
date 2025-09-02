import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    TextField,
    Button,
    Box,
    Typography,
    Grid,
    InputAdornment,
    CircularProgress,
    Alert,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';

// Dark theme to maintain consistent styling
// ธีมสีเข้มเพื่อความสอดคล้อง
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#bb86fc',
        },
        secondary: {
            main: '#03dac6',
        },
        background: {
            default: '#121212',
            paper: '#1e1e1e',
        },
    },
    typography: {
        fontFamily: 'Inter, sans-serif',
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: '20px',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                },
            },
        },
    },
});

// Mock data to simulate fetching a single product from the database
// ข้อมูลจำลองเพื่อใช้ในการสาธิตการดึงข้อมูลสินค้าจากฐานข้อมูล
const mockAllProducts = [
    { variantId: 105, productId: 1, productName: 'LA Lakers LeBron James Test test test', size: 'M', color: 'Yellow', stock: 15, price: 2790.00 },
    { variantId: 106, productId: 2, productName: 'Milwaukee Bucks Giannis Antetokounmpo Jersey', size: 'M', color: 'Black', stock: 30, price: 2790.00 },
    { variantId: 107, productId: 2, productName: 'Milwaukee Bucks Giannis Antetokounmpo Jersey', size: 'L', color: 'Black', stock: 20, price: 2790.00 },
    { variantId: 108, productId: 3, productName: 'Golden State Warriors Stephen Curry Jersey', size: 'S', color: 'Blue', stock: 40, price: 2790.00 },
    { variantId: 110, productId: 4, productName: 'Classic Basketball T-Shirt', size: 'S', color: 'White', stock: 100, price: 690.00 },
    { variantId: 112, productId: 5, productName: 'Graphic Hoop T-Shirt', size: 'M', color: 'Black', stock: 70, price: 750.00 },
    { variantId: 101, productId: 1, productName: 'LA Lakers LeBron James Test test test', size: 'L', color: 'Yellow', stock: 10, price: 2790.00 },
];

const mockProductDescriptions = {
    1: 'เสื้อบาสเกตบอลทีม Los Angeles',
    2: 'เสื้อบาสเกตบอลทีม Milwaukee Bucks ของ Giannis Antetokounmpo ดีไซน์ทันสมัย ใส่สบาย',
    3: 'เสื้อบาสเกตบอลทีม Golden State Warriors ของ Stephen Curry รุ่น Association Edition',
    4: 'เสื้อยืดบาสเกตบอลคลาสสิก เนื้อผ้านุ่ม ใส่สบาย เหมาะสำหรับทุกกิจกรรม',
    5: 'เสื้อยืดบาสเกตบอลลายกราฟิก ดีไซน์ไม่ซ้ำใคร',
};

/**
 * EditProductPage component for editing product details.
 * This component will fetch the existing product data based on `productId` and `variantId`
 * and display a form to edit the details.
 *
 * @param {object} props - The component props.
 * @param {number} props.productId - The ID of the product.
 * @param {number} props.variantId - The ID of the specific product variant.
 * @param {function} props.onBack - Function to call when the user wants to go back.
 */
export default function EditProductPage({ productId, variantId, onBack }) {
    // State to hold the form data
    // สถานะสำหรับเก็บข้อมูลในฟอร์ม
    const [formData, setFormData] = useState({
        productName: '',
        productDescription: '',
        size: '',
        color: '',
        stock: 0,
        price: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // useEffect hook to fetch data when the component mounts or props change
    // ใช้ useEffect เพื่อดึงข้อมูลเมื่อคอมโพเนนต์ถูกโหลดหรือ props มีการเปลี่ยนแปลง
    useEffect(() => {
        setLoading(true);
        setError(null);

        // Simulate fetching data for the specific product variant from your database
        // This is where you would replace mockAllProducts with your actual API call.
        // จำลองการดึงข้อมูลสำหรับสินค้า variant ที่ต้องการแก้ไขจากฐานข้อมูลของคุณ
        // ตรงนี้คือส่วนที่คุณจะต้องเปลี่ยนไปใช้การเรียก API จริงๆ
        const productData = mockAllProducts.find(
            item => item.productId === productId && item.variantId === variantId
        );

        if (productData) {
            // Simulate an API call with a delay
            // จำลองการเรียก API ด้วยการหน่วงเวลา
            setTimeout(() => {
                setFormData({
                    productName: productData.productName,
                    // Assume productDescription is from a separate lookup
                    // สมมติว่ารายละเอียดสินค้ามาจากข้อมูลอีกชุดหนึ่ง
                    productDescription: mockProductDescriptions[productData.productId] || '',
                    size: productData.size,
                    color: productData.color,
                    stock: productData.stock,
                    price: productData.price,
                });
                setLoading(false);
            }, 500); // 0.5 second delay
        } else {
            // Handle case where product is not found
            // จัดการกรณีที่ไม่พบสินค้า
            setError('ไม่พบข้อมูลสินค้าที่ต้องการแก้ไข');
            setLoading(false);
        }
    }, [productId, variantId]); // Dependency array to re-run effect if these props change

    // Handle form input changes
    // จัดการการเปลี่ยนแปลงของข้อมูลในฟอร์ม
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle form submission (saving the data)
    // จัดการการบันทึกข้อมูล
    const handleSave = () => {
        console.log("บันทึกการแก้ไข:", { productId, variantId, ...formData });
        // In a real application, you would make an API call to update the data here.
        // ในแอปพลิเคชันจริง คุณจะเรียก API เพื่ออัปเดตข้อมูลที่นี่
        // Example:
        // axios.put(`/api/products/${productId}/variants/${variantId}`, formData).then(onBack);

        // After saving, go back to the previous page
        // หลังจากบันทึกแล้ว ให้กลับไปหน้าก่อนหน้า
        if (onBack) {
            onBack();
        }
    };

    // Show a loading spinner while fetching data
    // แสดงสัญลักษณ์การโหลดขณะที่กำลังดึงข้อมูล
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>กำลังโหลดข้อมูลสินค้า...</Typography>
            </Box>
        );
    }

    // Show an error message if data could not be fetched
    // แสดงข้อผิดพลาดหากไม่สามารถดึงข้อมูลได้
    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                        variant="contained"
                        startIcon={<ArrowBackIcon />}
                        onClick={onBack}
                    >
                        กลับไปหน้า Dashboard
                    </Button>
                </Box>
            </Container>
        );
    }

    // Render the edit form with pre-filled data
    // แสดงฟอร์มแก้ไขพร้อมข้อมูลเก่า
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: '8px' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                            แก้ไขสินค้า
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={onBack}
                        >
                            กลับไปหน้า Dashboard
                        </Button>
                    </Box>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="ชื่อสินค้า"
                                name="productName"
                                value={formData.productName}
                                onChange={handleChange}
                                margin="normal"
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="ราคา (บาท)"
                                name="price"
                                type="number"
                                value={formData.price}
                                onChange={handleChange}
                                margin="normal"
                                variant="outlined"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">THB</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="รายละเอียดสินค้า"
                                name="productDescription"
                                value={formData.productDescription}
                                onChange={handleChange}
                                margin="normal"
                                variant="outlined"
                                multiline
                                rows={4}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="ขนาด"
                                name="size"
                                value={formData.size}
                                onChange={handleChange}
                                margin="normal"
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                label="สี"
                                name="color"
                                value={formData.color}
                                onChange={handleChange}
                                margin="normal"
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6}>
                            <TextField
                                fullWidth
                                label="จำนวนคงเหลือ"
                                name="stock"
                                type="number"
                                value={formData.stock}
                                onChange={handleChange}
                                margin="normal"
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<SaveIcon />}
                                    onClick={handleSave}
                                    sx={{ borderRadius: '20px', px: 3 }}
                                >
                                    บันทึกการแก้ไข
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>
        </ThemeProvider>
    );
}
