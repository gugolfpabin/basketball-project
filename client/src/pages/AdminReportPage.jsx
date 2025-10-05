import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, Drawer, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Divider, Paper,
  IconButton, Menu, MenuItem, CircularProgress, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import {
  Inventory as InventoryIcon, Menu as MenuIcon, KeyboardArrowDown as KeyboardArrowDownIcon,
  Receipt as ReceiptIcon, Assessment as AssessmentIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { startOfMonth, endOfMonth, format } from 'date-fns';

// ลงทะเบียน Component ที่จำเป็นสำหรับ Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const drawerWidth = 240;

export default function AdminReportPage() {
    const navigate = useNavigate();
    
    // --- State สำหรับ Layout ---
    const [user, setUser] = useState(null);
    const [anchorElUser, setAnchorElUser] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    // --- State สำหรับหน้ารายงาน ---
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [granularity, setGranularity] = useState('month');
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(endOfMonth(new Date()));
    const apiBase = 'http://localhost:5000/api/admin';

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
                navigate('/login');
            }
        } else {
            navigate('/login');
        }
    }, [navigate]);

    // --- Fetch Report Data ---
    useEffect(() => {
        const fetchReport = async () => {
            if (!startDate || !endDate) return;
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                const params = {
                    granularity,
                    startDate: format(startDate, 'yyyy-MM-dd'),
                    endDate: format(endDate, 'yyyy-MM-dd'),
                };
                const response = await axios.get(`${apiBase}/reports/sales`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    params
                });
                setReportData(response.data);
            } catch (err) {
                setError("ไม่สามารถโหลดข้อมูลรายงานได้");
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [granularity, startDate, endDate]);


    // --- Handlers for Layout ---
    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
    const handleMenuClickUser = (event) => setAnchorElUser(event.currentTarget);
    const handleMenuCloseUser = () => setAnchorElUser(null);
    const handleLogout = () => {
        if (window.confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    // --- Chart Data & Options ---
    const chartData = {
        labels: reportData.map(d => d.date),
        datasets: [{
            label: 'ยอดขาย (บาท)',
            data: reportData.map(d => d.totalSales),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
        }],
    };
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: `รายงานยอดขายแบบราย${granularity === 'day' ? 'วัน' : granularity === 'month' ? 'เดือน' : 'ปี'}` },
        },
    };
    const totalRevenue = reportData.reduce((sum, item) => sum + parseFloat(item.totalSales), 0);
    const totalOrders = reportData.reduce((sum, item) => sum + item.orderCount, 0);

    // --- Drawer JSX (เหมือนเดิม) ---
    const drawer = (
        <Box sx={{ bgcolor: '#212121', height: '100%', color: 'white' }}>
            <Toolbar sx={{ justifyContent: 'center' }}>
                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>ADMIN PANEL</Typography>
            </Toolbar>
            <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.12)' }} />
            <List>
                <ListItem disablePadding component={Link} to="/dashboard"><ListItemButton><ListItemIcon><InventoryIcon sx={{ color: 'white' }} /></ListItemIcon><ListItemText primary="สินค้า" /></ListItemButton></ListItem>
                <ListItem disablePadding component={Link} to="/admin/orders"><ListItemButton><ListItemIcon><ReceiptIcon sx={{ color: 'white' }} /></ListItemIcon><ListItemText primary="จัดการข้อมูลการสั่งซื้อ" /></ListItemButton></ListItem>
                <ListItem disablePadding component={Link} to="/admin/reports"><ListItemButton><ListItemIcon><AssessmentIcon sx={{ color: 'white' }} /></ListItemIcon><ListItemText primary="รายงานสินค้า" /></ListItemButton></ListItem>
            </List>
        </Box>
    );
    
    // --- Main Return JSX ---
    return (
        <Box sx={{ display: 'flex' }}>
            {/* AppBar (เหมือนเดิม) */}
            <AppBar position="fixed" sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` }, bgcolor: 'background.paper', color: 'text.primary' }}>
                <Toolbar>
                    <IconButton color="inherit" aria-label="menu" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}><MenuIcon /></IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>รายงาน</Typography>
                    {user && (
                        <Box>
                            <Button onClick={handleMenuClickUser} color="inherit" endIcon={<KeyboardArrowDownIcon />} sx={{ textTransform: 'none', fontSize: '1rem' }}>
                {user.email}
              </Button>
                            <Menu anchorEl={anchorElUser} open={Boolean(anchorElUser)} onClose={handleMenuCloseUser}><MenuItem onClick={handleLogout}>ออกจากระบบ</MenuItem></Menu>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            {/* Drawer (เหมือนเดิม) */}
            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#212121', color: 'white' } }}>{drawer}</Drawer>
                <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#212121', color: 'white' } }} open>{drawer}</Drawer>
            </Box>

            {/* Main Content (ส่วนของเนื้อหารายงาน) */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: '64px' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>รายงานยอดขาย</Typography>
                
                <Paper sx={{ p: 2, mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                    <ToggleButtonGroup color="primary" value={granularity} exclusive onChange={(e, newGran) => newGran && setGranularity(newGran)}>
                        <ToggleButton value="day">รายวัน</ToggleButton>
                        <ToggleButton value="month">รายเดือน</ToggleButton>
                        <ToggleButton value="year">รายปี</ToggleButton>
                    </ToggleButtonGroup>
                    <DatePicker label="วันที่เริ่มต้น" value={startDate} onChange={(date) => setStartDate(date)} />
                    <DatePicker label="วันที่สิ้นสุด" value={endDate} onChange={(date) => setEndDate(date)} />
                </Paper>

                {loading ? <CircularProgress /> : error ? <Typography color="error">{error}</Typography> : (
                    <>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
                            <Paper sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="h6" color="text.secondary">ยอดขายรวม</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{totalRevenue.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</Typography>
                            </Paper>
                            <Paper sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="h6" color="text.secondary">จำนวนออเดอร์ (ที่สำเร็จ)</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{totalOrders.toLocaleString('th-TH')} รายการ</Typography>
                            </Paper>
                        </Box>
                        <Paper sx={{ p: 2 }}>
                            <Bar options={chartOptions} data={chartData} />
                        </Paper>
                    </>
                )}
            </Box>
        </Box>
    );
}