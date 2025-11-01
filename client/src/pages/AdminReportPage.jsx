import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, Drawer, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Divider, Paper,
  IconButton, Menu, MenuItem, CircularProgress, ToggleButtonGroup, ToggleButton, FormControl, InputLabel, Select
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
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

function exportCSV(data) {
    if (!data || !data.length) return;
    const headers = ['date','totalSales','totalCost','totalProfit','orderCount'];
    const rows = data.map(r => headers.map(h => (r[h] != null ? String(r[h]) : '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const drawerWidth = 240;

export default function AdminReportPage() {
    const navigate = useNavigate();
    
    const [user, setUser] = useState(null);
    const [anchorElUser, setAnchorElUser] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    // --- State สำหรับรายงาน ---
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State การกรอง
    const [filterMode, setFilterMode] = useState('month'); // 'day', 'month', 'year'
    const [selectedDate, setSelectedDate] = useState(new Date()); 

    const [viewMode, setViewMode] = useState('summary'); 
    const [ordersList, setOrdersList] = useState([]);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [orderDetailsMap, setOrderDetailsMap] = useState({});
    
    const [topProducts, setTopProducts] = useState([]);
    const [topCategories, setTopCategories] = useState([]);
    const [categoriesList, setCategoriesList] = useState([]); 
    const [selectedCategory, setSelectedCategory] = useState('all');

    const apiBase = 'http://localhost:5000/api/admin';

    // (useEffect ดึง Categories)
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${apiBase}/categories`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setCategoriesList(res.data || []);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };
        fetchCategories();
    }, [apiBase]);

    // (useEffect ตรวจสอบ user)
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

    // (useEffect [fetchReport])
    useEffect(() => {
        const fetchReport = async () => {
            if (!selectedDate) return; 
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                const params = {
                    filterMode: filterMode,
                    selectedDate: format(selectedDate, 'yyyy-MM-dd'), 
                    categoryId: selectedCategory 
                };
                const response = await axios.get(`${apiBase}/reports/sales`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    params
                });
                const payload = response.data;
                const rawReport = (payload.reportData || []);
                
                const parseNumber = (v) => {
                    if (v == null) return 0;
                    if (typeof v === 'number') return v;
                    if (typeof v === 'string') {
                        const cleaned = v.replace(/[,\s฿€£¥]/g, '').replace(/[^0-9.-]/g, '');
                        const n = parseFloat(cleaned);
                        return isNaN(n) ? 0 : n;
                    }
                    return 0;
                };
                const normalizeRow = (r) => ({
                    date: filterMode === 'day' ? `${r.date}:00 น.` : r.date,
                    totalSales: parseNumber(r.totalSales ?? 0),
                    totalCost: parseNumber(r.totalCost ?? 0),
                    totalProfit: parseNumber(r.totalProfit ?? 0),
                    orderCount: Number(r.orderCount ?? 0) || 0,
                });

                const normalized = Array.isArray(rawReport) ? rawReport.map(normalizeRow) : [];
                setReportData(normalized);
                setTopProducts(payload.topProducts || []);
                setTopCategories(payload.topCategories || []);

            } catch (err) {
                setError("ไม่สามารถโหลดข้อมูลรายงานได้");
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [filterMode, selectedDate, selectedCategory]);

    // (useEffect [fetchOrders])
    useEffect(() => {
        const fetchOrders = async () => {
            if (viewMode !== 'orders' || !selectedDate) return;
            setLoading(true);

            let sDate, eDate;
            if (filterMode === 'day') {
                sDate = format(startOfDay(selectedDate), 'yyyy-MM-dd');
                eDate = format(endOfDay(selectedDate), 'yyyy-MM-dd');
            } else if (filterMode === 'year') {
                sDate = format(startOfYear(selectedDate), 'yyyy-MM-dd');
                eDate = format(endOfYear(selectedDate), 'yyyy-MM-dd');
            } else { // month
                sDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
                eDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
            }

            try {
                const token = localStorage.getItem('token');
                const params = {
                    status: 'completed',
                    startDate: sDate,
                    endDate: eDate, 
                    page: 1
                };
                const res = await axios.get(`${apiBase}/orders`, { headers: { Authorization: `Bearer ${token}` }, params });
                const all = res.data.orders || res.data || [];
                const filtered = (all || []).filter(o => {
                    const status = (o.Status || o.status || o.StatusName || '').toString().toLowerCase();
                    return !!status && (status.includes('completed') || status.includes('paid') || status.includes('ชำระ') || status.includes('สำเร็จ'));
                });
                setOrdersList(filtered);
            } catch (err) {
                console.error('Failed to fetch orders', err);
                setOrdersList([]);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [viewMode, selectedDate, filterMode]);


    // --- [ย้ายมานี่] ---
    // 1. ย้าย useMemo มาไว้ที่ Top Level ของ Component
    const groupedTopProducts = React.useMemo(() => {
        return topProducts.reduce((acc, product) => {
            const category = product.CategoryName || 'ไม่ระบุประเภท';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(product);
            return acc;
        }, {}); // ได้ผลลัพธ์เป็น { 'เสื้อ': [...], 'กางเกง': [...] }
    }, [topProducts]); // คำนวณใหม่เมื่อ topProducts เปลี่ยน


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

    const chartData = {
        labels: reportData.map(d => d.date),
        datasets: [{
            label: 'ยอดขาย (บาท)',
            data: reportData.map(d => d.totalSales),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
        }, {
            label: 'ต้นทุน (บาท)',
            data: reportData.map(d => d.totalCost || 0),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
        }, {
            label: 'กำไร (บาท)',
            data: reportData.map(d => d.totalProfit || 0),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
        }],
    };
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: `รายงานยอดขาย` },
        },
    };

    const formatTHB = (value) => Number(value || 0).toLocaleString('th-TH', { style: 'currency', currency: 'THB' });
    
    // (คำนวณ KPI จาก topProducts)
    const totalRevenue = topProducts.reduce((sum, item) => sum + parseFloat(item.totalSales || 0), 0);
    const totalCost = topProducts.reduce((sum, item) => sum + parseFloat(item.totalCost || 0), 0);
    const totalProfit = topProducts.reduce((sum, item) => sum + parseFloat(item.totalProfit || 0), 0);
    const totalOrders = reportData.reduce((sum, item) => sum + (item.orderCount || 0), 0);
    
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
    
    return (
        <Box sx={{ display: 'flex' }}>
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

            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#212121', color: 'white' } }}>{drawer}</Drawer>
                <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#212121', color: 'white' } }} open>{drawer}</Drawer>
            </Box>

            {/* Main Content */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: '64px' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>รายงานยอดขาย</Typography>
                
                {/* (Filter Bar) */}
                <Paper sx={{ p: 2, mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                    
                    <ToggleButtonGroup color="primary" value={filterMode} exclusive onChange={(e, newMode) => newMode && setFilterMode(newMode)}>
                        <ToggleButton value="day">เลือกวัน</ToggleButton>
                        <ToggleButton value="month">เลือกเดือน</ToggleButton>
                        <ToggleButton value="year">เลือกปี</ToggleButton>
                    </ToggleButtonGroup>
                    
                    <ToggleButtonGroup value={viewMode} exclusive onChange={(e, val) => val && setViewMode(val)} sx={{ ml: 2 }}>
                        <ToggleButton value="summary">สรุป (กราฟ)</ToggleButton>
                        <ToggleButton value="products">สินค้าขายดี</ToggleButton>
                        <ToggleButton value="orders">รายการคำสั่งซื้อ</ToggleButton>
                    </ToggleButtonGroup>
                    
                    <FormControl sx={{ minWidth: 200 }} size="small">
                        <InputLabel>ประเภทสินค้า</InputLabel>
                        <Select
                            value={selectedCategory}
                            label="ประเภทสินค้า"
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <MenuItem value="all"><em>ทั้งหมด</em></MenuItem>
                            {categoriesList.map((cat) => (
                                <MenuItem key={cat.Category_ID} value={cat.Category_ID}>
                                    {cat.CategoryName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <DatePicker
                        label={filterMode === 'day' ? 'เลือกวัน' : filterMode === 'month' ? 'เลือกเดือน' : 'เลือกปี'}
                        value={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        views={filterMode === 'year' ? ['year'] : filterMode === 'month' ? ['year', 'month'] : ['year', 'month', 'day']}
                    />
                    
                    <Button sx={{ ml: 'auto' }} variant="contained" color="secondary" onClick={() => exportCSV(reportData)}>Export CSV (กราฟ)</Button>
                </Paper>

                {/* (ส่วนแสดงผลรายงาน) */}
                {loading ? <CircularProgress /> : error ? <Typography color="error">{error}</Typography> : (
                    <>
                        {/* (KPI Boxes) */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
                            <Paper sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="h6" color="text.secondary">ยอดขายรวม</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{formatTHB(totalRevenue)}</Typography>
                            </Paper>
                            <Paper sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="h6" color="text.secondary">ต้นทุนรวม</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{formatTHB(totalCost)}</Typography>
                            </Paper>
                            <Paper sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="h6" color="text.secondary">กำไรทั้งหมด</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: totalProfit >= 0 ? 'success.main' : 'error.main' }}>{formatTHB(totalProfit)}</Typography>
                            </Paper>
                            <Paper sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="h6" color="text.secondary">ออเดอร์รวม (สำเร็จ)</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{totalOrders.toLocaleString('th-TH')} รายการ</Typography>
                            </Paper>
                        </Box>

                        {/* (ส่วนแสดงผลตาม ViewMode) */}
                        {viewMode === 'summary' ? (
                            <Paper sx={{ p: 2 }}>
                                <Bar options={chartOptions} data={chartData} />
                            </Paper>
                        ) : viewMode === 'products' ? (
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>รายงานสินค้าขายดี (เรียงตามจำนวน)</Typography>
                                <Box sx={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #ddd' }}>
                                                <th style={{ textAlign: 'left', padding: 8 }}>สินค้า</th>
                                                <th style={{ textAlign: 'left', padding: 8 }}>ประเภท</th>
                                                <th style={{ textAlign: 'right', padding: 8 }}>จำนวน (ชิ้น)</th>
                                                <th style={{ textAlign: 'right', padding: 8 }}>ยอดขายรวม</th>
                                                <th style={{ textAlign: 'right', padding: 8 }}>ต้นทุนรวม</th>
                                                <th style={{ textAlign: 'right', padding: 8 }}>กำไรรวม</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topProducts.map(p => (
                                                <tr key={p.Product_ID} style={{ borderTop: '1px solid #eee' }}>
                                                    <td style={{ padding: 8 }}>{p.ProductName}</td>
                                                    <td style={{ padding: 8 }}>{p.CategoryName}</td>
                                                    <td style={{ padding: 8, textAlign: 'right' }}>{p.totalQtySold}</td>
                                                    <td style={{ padding: 8, textAlign: 'right' }}>{formatTHB(p.totalSales)}</td>
                                                    <td style={{ padding: 8, textAlign: 'right' }}>{formatTHB(p.totalCost)}</td>
                                                    <td style={{ padding: 8, textAlign: 'right', color: p.totalProfit >= 0 ? 'inherit' : 'red' }}>{formatTHB(p.totalProfit)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </Box>
                            </Paper>
                        ) :  (
                            // (viewMode === 'orders')
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>รายการคำสั่งซื้อที่ชำระเงินเสร็จสิ้น (ในช่วงวันที่เลือก)</Typography>
                                <Box sx={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ textAlign: 'left', padding: 8 }}>Order ID</th>
                                                <th style={{ textAlign: 'left', padding: 8 }}>วันที่</th>
                                                <th style={{ textAlign: 'right', padding: 8 }}>ยอดรวม (฿)</th>
                                                <th style={{ textAlign: 'right', padding: 8 }}>จำนวนรายการ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ordersList.map(o => (
                                                <React.Fragment key={o.Order_ID}>
                                                    <tr style={{ borderTop: '1px solid #eee' }}>
                                                        <td style={{ padding: 8 }}>
                                                            <button onClick={async () => {
                                                                if (expandedOrderId === o.Order_ID) {
                                                                    setExpandedOrderId(null);
                                                                    return;
                                                                }
                                                                setExpandedOrderId(o.Order_ID);
                                                                if (!orderDetailsMap[o.Order_ID]) {
                                                                    try {
                                                                        const token = localStorage.getItem('token');
                                                                        const res = await axios.get(`${apiBase}/orders/${o.Order_ID}`, { headers: { Authorization: `Bearer ${token}` } });
                                                                        setOrderDetailsMap(prev => ({ ...prev, [o.Order_ID]: res.data }));
                                                                    } catch (err) {
                                                                        console.error('Failed to load order details', err);
                                                                    }
                                                                }
                                                            }} style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer' }}>{o.Order_ID}</button>
                                                        </td>
                                                        <td style={{ padding: 8 }}>{new Date(o.CreatedAt).toLocaleString()}</td>
                                                        <td style={{ padding: 8, textAlign: 'right' }}>{formatTHB(o.TotalPrice || 0)}</td>
                                                        <td style={{ padding: 8, textAlign: 'right' }}>{o.itemCount || 0}</td>
                                                    </tr>
                                                    {expandedOrderId === o.Order_ID && (
                                                        <tr>
                                                            <td colSpan={4} style={{ background: '#fafafa', padding: 8 }}>
                                                                {/* (โค้ดแสดงรายละเอียด Order Detail - เหมือนเดิม) */}
                                                                {orderDetailsMap[o.Order_ID] ? (
                                                                    (() => {
                                                                        const ord = orderDetailsMap[o.Order_ID];
                                                                        const details = ord.details || [];
                                                                        const getUnitPrice = (x) => Number(x.UnitPrice || x.Price || x.Unit_Price || x.unitPrice || 0);
                                                                        const getUnitCost = (x) => Number(x.UnitCost || x.Cost || x.cost || x.Unit_Cost || x.UnitCost || 0);
                                                                        const totalCostCalc = details.reduce((s, x) => s + (getUnitCost(x) * (Number(x.Quantity || 0))), 0);
                                                                        const totalPriceCalc = Number(ord.TotalPrice || o.TotalPrice || details.reduce((s,x)=> s + (getUnitPrice(x) * Number(x.Quantity||0)),0) || 0);
                                                                        const totalProfitCalc = totalPriceCalc - totalCostCalc;
                                                                        return (
                                                                            <div>
                                                                                <div style={{ fontWeight: 'bold', marginBottom: 6 }}>รายละเอียดสินค้า</div>
                                                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                                                    <thead>
                                                                                        <tr>
                                                                                            <th style={{ textAlign: 'left', padding: 6 }}>สินค้า</th>
                                                                                            <th style={{ textAlign: 'right', padding: 6 }}>ราคา/ตัว</th>
                                                                                            <th style={{ textAlign: 'right', padding: 6 }}>ต้นทุน/ตัว</th>
                                                                                            <th style={{ textAlign: 'right', padding: 6 }}>กำไร/ตัว</th>
                                                                                            <th style={{ textAlign: 'right', padding: 6 }}>จำนวน</th>
                                                                                            <th style={{ textAlign: 'right', padding: 6 }}>รวมราคาขาย</th>
                                                                                            <th style={{ textAlign: 'right', padding: 6 }}>รวมต้นทุน</th>
                                                                                            <th style={{ textAlign: 'right', padding: 6 }}>รวมกำไร</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {details.map((d, i) => {
                                                                                            const unitPrice = getUnitPrice(d);
                                                                                            const UnitCost = getUnitCost(d);
                                                                                            const qty = Number(d.Quantity || 0);
                                                                                            const profitPer = unitPrice - UnitCost;
                                                                                            const profitTotal = profitPer * qty;
                                                                                            return (
                                                                                                <tr key={i}>
                                                                                                    <td style={{ padding: 6 }}>{d.ProductName} {d.color ? `(${d.color})` : ''} {d.size ? `/${d.size}` : ''}</td>
                                                                                                    <td style={{ padding: 6, textAlign: 'right' }}>{formatTHB(unitPrice)}</td>
                                                                                                    <td style={{ padding: 6, textAlign: 'right' }}>{formatTHB(UnitCost)}</td>
                                                                                                    <td style={{ padding: 6, textAlign: 'right' }}>{formatTHB(profitPer)}</td>
                                                                                                    <td style={{ padding: 6, textAlign: 'right' }}>{qty}</td>
                                                                                                    <td style={{ padding: 6, textAlign: 'right' }}>{formatTHB(unitPrice * qty)}</td>
                                                                                                    <td style={{ padding: 6, textAlign: 'right' }}>{formatTHB(UnitCost * qty)}</td>
                                                                                                    <td style={{ padding: 6, textAlign: 'right' }}>{formatTHB(profitTotal)}</td>
                                                                                                </tr>
                                                                                            );
                                                                                        })}
                                                                                    </tbody>
                                                                                </table>
                                                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginTop: 12 }}>
                                                                                    <div>ยอดรวมออเดอร์: <b>{formatTHB(totalPriceCalc)}</b></div>
                                                                                    <div>ยอดรวมต้นทุน: <b>{formatTHB(totalCostCalc)}</b></div>
                                                                                    <div>กำไร: <b style={{ color: totalProfitCalc >= 0 ? undefined : 'red' }}>{formatTHB(totalProfitCalc)}</b></div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })()
                                                                ) : (
                                                                    <div>กำลังโหลดรายละเอียด...</div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </Box>
                            </Paper>
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
}