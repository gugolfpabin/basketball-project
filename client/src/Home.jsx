import React, { useState, useEffect, useMemo } from 'react';
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
  Card,
  CardMedia,
  CardContent,
  Grid,
  Container,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Home() {
  const navigate = useNavigate();
  const [anchorElCategory, setAnchorElCategory] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null); // null initially for 'all' products
  const apiBase = 'http://localhost:5000/api';

  // Categories for the dropdown filter
  const categories = [
    { id: 'all', name: 'ทั้งหมด', categoryId: null },
    { id: 'basketball-jerseys', name: 'เสื้อบาสเกตบอล', categoryId: 1 },
    { id: 't-shirts', name: 'เสื้อ T-Shirt', categoryId: 2 },
    { id: 'basketball-shorts', name: 'กางเกงบาสเกตบอล', categoryId: 3 },
    { id: 'basketball-shoes', name: 'รองเท้าบาสเกตบอล', categoryId: 4 },
    { id: 'socks', name: 'ถุงเท้า', categoryId: 5 },
  ];

  // --- Functions for Category Dropdown ---
  const handleMenuClickCategory = (event) => {
    setAnchorElCategory(event.currentTarget);
  };

  const handleMenuCloseCategory = () => {
    setAnchorElCategory(null);
  };

  const handleCategorySelect = (categoryId) => {
    handleMenuCloseCategory();
    setSelectedCategoryId(categoryId);
  };

  // --- Functions for User Dropdown Menu ---
  const handleMenuClickUser = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleMenuCloseUser = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    handleMenuCloseUser();
  };

  // Function to fetch products based on selected category and search term
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${apiBase}/products`;
      const queryParams = new URLSearchParams();

      // Always specify view=home for this page
      queryParams.append('view', 'home');

      // Add categoryId filter if a specific category is selected (not 'all' or null)
      if (selectedCategoryId !== null) {
        queryParams.append('categoryId', selectedCategoryId);
      }

      // Add search term filter if present
      if (searchTerm) {
        queryParams.append('searchTerm', searchTerm);
      }

      // Append query parameters to URL
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      console.log("Fetching products from URL:", url);
      const response = await axios.get(url);
      setProducts(response.data);
      console.log("Fetched products data for Home page:", response.data);
    } catch (err) {
      console.error("Error fetching products for Home page:", err);
      setError("ไม่สามารถโหลดสินค้าได้ โปรดตรวจสอบ Backend Server และการเชื่อมต่อฐานข้อมูล");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

    fetchProducts();
  }, [selectedCategoryId, searchTerm, apiBase]);

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // useMemo to prepare products for display, including calculated displayPrice and displaySize
  const displayedProducts = useMemo(() => {
    return products.map(product => {
      let displayPrice = 'N/A';
      let displaySize = 'N/A'; // Default value for size

      if (product.variants && product.variants.length > 0) {
        // Find the variant with the minimum price
        const minPriceVariant = product.variants.reduce((minV, currentV) =>
          currentV.price < minV.price ? currentV : minV
        );
        displayPrice = minPriceVariant.price;
        displaySize = minPriceVariant.size; // Get the size of this variant
      }

      return {
        ...product,
        displayPrice,
        displaySize, // Add the display size to the product object
      };
    });
  }, [products]);


  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Navbar ด้านบน */}
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              Home
            </Link>
          </Typography>

          {/* Category Dropdown */}
          <Button
            color="inherit"
            endIcon={<KeyboardArrowDownIcon />}
            onClick={handleMenuClickCategory}
            sx={{ mx: 2 }}
          >
            {categories.find(cat => cat.categoryId === selectedCategoryId)?.name || 'หมวดหมู่'}
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
                onClick={() => handleCategorySelect(cat.categoryId)}
                selected={cat.categoryId === selectedCategoryId}
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
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Box>

          {/* Login/Register or User Profile Dropdown */}
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
                  {user.role === 1 && (
                    <MenuItem onClick={handleMenuCloseUser} component={Link} to="/dashboard">
                      Dashboard
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleMenuCloseUser} component={Link} to="/profile">
                    ข้อมูลส่วนตัว
                  </MenuItem>
                  {user.role === 0 && (
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

      {/* ส่วนเนื้อหาหลักสำหรับ สินค้า */}
      <Container sx={{ py: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4 }}>
          {categories.find(cat => cat.categoryId === selectedCategoryId)?.name || 'สินค้า'}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>กำลังโหลดสินค้า...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ width: '100%', textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="error">
              {error}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              โปรดตรวจสอบว่า Backend Server ทำงานอยู่และฐานข้อมูลเชื่อมต่อถูกต้อง
            </Typography>
          </Box>
        ) : displayedProducts.length > 0 ? (
          <Grid container spacing={3}>
            {displayedProducts.map((product) => (
              <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
                <Card
                  sx={{
                    maxWidth: 345,
                    height: 382,
                    minHeight: 382,
                    maxHeight: 382,
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    border: '1px solid #e0e0e0'
                  }}
                  onClick={() => handleProductClick(product.id)}
                >
                  <CardMedia
                    component="img"
                    height={250}
                    image={product.imageUrl || 'https://placehold.co/250x250/E0E0E0/333333?text=No+Image'}
                    alt={product.name}
                    sx={{ objectFit: 'cover', width: '100%', flexShrink: 0 }}
                  />
                  <CardContent
                    sx={{
                      height: 100,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      flexShrink: 0
                    }}
                  >
                    <Typography
                      gutterBottom
                      variant="h6"
                      component="div"
                      sx={{
                        fontWeight: 'bold',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '1.2em',
                        height: '2.4em'
                      }}
                    >
                      {product.name}
                    </Typography>
                    {/* Display Size */}
                    
                    <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                      {product.displayPrice} THB
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ width: '100%', textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="text.secondary">
              ไม่พบสินค้าที่ตรงกับคำค้นหาหรือหมวดหมู่ที่เลือก
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
