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

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [granularity, setGranularity] = useState('month');
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(endOfMonth(new Date()));
    const [productBreakdown, setProductBreakdown] = useState([]);
    const [viewMode, setViewMode] = useState('summary');
    const [ordersList, setOrdersList] = useState([]);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [orderDetailsMap, setOrderDetailsMap] = useState({});
    const apiBase = 'http://localhost:5000/api/admin';

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
                const payload = response.data;
                const rawReport = (payload.reportData || payload || []);
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
                    date: r.date || r.Date || r.reportDate || r.day || r.label || '',
                    totalSales: parseNumber(r.totalSales ?? r.total_sales ?? r.TotalSales ?? r.sales ?? r.revenue ?? 0),
                    totalCost: parseNumber(r.totalCost ?? r.total_cost ?? r.TotalCost ?? r.cost ?? r.totalCostFromProducts ?? 0),
                    totalProfit: parseNumber(r.totalProfit ?? r.total_profit ?? r.TotalProfit ?? ( (r.totalSales ?? r.total_sales ?? r.TotalSales) - (r.totalCost ?? r.total_cost ?? r.TotalCost) ) ?? 0),
                    orderCount: Number(r.orderCount ?? r.order_count ?? r.OrderCount ?? r.orders ?? 0) || 0,
                });
                const normalized = Array.isArray(rawReport) ? rawReport.map(normalizeRow) : [];
                setReportData(normalized);
                setProductBreakdown(payload.productBreakdown || []);
            } catch (err) {
                setError("ไม่สามารถโหลดข้อมูลรายงานได้");
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [granularity, startDate, endDate]);

    useEffect(() => {
        const fetchOrders = async () => {
            if (viewMode !== 'orders') return;
            setLoading(true);
                try {
                const token = localStorage.getItem('token');
                const params = {
                    status: 'completed',
                    startDate: format(startDate, 'yyyy-MM-dd'),
                    endDate: format(endDate, 'yyyy-MM-dd'),
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
    }, [viewMode, startDate, endDate]);


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
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
        }, {
            label: 'ต้นทุน (บาท)',
            data: reportData.map(d => d.totalCost || 0),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
        }, {
            label: 'กำไร (บาท)',
            data: reportData.map(d => d.totalProfit || ( (d.totalSales || 0) - (d.totalCost || 0) )),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
        }],
    };
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: `รายงานยอดขายแบบราย${granularity === 'day' ? 'วัน' : granularity === 'month' ? 'เดือน' : 'ปี'}` },
        },
        scales: {
            x: { stacked: false },
            y: { stacked: false }
        },
    };
    const formatTHB = (value) => Number(value || 0).toLocaleString('th-TH', { style: 'currency', currency: 'THB' });
    const totalRevenue = reportData.reduce((sum, item) => sum + parseFloat(item.totalSales || 0), 0);
    const totalCostFromReport = reportData.reduce((sum, item) => sum + parseFloat(item.totalCost || 0), 0);
    const totalCost = totalCostFromReport > 0 ? totalCostFromReport : productBreakdown.reduce((s, p) => s + (parseFloat(p.cost || 0) || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const totalOrders = reportData.reduce((sum, item) => sum + (item.orderCount || 0), 0);
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
    const totalCostFromProducts = productBreakdown.reduce((s, p) => s + (parseFloat(p.cost || 0) || 0), 0);
    if (totalCostFromProducts > 0 && Math.abs(totalCostFromProducts - totalCost) > 1) {
        console.warn('Total cost from reportData and productBreakdown differ:', totalCost, totalCostFromProducts);
    }

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

            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#212121', color: 'white' } }}>{drawer}</Drawer>
                <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#212121', color: 'white' } }} open>{drawer}</Drawer>
            </Box>

            <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: '64px' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>รายงานยอดขาย</Typography>
                
                <Paper sx={{ p: 2, mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                    <ToggleButtonGroup color="primary" value={granularity} exclusive onChange={(e, newGran) => newGran && setGranularity(newGran)}>
                        <ToggleButton value="day">รายวัน</ToggleButton>
                        <ToggleButton value="month">รายเดือน</ToggleButton>
                        <ToggleButton value="year">รายปี</ToggleButton>
                    </ToggleButtonGroup>
                    <ToggleButtonGroup value={viewMode} exclusive onChange={(e, val) => val && setViewMode(val)} sx={{ ml: 2 }}>
                        <ToggleButton value="summary">สรุป</ToggleButton>
                        <ToggleButton value="orders">ออเดอร์ (รายการ)</ToggleButton>
                    </ToggleButtonGroup>
                    <DatePicker
                        label="วันที่เริ่มต้น"
                        value={startDate}
                        views={granularity === 'year' ? ['year'] : granularity === 'month' ? ['year','month'] : ['year','month','day']}
                        onChange={(date) => setStartDate(date)}
                    />
                    <DatePicker
                        label="วันที่สิ้นสุด"
                        value={endDate}
                        views={granularity === 'year' ? ['year'] : granularity === 'month' ? ['year','month'] : ['year','month','day']}
                        onChange={(date) => setEndDate(date)}
                    />
                    <Button variant="outlined" onClick={() => {
                        const now = new Date();
                        setStartDate(now);
                        setEndDate(now);
                        setGranularity('day');
                        }}>วันนี้
                        </Button>
                    <Button sx={{ ml: 1 }} variant="contained" color="secondary" onClick={() => exportCSV(reportData)}>Export CSV</Button>
                </Paper>

                {loading ? <CircularProgress /> : error ? <Typography color="error">{error}</Typography> : (
                    <>
                        {viewMode === 'summary' ? (
                            <>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
                                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                                        <Typography variant="h6" color="text.secondary">ยอดขายรวม</Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{totalRevenue.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</Typography>
                                    </Paper>
                                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                                        <Typography variant="h6" color="text.secondary">ต้นทุนรวม</Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{totalCost.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</Typography>
                                        {totalCost === 0 && (productBreakdown && productBreakdown.length > 0) && (
                                            <Typography variant="caption" color="text.secondary">(คำนวณจาก product breakdown)</Typography>
                                        )}
                                        {totalCost > 0 && (totalCostFromReport === 0) && (productBreakdown && productBreakdown.length > 0) && (
                                            <Typography variant="caption" color="text.secondary">(รายงานไม่มีต้นทุนเฉพาะ แสดงจาก product breakdown)</Typography>
                                        )}
                                    </Paper>
                                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                                        <Typography variant="h6" color="text.secondary">กำไรทั้งหมด</Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: totalProfit >= 0 ? 'success.main' : 'error.main' }}>{totalProfit.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</Typography>
                                    </Paper>
                                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                                        <Typography variant="h6" color="text.secondary">ออเดอร์รวมทั้งหมด (สำเร็จ)</Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{totalOrders.toLocaleString('th-TH')} รายการ</Typography>
                                    </Paper>
                                </Box>
                                <Paper sx={{ p: 2 }}>
                                    <Bar options={chartOptions} data={chartData} />
                                </Paper>
                            </>
                        ) : (
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>รายชื่อออเดอร์ที่สำเร็จ</Typography>
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