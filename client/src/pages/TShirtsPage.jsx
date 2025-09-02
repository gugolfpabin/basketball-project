// src/pages/TShirtsPage.jsx
import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function TShirtsPage() { // Component name
  const navigate = useNavigate();
  const [anchorElCategory, setAnchorElCategory] = useState(null); // For Category Dropdown
  const [anchorElUser, setAnchorElUser] = useState(null);       // For User Dropdown Menu
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]); // State to store T-Shirt products
  const apiBase = 'http://localhost:5000/api'; // Ensure this matches your Backend port

  // --- Functions for Category Dropdown (Copied for consistency) ---
  const handleMenuClickCategory = (event) => {
    setAnchorElCategory(event.currentTarget);
  };

  const handleMenuCloseCategory = () => {
    setAnchorElCategory(null);
  };

  const handleCategorySelect = (categoryPath) => {
    handleMenuCloseCategory(); // Close the menu when an item is selected
    navigate(categoryPath);    // Navigate to the specified path
  };

  // --- Functions for User Dropdown Menu (Copied for consistency) ---
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
    handleMenuCloseUser(); // Close menu after logout
  };

  useEffect(() => {
    // 1. Fetch user data from localStorage (same as Home.jsx)
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

    // 2. Function to fetch T-Shirts from Backend API
    const fetchTShirts = async () => { // Changed function name
      try {
        // IMPORTANT: Ensure 't-shirts' is mapped to a Category_ID in your backend's productController.js
        const response = await axios.get(`${apiBase}/products?category=t-shirts`); // Changed category
        setProducts(response.data);
        console.log("Fetched T-Shirts products:", response.data);
      } catch (error) {
        console.error("Error fetching T-Shirts products:", error);
        setProducts([]); // Set to empty array on error, instead of mock data
      }
    };

    fetchTShirts(); // Call the function to fetch T-Shirts when component mounts
  }, []); // Empty dependency array means this effect runs once after the initial render

  // Function to handle product click (navigate to product detail page)
  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Navbar (Copied from Home.jsx for consistency) */}
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
            Category
          </Button>
          <Menu
            anchorEl={anchorElCategory}
            open={Boolean(anchorElCategory)}
            onClose={handleMenuCloseCategory}
            MenuListProps={{ 'aria-labelledby': 'category-button' }}
          >
            <MenuItem onClick={() => handleCategorySelect('/')}>เสื้อบาสเกตบอล</MenuItem>
            <MenuItem onClick={() => handleCategorySelect('/category/t-shirts')}>เสื้อ T-Shirt</MenuItem>
            <MenuItem onClick={() => handleCategorySelect('/category/basketball-shorts')}>กางเกงบาสเกตบอล</MenuItem>
            <MenuItem onClick={() => handleCategorySelect('/category/basketball-shoes')}>รองเท้าบาสเกตบอล</MenuItem>
            <MenuItem onClick={() => handleCategorySelect('/category/socks')}>ถุงเท้า</MenuItem>
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
                  {user.role == 1 && (
                    <MenuItem onClick={handleMenuCloseUser} component={Link} to="/dashboard">
                      Dashboard
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleMenuCloseUser} component={Link} to="/profile">
                    ข้อมูลส่วนตัว
                  </MenuItem>
                  {user.role == 0 && (
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

      {/* Main content for T-Shirts */}
      <Container sx={{ py: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4 }}>
          เสื้อ T-Shirt {/* Changed Header Text */}
        </Typography>

        <Grid container spacing={3}>
          {products.length > 0 ? (
            products.map((product) => (
              <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
                <Card
                  sx={{
                    maxWidth: 345,
                    height: 382, // Fixed height for consistency
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
                    height={250} // Fixed height for image
                    image={product.imageUrl || 'https://placehold.co/250x250/E0E0E0/333333?text=No+Image'}
                    alt={product.name}
                    sx={{ objectFit: 'cover', width: '100%', flexShrink: 0 }}
                  />
                  <CardContent
                    sx={{
                      height: 100, // Fixed height for content
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
                    <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                      {product.price} THB
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Box sx={{ width: '100%', textAlign: 'center', mt: 4 }}>
              <Typography variant="h6" color="text.secondary">
                กำลังโหลดสินค้า... หรือไม่พบสินค้า
              </Typography>
            </Box>
          )}
        </Grid>
      </Container>
    </Box>
  );
}
