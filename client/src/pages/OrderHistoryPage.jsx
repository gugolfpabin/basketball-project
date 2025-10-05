// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import axios from 'axios';
// import { Typography, Button, Box, Paper, IconButton, Menu, MenuItem, Chip,
//     CircularProgress, Pagination, Stack, Divider, Alert } from '@mui/material';
// import { KeyboardArrowDown as KeyboardArrowDownIcon } from '@mui/icons-material';
// import Navbar from '../components/Navbar';



// export default function OrderHistoryPage() {
//     const [orders, setOrders] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
//     const [currentFilter, setCurrentFilter] = useState('all');
//     const apiBase = 'http://localhost:5000/api';

    
//     const filterOptions = [
//         { id: 'all', name: 'ทั้งหมด' },
//         { id: 'verifying', name: 'ระหว่างตรวจสอบ' },
//         { id: 'completed', name: 'ชำระเงินเสร็จสิ้น' },
//         { id: 'cancelled', name: 'ยกเลิกแล้ว' },
//     ];

//     useEffect(() => {
//         const fetchOrders = async () => {
//             setLoading(true);
//             setError('');
//             try {
//                 const token = localStorage.getItem('token');
//                 const response = await axios.get(`${apiBase}/orders/my-history`, {
//                     headers: { 'Authorization': `Bearer ${token}` },
//                     params: { status: currentFilter }
//                 });
//                 setOrders(response.data);
//                  // 👇 แก้ไขตรงนี้เพื่อรับข้อมูลในรูปแบบใหม่
//             // setOrders(response.data.orders); 
//             // setTotalPages(response.data.totalPages);

//             } catch (err) {
//                 setError('ไม่สามารถดึงข้อมูลประวัติการสั่งซื้อได้');
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchOrders();
//     }, [currentFilter]);

//     const getStatusChip = (status) => {
//         switch (status) {
//             case 'pending': return 'bg-yellow-100 text-yellow-800';
//             case 'verifying': return 'bg-blue-100 text-blue-800';
//             case 'completed': case 'paid': case 'shipped': return 'bg-green-100 text-green-800';
//             case 'cancelled': case 'rejected': return 'bg-red-100 text-red-800';
//             default: return 'bg-gray-100 text-gray-800';
//         }
//     };
    
//     return (
//         <>
//     <Navbar />
//         <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
//             <h1 className="text-3xl font-bold text-gray-800 mb-6">ประวัติการสั่งซื้อ</h1>

//             {/* Filter Tabs */}
//             <div className="flex space-x-2 border-b mb-6">
//                 {filterOptions.map(option => (
//                     <button
//                         key={option.id}
//                         onClick={() => setCurrentFilter(option.id)}
//                         className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
//                             currentFilter === option.id
//                                 ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
//                                 : 'text-gray-500 hover:text-blue-600'
//                         }`}
//                     >
//                         {option.name}
//                     </button>
//                 ))}
//             </div>

//             {/* Order List */}
//             {loading ? (
//                 <div className="flex justify-center py-10"><CircularProgress /></div>
//             ) : error ? (
//                 <Alert severity="error">{error}</Alert>
//             ) : orders.length === 0 ? (
//                 <div className="text-center py-10 text-gray-500">
//                     <p>ไม่พบรายการสั่งซื้อในสถานะนี้</p>
//                 </div>
//             ) : (
//                 <div className="space-y-6">
//                     {/* วนลูปแสดงผลแต่ละออเดอร์ */}
//                     {orders.map(order => (
//                         <div key={order.Order_ID} className="bg-white rounded-lg shadow-md overflow-hidden">
//                             {/* Header ของ Card ออเดอร์ */}
//                             <div className="bg-gray-50 p-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b">
//                                 <div>
//                                     <p className="font-bold text-lg text-gray-800">ออเดอร์ #{order.Order_ID}</p>
//                                     <p className="text-sm text-gray-500">
//                                         วันที่สั่งซื้อ: {new Date(order.CreatedAt).toLocaleDateString('th-TH', {
//                                             year: 'numeric', month: 'long', day: 'numeric',
//                                         })}
//                                     </p>
//                                 </div>
//                                 <span className={`mt-2 md:mt-0 px-3 py-1 text-xs font-semibold rounded-full ${getStatusChip(order.Status)}`}>
//                                     {order.Status}
//                                 </span>
//                             </div>

//                             {/* ส่วนแสดงรายการสินค้า */}
//                             <div className="p-4 space-y-4">
//                                 {order.details.map((item, index) => (
//                                     <div key={index} className="flex items-center">
//                                         <img
//                                 src={item.PictureURL || 'https://placehold.co/100x100/E0E0E0/333333?text=No+Image'}
//                                 alt={item.ProductName}
//                                 className="w-16 h-16 object-cover rounded-md mr-4 border"
//                             />
//                                         <div className="flex-grow">
//                                             <p className="font-semibold text-gray-800">{item.ProductName}</p>
//                                             <p className="text-sm text-gray-500">สี: {item.color}, ขนาด: {item.size}</p>
//                                             <p className="text-sm text-gray-500">จำนวน: {item.Quantity} ชิ้น</p>
//                                         </div>
//                                         <p className="text-gray-700 font-semibold">{Number(item.UnitPrice * item.Quantity).toFixed(2)} บาท</p>
//                                     </div>
//                                 ))}
//                             </div>

//                             {/* ส่วนสรุปท้าย Card และหมายเหตุ */}
//                             <div className="bg-gray-50 p-4 border-t">
//                                 {order.AdminNotes && (
//                                     <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded mb-3 text-sm text-blue-800">
//                                         <p className="font-bold">หมายเหตุจากผู้ดูแล:</p>
//                                         <p>{order.AdminNotes}</p>
//                                     </div>
//                                 )}
//                                 <div className="flex justify-end items-center">
//                                     <span className="text-gray-600 mr-2">ยอดรวมสุทธิ:</span>
//                                     <span className="text-xl font-bold text-gray-800">{Number(order.TotalPrice).toFixed(2)} บาท</span>
//                                 </div>
//                             </div>  
                          
                            
//                         </div>
//                     ))}
//                 </div>
                
//             )}
//         </div>
//         </>
//     );
// }

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


export default function OrderHistoryPage() {
    // --- State ---
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentFilter, setCurrentFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [anchorElStatusDropdown, setAnchorElStatusDropdown] = useState(null);

    // --- Constants ---
    const apiBase = 'http://localhost:5000/api';


    const filterOptions = [
        { id: 'all', name: 'ทั้งหมด' },
        { id: 'verifying', name: 'ระหว่างตรวจสอบ' },
        { id: 'completed', name: 'ชำระเงินเสร็จสิ้น' },
        { id: 'cancelled', name: 'ยกเลิกแล้ว' },
    ];

    // --- Data Fetching ---
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
                        page: currentPage 
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

    // --- Handlers ---
    const handleStatusDropdownClick = (event) => setAnchorElStatusDropdown(event.currentTarget);
    const handleStatusDropdownClose = () => setAnchorElStatusDropdown(null);
    const handleStatusFilterSelect = (statusId) => {
        setCurrentFilter(statusId);
        setCurrentPage(1); // กลับไปหน้า 1 เมื่อเปลี่ยนฟิลเตอร์
        handleStatusDropdownClose();
    };
    const handlePageChange = (event, page) => {
        setCurrentPage(page);
    };

    // --- Helper Functions ---
    const getStatusColor = (status) => {
        switch (status) {
            case 'verifying': return 'info';
            case 'completed': case 'paid': case 'shipped': return 'success';
            case 'cancelled': case 'rejected': return 'error';
            default: return 'default';
        }
    };
    
    // --- JSX ---
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
                                    <Chip label={order.Status} color={getStatusColor(order.Status)} size="small" />
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
                                        <Alert severity="info" sx={{ mb: 2, wordBreak: 'break-word' }}>
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