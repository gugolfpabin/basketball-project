
import React, { useState, useEffect, useMemo } from 'react';
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
  Container,
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
  Dialog, // Import Dialog for confirmation
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Menu as MenuIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon, // Import Edit icon
  Delete as DeleteIcon, // Import Delete icon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const drawerWidth = 240;

// กำหนดการแมปจาก Category_ID (ตัวเลขใน DB) ไปยัง category_name (สตริงสำหรับแสดงผล)
const categoryIdToDisplayNameMap = {
  1: 'เสื้อบาสเกตบอล',
  2: 'เสื้อ T-Shirt',
  3: 'กางเกงบาสเกตบอล',
  4: 'รองเท้าบาสเกตบอล',
  5: 'ถุงเท้า',
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorElCategoryDropdown, setAnchorElCategoryDropdown] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(0); // 0 for 'ทั้งหมด'

  const [products, setProducts] = useState([]); // State นี้จะเก็บข้อมูล variants ที่ Flatten แล้ว
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(null);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { productId, variantId, productName, size, color }

  const apiBase = 'http://localhost:5000/api';

  const categories = [
    { id: 0, name: 'ทั้งหมด' },
    { id: 1, name: 'เสื้อบาสเกตบอล' },
    { id: 2, name: 'เสื้อ T-Shirt' },
    { id: 3, name: 'กางเกงบาสเกตบอล' },
    { id: 4, name: 'รองเท้าบาสเกตบอล' },
    { id: 5, name: 'ถุงเท้า' },
  ];

  const fetchProducts = async () => {
    setLoadingProducts(true);
    setErrorProducts(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('view', 'admin'); // ระบุ view=admin

      if (selectedCategoryFilter !== 0) {
        queryParams.append('categoryId', selectedCategoryFilter);
      } else {
        queryParams.append('category', 'all');
      }

      if (searchTerm) {
        queryParams.append('searchTerm', searchTerm);
      }

      const url = `${apiBase}/products?${queryParams.toString()}`;
      console.log("Fetching products for Admin Dashboard from URL:", url);
      const response = await axios.get(url);
      setProducts(response.data);
      console.log("Fetched product variants data for Admin Dashboard:", response.data);
    } catch (err) {
      console.error("ข้อผิดพลาดในการดึงข้อมูลสินค้าสำหรับ Admin Dashboard:", err);
      setErrorProducts("ไม่สามารถโหลดข้อมูลสินค้าได้");
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

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
        console.error("ไม่สามารถแยกวิเคราะห์ผู้ใช้จาก localStorage ได้", e);
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }

    fetchProducts();
  }, [navigate, selectedCategoryFilter, searchTerm]);

  const handleMenuClickUser = (event) => { setAnchorElUser(event.currentTarget); };
  const handleMenuCloseUser = () => { setAnchorElUser(null); };
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    handleMenuCloseUser();
  };

  const handleDrawerToggle = () => { setMobileOpen(!mobileOpen); };
  const handleSearchChange = (event) => { setSearchTerm(event.target.value); };
  const handleCategoryDropdownClick = (event) => { setAnchorElCategoryDropdown(event.currentTarget); };
  const handleCategoryDropdownClose = () => { setAnchorElCategoryDropdown(null); };
  const handleCategoryFilterSelect = (categoryId) => {
    setSelectedCategoryFilter(categoryId);
    handleCategoryDropdownClose();
  };

  const displayedProducts = useMemo(() => {
    return products;
  }, [products]);

  // --- Handle Edit (navigate to a new edit page) ---
  const handleEdit = (productId, variantId) => {
    console.log(`แก้ไขสินค้า ID: ${productId}, Variant ID: ${variantId}`);
    // Navigate to a dedicated edit page for this variant
    navigate(`/admin/products/edit/${productId}/${variantId}`);
  };

  // --- Handle Delete (with confirmation dialog) ---
  const handleDeleteClick = (item) => {
    console.log("Delete clicked item:", item);
    setItemToDelete(item);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setOpenDeleteDialog(false);
    if (!itemToDelete) return;

    try {
      // Call Backend API to delete the variant
      const response = await axios.delete(`${apiBase}/products/${itemToDelete.id}/variants/${itemToDelete.variantId}`);
      console.log(response.data.message);
      fetchProducts(); // Re-fetch products to update the table after deletion
    } catch (error) {
      console.error("ข้อผิดพลาดในการลบ Variant:", error);
      alert(`ไม่สามารถลบสินค้าได้: ${error.response?.data?.message || error.message}`); // Show user-friendly error
    } finally {
      setItemToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
    setItemToDelete(null);
  };


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
          <ListItemButton sx={{ '&.active': { bgcolor: 'rgba(255, 255, 255, 0.08)' } }}>
            <ListItemIcon>
              <InventoryIcon sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary="สินค้า" sx={{ color: 'white' }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  const overallLoading = loadingProducts;
  const overallError = errorProducts;

  if (overallLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>กำลังโหลดข้อมูล Dashboard...</Typography>
      </Box>
    );
  }

  if (overallError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column' }}>
        <Typography color="error" variant="h6">{overallError}</Typography>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>กลับหน้าหลัก</Button>
      </Box>
    );
  }

  if (!user || user.role !== 1) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography variant="h6" color="text.secondary">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="เปิด Drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Button
              color="inherit"
              endIcon={<KeyboardArrowDownIcon />}
              onClick={handleCategoryDropdownClick}
              sx={{ textTransform: 'none', fontSize: '1rem', mr: 2 }}
            >
              {categories.find(cat => cat.id === selectedCategoryFilter)?.name || 'หมวดหมู่'}
            </Button>
            <Menu
              anchorEl={anchorElCategoryDropdown}
              open={Boolean(anchorElCategoryDropdown)}
              onClose={handleCategoryDropdownClose}
            >
              {categories.map((cat) => (
                <MenuItem
                  key={cat.id}
                  onClick={() => handleCategoryFilterSelect(cat.id)}
                  selected={cat.id === selectedCategoryFilter}
                >
                  {cat.name}
                </MenuItem>
              ))}
            </Menu>

            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/admin/products/add')} // Navigate to AddProductPage
              sx={{ textTransform: 'none', borderRadius: '20px', px: 3, mr: 2 }}
            >
              เพิ่มสินค้า
            </Button>
            <TextField
              variant="outlined"
              size="small"
              placeholder="ค้นหา"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                sx: { borderRadius: '20px', bgcolor: '#f0f0f0', pr: 1 },
              }}
              sx={{ width: '250px' }}
            />
          </Box>

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
                  {user.role === 1 && (
                    <MenuItem onClick={handleMenuCloseUser} component={Link} to="/dashboard">
                      Dashboard
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleLogout}>
                    ออกจากระบบ
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="โฟลเดอร์กล่องจดหมาย"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#212121', color: 'white' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#212121', color: 'white' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: '64px' }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
          จัดการสินค้า
        </Typography>

        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '8px' }}>
          <Table sx={{ minWidth: 650 }} aria-label="ตารางสินค้า">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>สินค้า</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>ชื่อสินค้า</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>สี</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>ขนาด</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '10%' }}>ราคา</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>จำนวนคงเหลือ</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '20%', textAlign: 'center' }}>การดำเนินการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedProducts.length > 0 ? (
                displayedProducts.map((item) => (
                  <TableRow key={item.variantId} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row">
                      <Avatar
                        src={item.imageUrl}
                        variant="rounded"
                        sx={{ width: 70, height: 70 }}
                      />
                    </TableCell>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.color}</TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell>{item.price} THB</TableCell>
                    <TableCell>{item.stock}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Button
                        variant="contained"
                        color="warning"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEdit(item.id, item.variantId)}
                        sx={{ mr: 1, textTransform: 'none', borderRadius: '20px', px: 2 }}
                      >
                        แก้ไข
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteClick(item)} // Open confirmation dialog
                        sx={{ textTransform: 'none', borderRadius: '20px', px: 2 }}
                      >
                        ลบ
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary">ไม่พบสินค้า</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"ยืนยันการลบสินค้า?"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            คุณต้องการลบสินค้า "{itemToDelete?.productName}" (สี: {itemToDelete?.color}, ขนาด: {itemToDelete?.size}) ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            ยกเลิก
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            ลบ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
