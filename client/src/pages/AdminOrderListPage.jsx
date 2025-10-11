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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  CircularProgress,
  Pagination,
  Stack,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Menu as MenuIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const drawerWidth = 240;

export default function AdminOrderListPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [anchorElStatusDropdown, setAnchorElStatusDropdown] = useState(null);
    const apiBase = 'http://localhost:5000/api';

  const itemsPerPage = 20;

  const statusOptions = [
    { id: 'all', name: 'ทั้งหมด' },
    { id: 'verifying', name: 'ระหว่างตรวจสอบ' },
    { id: 'completed', name: 'ชำระเงินเสร็จสิ้น' },
    { id: 'cancelled', name: 'ยกเลิกแล้ว' },
  ];

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


    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = localStorage.getItem('token');
                console.log('Token:', token ? 'Found' : 'Not found');
                if (!token) {
                    setError('ไม่พบ token กรุณาเข้าสู่ระบบใหม่');
                    return;
                }
                const response = await axios.get(`${apiBase}/orders`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                setOrders(response.data);
            } catch (err) {
                console.error('Error fetching orders:', err);
                console.error('Error response:', err.response?.data);
                setError(`ไม่สามารถดึงข้อมูลออเดอร์ได้: ${err.response?.data?.message || err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);


  const filteredOrders = useMemo(() => {
    if (selectedStatusFilter === 'all') {
      return orders.filter(order => order.Status !== 'pending');
    }
    return orders.filter(order => order.Status === selectedStatusFilter);
  }, [orders, selectedStatusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage, itemsPerPage]);


  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
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

  const handleStatusDropdownClick = (event) => setAnchorElStatusDropdown(event.currentTarget);
  const handleStatusDropdownClose = () => setAnchorElStatusDropdown(null);
  const handleStatusFilterSelect = (statusId) => {
    setSelectedStatusFilter(statusId);
    setCurrentPage(1); 
    handleStatusDropdownClose();
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verifying': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>กำลังโหลดข้อมูลออเดอร์...</Typography>
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

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` }, bgcolor: 'background.paper', color: 'text.primary' }}>
        <Toolbar>
          <IconButton color="inherit" aria-label="menu" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Button 
              color="inherit" 
              endIcon={<KeyboardArrowDownIcon />} 
              onClick={handleStatusDropdownClick} 
              sx={{ textTransform: 'none', fontSize: '1rem', mr: 2 }}
            >
              {statusOptions.find(status => status.id === selectedStatusFilter)?.name || 'สถานะ'}
            </Button>
            <Menu 
              anchorEl={anchorElStatusDropdown} 
              open={Boolean(anchorElStatusDropdown)} 
              onClose={handleStatusDropdownClose}
            >
              {statusOptions.map((status) => (
                <MenuItem 
                  key={status.id} 
                  onClick={() => handleStatusFilterSelect(status.id)} 
                  selected={status.id === selectedStatusFilter}
                >
                  {status.name}
                </MenuItem>
              ))}
            </Menu>

            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              จัดการข้อมูลการสั่งซื้อ
            </Typography>
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
            รายการออเดอร์ทั้งหมด
          </Typography>
          <Typography variant="body2" color="text.secondary">
            แสดง {paginatedOrders.length} จาก {filteredOrders.length} รายการ
          </Typography>
        </Box>

        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '8px' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Order ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>ลูกค้า</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>วันที่</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>ยอดรวม (บาท)</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>สถานะ</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '20%', textAlign: 'center' }}>การดำเนินการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => (
                  <TableRow key={order.Order_ID}>
                    <TableCell>#{order.Order_ID}</TableCell>
                    <TableCell>{`${order.FirstName} ${order.LastName}`}</TableCell>
                    <TableCell>{new Date(order.CreatedAt).toLocaleDateString('th-TH')}</TableCell>
                    <TableCell>{Number(order.TotalPrice).toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={order.Status} 
                        color={getStatusColor(order.Status)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        size="small" 
                        startIcon={<VisibilityIcon />} 
                        component={Link}
                        to={`/admin/order/${order.Order_ID}`}
                        sx={{ textTransform: 'none', borderRadius: '20px', px: 2 }}
                      >
                        ดูรายละเอียดและจัดการ
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                      {selectedStatusFilter === 'all' ? 'ไม่พบข้อมูลออเดอร์ที่ต้องจัดการ' : 'ไม่พบออเดอร์ในสถานะนี้'}
                    </Typography>
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
    </Box>
    );
}