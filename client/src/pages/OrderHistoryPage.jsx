import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
    CircularProgress, 
    Alert, 
    Box, 
    Paper, 
    Typography, 
    Button, 
    Stack, 
    Chip, 
    Divider, 
    Menu, 
    MenuItem, 
    Pagination 
} from '@mui/material';
import { KeyboardArrowDown as KeyboardArrowDownIcon } from '@mui/icons-material';
import Navbar from '../components/Navbar';

const translateStatus = (status) => {
  switch (status) {
    case 'verifying':
      return 'ระหว่างตรวจสอบ';
    case 'completed':
      return 'ชำระเงินเสร็จสิ้น';
    case 'cancelled':
      return 'ยกเลิก';
    default:
      return status;
  }
};

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentFilter, setCurrentFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [anchorElStatusDropdown, setAnchorElStatusDropdown] = useState(null);

    const apiBase = 'http://localhost:5000/api';

    const filterOptions = [
        { id: 'all', name: 'ทั้งหมด' },
        { id: 'verifying', name: 'ระหว่างตรวจสอบ' },
        { id: 'completed', name: 'ชำระเงินเสร็จสิ้น' },
        { id: 'cancelled', name: 'ยกเลิกแล้ว' },
    ];

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('ไม่พบ Token การยืนยันตัวตน');

                const response = await axios.get(`${apiBase}/orders/my-history`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    params: { 
                        status: currentFilter,
                        page: currentPage,
                        limit: 5
                    }
                });
                
                setOrders(response.data.orders);
                setTotalPages(response.data.totalPages);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'ไม่สามารถดึงข้อมูลประวัติการสั่งซื้อได้');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [currentFilter, currentPage]);

    const handleStatusDropdownClick = (event) => setAnchorElStatusDropdown(event.currentTarget);
    const handleStatusDropdownClose = () => setAnchorElStatusDropdown(null);
    const handleStatusFilterSelect = (statusId) => {
        setCurrentFilter(statusId);
        setCurrentPage(1);
        handleStatusDropdownClose();
    };
    const handlePageChange = (event, page) => {
        setCurrentPage(page);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'verifying': return 'info';
            case 'completed': case 'paid': case 'shipped': return 'success';
            case 'cancelled': case 'rejected': return 'error';
            default: return 'default';
        }
    };
    
    const getAlertSeverityForStatus = (status) => {
      switch (status) {
        case 'completed':
          return 'success';
        case 'cancelled':
          return 'error';
        case 'verifying':
          return 'info';
        default:
          return 'info';
      }
    };

    return (
        <>
            <Navbar />
            <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: 'grey.50', minHeight: '100vh' }}>
                <Box sx={{ maxWidth: '900px', margin: 'auto' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
                        ประวัติการสั่งซื้อ
                    </Typography>

                    {/* Filter Dropdown */}
                    <Box sx={{ mb: 4 }}>
                        <Button 
                            variant="outlined"
                            endIcon={<KeyboardArrowDownIcon />} 
                            onClick={handleStatusDropdownClick}
                        >
                            สถานะ: {filterOptions.find(s => s.id === currentFilter)?.name}
                        </Button>
                        <Menu anchorEl={anchorElStatusDropdown} open={Boolean(anchorElStatusDropdown)} onClose={handleStatusDropdownClose}>
                            {filterOptions.map(s => <MenuItem key={s.id} onClick={() => handleStatusFilterSelect(s.id)} selected={s.id === currentFilter}>{s.name}</MenuItem>)}
                        </Menu>
                    </Box>

                    {/* Order List */}
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
                    ) : error ? (
                        <Alert severity="error">{error}</Alert>
                    ) : orders.length === 0 ? (
                        <Paper sx={{ textAlign: 'center', p: 5 }}>
                            <Typography color="text.secondary">ไม่พบรายการสั่งซื้อในสถานะนี้</Typography>
                        </Paper>
                    ) : (
                        <Stack spacing={3}>
                            {orders.map(order => (
                                <Paper key={order.Order_ID} elevation={2} sx={{ borderRadius: '8px', overflow: 'hidden' }}>
                                    {/* Card Header */}
                                    <Box sx={{ bgcolor: 'grey.100', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                        <Box>
                                            <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>ออเดอร์ #{order.Order_ID}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                วันที่สั่งซื้อ: {new Date(order.CreatedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </Typography>
                                        </Box>
                                        {/* [แก้ไข] เรียกใช้ฟังก์ชันแปลสถานะ */}
                                        <Chip label={translateStatus(order.Status)} color={getStatusColor(order.Status)} size="small" />
                                    </Box>
                                    
                                    {/* Card Body (Product Details) */}
                                    <Stack spacing={2} sx={{ p: 2 }} divider={<Divider />}>
                                        {order.details.map((item, index) => (
                                            <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Box
                                                    component="img"
                                                    src={item.PictureURL || 'https://placehold.co/100x100/E0E0E0/333333?text=No+Image'}
                                                    alt={item.ProductName}
                                                    sx={{ width: 80, height: 80, borderRadius: '4px', mr: 2, objectFit: 'cover' }}
                                                />
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography sx={{ fontWeight: 'bold' }}>{item.ProductName}</Typography>
                                                    <Typography variant="body2" color="text.secondary">สี: {item.color}, ขนาด: {item.size}</Typography>
                                                    <Typography variant="body2" color="text.secondary">จำนวน: {item.Quantity}</Typography>
                                                </Box>
                                                <Typography sx={{ fontWeight: 'bold', minWidth: '80px', textAlign: 'right' }}>฿{Number(item.UnitPrice * item.Quantity).toFixed(2)}</Typography>
                                            </Box>
                                        ))}
                                    </Stack>

                                    {/* Card Footer */}
                                    <Box sx={{ bgcolor: 'grey.100', p: 2 }}>
                                        {order.AdminNotes && (
                                            <Alert severity={getAlertSeverityForStatus(order.Status)} sx={{ mb: 2, wordBreak: 'break-word' }}>
                                            <strong>หมายเหตุจากผู้ดูแล:</strong> {order.AdminNotes}
                                            </Alert>
                                        )}
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            <Typography sx={{ mr: 2 }}>ยอดรวมสุทธิ:</Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>฿{Number(order.TotalPrice).toFixed(2)}</Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            ))}
                        </Stack>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <Pagination
                                count={totalPages}
                                page={currentPage}
                                onChange={handlePageChange}
                                color="primary"
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    )}
                </Box>
            </Box>
        </>
    );
}
