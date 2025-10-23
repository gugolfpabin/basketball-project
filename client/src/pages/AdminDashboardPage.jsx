import React, { useState, useEffect, useMemo } from 'react';
import { Settings as SettingsIcon } from '@mui/icons-material';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Menu,
  InputAdornment,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Pagination,
  Stack,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Menu as MenuIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const drawerWidth = 240;

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [anchorElCategoryDropdown, setAnchorElCategoryDropdown] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(0);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const apiBase = 'http://localhost:5000/api';
  const itemsPerPage = 10;

  const categories = [
    { id: 0, name: 'ทั้งหมด' },
    { id: 1, name: 'เสื้อบาสเกตบอล' },
    { id: 2, name: 'เสื้อ T-Shirt' },
    { id: 3, name: 'กางเกงบาสเกตบอล' },
    { id: 4, name: 'รองเท้าบาสเกตบอล' },
    { id: 5, name: 'ถุงเท้า' },
  ];

  // --- Debounce Effect ---
  useEffect(() => {
    const handler = setTimeout(() => {
        setDebouncedSearchTerm(searchTerm);
    }, 700);

    return () => {
        clearTimeout(handler);
    };
}, [searchTerm]); 

// --- Fetch Products ---
useEffect(() => {
    fetchProducts();
}, [selectedCategoryFilter, debouncedSearchTerm]);

  // --- Fetch Products ---
  const fetchProducts = async () => {
    setLoadingProducts(true);
    setErrorProducts(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('view', 'admin');

      if (selectedCategoryFilter !== 0) {
        queryParams.append('categoryId', selectedCategoryFilter);
      } else {
        queryParams.append('category', 'all');
      }

      if (debouncedSearchTerm) {
        queryParams.append('searchTerm', debouncedSearchTerm);
      }

      const url = `${apiBase}/products?${queryParams.toString()}`;
      const response = await axios.get(url);
      setProducts(response.data);
    } catch (err) {
      console.error("Error fetching products:", err);
      setErrorProducts("ไม่สามารถโหลดข้อมูลสินค้าได้");
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategoryFilter, debouncedSearchTerm]);

  // --- User Authentication ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.role !== 1) navigate('/');
      } catch {
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

   

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // --- Drawer & Category Handlers ---
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleCategoryDropdownClick = (event) => setAnchorElCategoryDropdown(event.currentTarget);
  const handleCategoryDropdownClose = () => setAnchorElCategoryDropdown(null);
  const handleCategoryFilterSelect = (categoryId) => {
    setSelectedCategoryFilter(categoryId);
    setCurrentPage(1); 
    handleCategoryDropdownClose();
  };

  // --- User Menu ---
  const handleMenuClickUser = (event) => setAnchorElUser(event.currentTarget);
  const handleMenuCloseUser = () => setAnchorElUser(null);
  const handleLogout = () => {
    if (window.confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setAnchorElUser(false); 
        navigate('/login');
    }

};

  // --- Edit & Delete Handlers ---
 const handleManage = (productId) => {
    navigate(`/admin/products/manage/${productId}`);
  };

   const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      await axios.delete(`${apiBase}/products/${productToDelete.id}`);
      setSnackbar({ open: true, message: 'ลบสินค้าสำเร็จ!', severity: 'success' });
      fetchProducts(); 
    } catch (err) {
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการลบสินค้า', severity: 'error' });
    } finally {
      handleDeleteCancel();
    }
  };

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
    setProductToDelete(null);
  };


  // --- Pagination Handlers ---
  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  // --- Paginated Products ---
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return products.slice(startIndex, endIndex);
  }, [products, currentPage, itemsPerPage]);

  const displayedProducts = useMemo(() => paginatedProducts, [paginatedProducts]);

  // --- Drawer JSX ---
  const drawer = (
    <Box sx={{ bgcolor: '#212121', height: '100%', color: 'white' }}>
      <Toolbar sx={{ bgcolor: '#212121', color: 'white', justifyContent: 'center' }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          ADMIN PANEL
        </Typography>
      </Toolbar>
      <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.12)' }} />
      <List>
        <ListItem disablePadding component={Link} to="/dashboard">
          <ListItemButton>
            <ListItemIcon>
              <InventoryIcon sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary="สินค้า" sx={{ color: 'white' }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding component={Link} to="/admin/orders">
          <ListItemButton>
            <ListItemIcon>
              <ReceiptIcon sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary="จัดการข้อมูลการสั่งซื้อ" sx={{ color: 'white' }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding component={Link} to="/admin/reports">
          <ListItemButton>
            <ListItemIcon>
              <AssessmentIcon sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary="รายงานสินค้า" sx={{ color: 'white' }} />
          </ListItemButton>
        </ListItem>

      </List>
    </Box>
  );

  if (loadingProducts) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>กำลังโหลดข้อมูล สินค้า...</Typography>
      </Box>
    );
  }

  if (errorProducts) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column' }}>
        <Typography color="error" variant="h6">{errorProducts}</Typography>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>กลับหน้าหลัก</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` }, bgcolor: 'background.paper', color: 'text.primary' }}>
        <Toolbar>
          <IconButton color="inherit" aria-label="menu" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Button color="inherit" endIcon={<KeyboardArrowDownIcon />} onClick={handleCategoryDropdownClick} sx={{ textTransform: 'none', fontSize: '1rem', mr: 2 }}>
              {categories.find(cat => cat.id === selectedCategoryFilter)?.name || 'หมวดหมู่'}
            </Button>
            <Menu anchorEl={anchorElCategoryDropdown} open={Boolean(anchorElCategoryDropdown)} onClose={handleCategoryDropdownClose}>
              {categories.map((cat) => (
                <MenuItem key={cat.id} onClick={() => handleCategoryFilterSelect(cat.id)} selected={cat.id === selectedCategoryFilter}>
                  {cat.name}
                </MenuItem>
              ))}
            </Menu>

            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => navigate('/admin/products/add')} sx={{ textTransform: 'none', borderRadius: '20px', px: 3, mr: 2 }}>
              เพิ่มสินค้า
            </Button>

            <TextField
              variant="outlined"
              size="small"
              placeholder="ค้นหา"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                sx: { borderRadius: '20px', bgcolor: '#f0f0f0', pr: 1 },
              }}
              sx={{ width: '250px' }}
            />
          </Box>

          {user && (
            <Box sx={{ ml: 3 }}>
              <Button onClick={handleMenuClickUser} color="inherit" endIcon={<KeyboardArrowDownIcon />} sx={{ textTransform: 'none', fontSize: '1rem' }}>
                {user.email}
              </Button>
              <Menu anchorEl={anchorElUser} open={Boolean(anchorElUser)} onClose={handleMenuCloseUser} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <MenuItem onClick={handleLogout}>ออกจากระบบ</MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#212121', color: 'white' } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#212121', color: 'white' } }} open>
          {drawer}
        </Drawer>
      </Box>

      {/* Main */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: '64px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            จัดการสินค้า
          </Typography>
          <Typography variant="body2" color="text.secondary">
            แสดง {displayedProducts.length} จาก {products.length} รายการ
          </Typography>
        </Box>

        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '8px' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              {/*  Table Header */}
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>สินค้า</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>ชื่อสินค้า</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>หมวดหมู่</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>จำนวน รายละเอียด</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '15%', textAlign: 'center' }}>การดำเนินการ</TableCell>
              </TableRow>
            </TableHead>


            <TableBody>
              {displayedProducts.length > 0 ? (
                displayedProducts.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><Avatar src={item.imageUrl} variant="rounded" sx={{ width: 70, height: 70 }} /></TableCell>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.variantCount} รายการ</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                       <Button
                        variant="contained"
                        onClick={() => navigate(`/admin/products/manage/${item.id}`)}
                        sx={{ mr: 1 }}
                      >
                        จัดการ
                      </Button>
                      {/* ปุ่มลบสินค้า */}
                  <Button 
                    variant="outlined" 
                    color="error" 
                    size="small" 
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteClick(item)}
                  >
                    ลบ
                  </Button>

                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}> 
                    <Typography variant="h6" color="text.secondary">ไม่พบสินค้า</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Stack spacing={2}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Stack>
          </Box>
        )}
      </Box>

      {/* Delete Dialog */}
      { <Dialog open={openDeleteDialog} onClose={handleDeleteCancel}>
        <DialogTitle>{"ยืนยันการลบสินค้า?"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            คุณต้องการลบสินค้าใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">ยกเลิก</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>ลบ</Button>
        </DialogActions>
      </Dialog> }

      {/* Snackbar for notifications */}
      <Snackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
}