import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  InputBase,
  IconButton,
  Menu,
  MenuItem,
  Container,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);

  const apiBase = 'http://localhost:5000/api';

  // --- Navbar states ---
  const [anchorElCategory, setAnchorElCategory] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [user, setUser] = useState(null); // State to hold user info

  // Categories for the dropdown filter (matching HomePage.jsx)
  const categories = [
    { id: 'all', name: 'ทั้งหมด', categoryId: null },
    { id: 'basketball-jerseys', name: 'เสื้อบาสเกตบอล', categoryId: 1 },
    { id: 't-shirts', name: 'เสื้อ T-Shirt', categoryId: 2 },
    { id: 'basketball-shorts', name: 'กางเกงบาสเกตบอล', categoryId: 3 },
    { id: 'basketball-shoes', name: 'รองเท้าบาสเกตบอล', categoryId: 4 },
    { id: 'socks', name: 'ถุงเท้า', categoryId: 5 },
  ];

  const handleMenuClickCategory = (event) => setAnchorElCategory(event.currentTarget);
  const handleMenuCloseCategory = () => setAnchorElCategory(null);
  // Modified handleCategorySelect to navigate to Home with categoryId as query param
  const handleCategorySelect = (categoryId) => {
    handleMenuCloseCategory();
    // Navigate to Home page with categoryId as a query parameter
    // This assumes HomePage.jsx reads categoryId from URL query params
    navigate(`/?categoryId=${categoryId}`);
  };

  const handleMenuClickUser = (event) => setAnchorElUser(event.currentTarget);
  const handleMenuCloseUser = () => setAnchorElUser(null);
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); navigate('/login'); handleMenuCloseUser(); };

  useEffect(() => {
    // Load user from localStorage on component mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('user');
        setUser(null);
      }
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiBase}/products/${id}`);
        setProduct(response.data);
        if (response.data.imageUrls && response.data.imageUrls.length > 0) {
          setSelectedImage(response.data.imageUrls[0]);
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError("ไม่สามารถโหลดรายละเอียดสินค้าได้");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product && product.variants && selectedColor && selectedSize) {
      const foundVariant = product.variants.find(
        (v) => v.color === selectedColor && v.size === selectedSize
      );
      setSelectedVariant(foundVariant || null);
    } else {
      setSelectedVariant(null);
    }
  }, [selectedColor, selectedSize, product]);

  const handleAddToCart = () => {
    // Check if user is logged in
    if (!user) {
      const confirmLogin = window.confirm('คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถเพิ่มสินค้าลงในตะกร้าได้ ต้องการเข้าสู่ระบบตอนนี้หรือไม่?');
      if (confirmLogin) {
        navigate('/login');
      }
      return;
    }

    if (!selectedVariant) {
      alert('กรุณาเลือกสีและขนาดของสินค้า');
      return;
    }
    if (selectedVariant.stock <= 0) {
      alert('สินค้าหมดสต็อกสำหรับสีและขนาดที่เลือก');
      return;
    }
    console.log(`Added to cart: Product ID: ${product.id}, Variant ID: ${selectedVariant.variantId}, Color: ${selectedVariant.color}, Size: ${selectedVariant.size}, Price: ${selectedVariant.price}`);
    alert(`เพิ่ม ${product.name} (สี: ${selectedVariant.color}, ขนาด: ${selectedVariant.size}) ลงในตะกร้าแล้ว!`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>กำลังโหลดสินค้า...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column' }}>
        <Typography color="error" variant="h6">{error}</Typography>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>กลับหน้าหลัก</Button>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column' }}>
        <Typography variant="h6">ไม่พบสินค้า</Typography>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>กลับหน้าหลัก</Button>
      </Box>
    );
  }

  const availableColors = Array.from(new Set(product.variants.map(v => v.color)));
  const availableSizes = Array.from(new Set(product.variants.map(v => v.size)));

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Navbar */}
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              Home
            </Link>
          </Typography>

          {/* Category Dropdown (เหมือน Home.js) */}
          <Button
            color="inherit"
            endIcon={<KeyboardArrowDownIcon />}
            onClick={handleMenuClickCategory}
            sx={{ mx: 2 }}
          >
            Category
          </Button>
          <Menu
            anchorEl={anchorElCategory}
            open={Boolean(anchorElCategory)}
            onClose={handleMenuCloseCategory}
            MenuListProps={{ 'aria-labelledby': 'category-button' }}
          >
            {categories.map((cat) => (
              <MenuItem
                key={cat.id}
                onClick={() => handleCategorySelect(cat.categoryId)} // Pass categoryId to navigate
              >
                {cat.name}
              </MenuItem>
            ))}
          </Menu>

          {/* Search Bar */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: '#f0f0f0',
            borderRadius: '20px',
            px: 1,
            py: 0.5,
            width: { xs: '150px', sm: '200px', md: '300px' }
          }}>
            <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
              <SearchIcon />
            </IconButton>
            <InputBase
              sx={{ ml: 1, flex: 1 }}
              placeholder="Search"
              inputProps={{ 'aria-label': 'search' }}
            />
          </Box>

          {/* Login/Register or User Profile */}
          <Box sx={{ ml: 3 }}>
            {user ? (
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
                  {user.role === 1 && ( // Corrected comparison operator
                    <MenuItem onClick={handleMenuCloseUser} component={Link} to="/dashboard">
                      Dashboard
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleMenuCloseUser} component={Link} to="/profile">
                    ข้อมูลส่วนตัว
                  </MenuItem>
                  {user.role === 0 && ( // Corrected comparison operator
                    <MenuItem onClick={handleMenuCloseUser} component={Link} to="/orders">
                      รายการสั่งซื้อ
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleLogout}>
                    ออกจากระบบ
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box>
                <Button component={Link} to="/register" color="inherit" sx={{ mr: 1 }}>
                  สมัครสมาชิก
                </Button>
                <Button component={Link} to="/login" variant="contained" color="primary">
                  เข้าสู่ระบบ
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Product Detail */}
      <Container sx={{ py: 4, mt: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 4,
          }}
        >
          {/* Left Section: Images */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: 2 }}>
              {/* Thumbnail Images */}
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'row', sm: 'column' },
                gap: 1,
                overflowX: { xs: 'auto', sm: 'hidden' },
                maxHeight: { sm: '400px' },
                flexShrink: 0,
                pb: { xs: 1, sm: 0 },
              }}>
                {product.imageUrls && product.imageUrls.map((imgUrl, index) => (
                  <Box
                    key={index}
                    component="img"
                    src={imgUrl}
                    alt={`Thumbnail ${index + 1}`}
                    sx={{
                      width: { xs: '80px', sm: '100px' },
                      height: { xs: '80px', sm: '100px' },
                      objectFit: 'contain',
                      border: imgUrl === selectedImage ? '2px solid primary.main' : '1px solid #e0e0e0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      '&:hover': { borderColor: 'primary.light' },
                    }}
                    onClick={() => setSelectedImage(imgUrl)}
                  />
                ))}
              </Box>

              {/* Main Product Image */}
              <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Box
                  component="img"
                  src={selectedImage || 'https://placehold.co/400x500/E0E0E0/333333?text=Product+Image'}
                  alt={product.name}
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '500px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Right Section: Details */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              {product.name}
            </Typography>
            <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
              {selectedVariant ? selectedVariant.price : product.price} THB
            </Typography>
            {product.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {product.description}
              </Typography>
            )}

            {/* Color Options */}
            {availableColors.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  สี
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {availableColors.map((color) => (
                    <Button
                      key={color}
                      variant={selectedColor === color ? 'contained' : 'outlined'}
                      onClick={() => setSelectedColor(color)}
                      sx={{
                        minWidth: 'unset',
                        px: 2,
                        py: 1,
                        borderRadius: '20px',
                        textTransform: 'none',
                        borderColor: selectedColor === color ? 'primary.main' : '#e0e0e0',
                        color: selectedColor === color ? 'white' : 'text.primary',
                        bgcolor: selectedColor === color ? 'primary.main' : 'transparent',
                        '&:hover': {
                          bgcolor: selectedColor === color ? 'primary.dark' : '#f5f5f5',
                        }
                      }}
                    >
                      {color}
                    </Button>
                  ))}
                </Box>
              </Box>
            )}

            {/* Size Options */}
            {availableSizes.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  ขนาด
                </Typography>
                <FormControl fullWidth>
                  <InputLabel id="size-select-label">เลือกขนาด</InputLabel>
                  <Select
                    labelId="size-select-label"
                    value={selectedSize}
                    label="เลือกขนาด"
                    onChange={e => setSelectedSize(e.target.value)}
                    sx={{ borderRadius: '8px' }}
                  >
                    {availableSizes.map((size) => (
                      <MenuItem key={size} value={size}>
                        {size}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            {/* Stock */}
            {selectedVariant && (
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                จำนวนคงเหลือ: {selectedVariant.stock > 0 ? selectedVariant.stock : 'สินค้าหมด'}
              </Typography>
            )}

            {/* Add to Cart */}
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              startIcon={<AddShoppingCartIcon />}
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stock <= 0}
              sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '8px' }}
            >
              เพิ่มลงในตะกร้า
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
