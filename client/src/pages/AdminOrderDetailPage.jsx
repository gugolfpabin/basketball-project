import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Modal, Box, CircularProgress, Alert } from '@mui/material';
import { ChevronRight } from 'lucide-react';

export default function AdminOrderDetailPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const apiBase = 'http://localhost:5000/api';
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const statusOptions = [
        { id: 'verifying', name: 'ระหว่างตรวจสอบ' },
        { id: 'completed', name: 'ชำระเงินเสร็จสิ้น' },
        { id: 'cancelled', name: 'ยกเลิกแล้ว' },
    ];

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${apiBase}/admin/orders/${orderId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setOrder(response.data);
                setNewStatus(response.data.Status);
                setAdminNotes(response.data.AdminNotes || '');
            } catch (err) {
                setError('ไม่สามารถดึงข้อมูลออเดอร์ได้');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);
    const handleSaveChanges = async () => {
        setIsSaving(true);
        setSaveMessage('');
        try {
            const token = localStorage.getItem('token');
            const payload = {
                status: newStatus,
                adminNotes: adminNotes, 
            };
            const response = await axios.put(`${apiBase}/admin/orders/${orderId}/status`,
                payload,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setSaveMessage(response.data.message);
            setOrder(prevOrder => ({ ...prevOrder, Status: newStatus }));
            setTimeout(() => setSaveMessage(''), 4000);
        } catch (err) {
            setSaveMessage(err.response?.data?.message || 'เกิดข้อผิดพลาด');
        } finally {
            setIsSaving(false);
        }
    };
    // --- จบส่วน State และ Logic ---

    if (loading) return <div className="flex items-center justify-center h-screen"><CircularProgress /></div>;
    if (error) return <div className="p-4"><Alert severity="error">{error}</Alert></div>;
    if (!order) return <div className="p-4 text-center">ไม่พบข้อมูลออเดอร์</div>;

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-gray-500 mb-3">
                <Link to="/admin/orders" className="hover:underline">รายการออเดอร์</Link>
                <ChevronRight size={16} className="mx-1" />
                <span className="font-semibold text-gray-700">ออเดอร์ #{order.Order_ID}</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-4">
                รายละเอียดคำสั่งซื้อ
            </h1>

            {/* --- ส่วนที่ 1: รายการสินค้าและสรุปยอด --- */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
                {/* Header Row (for Desktop) */}
                <div className="hidden md:flex text-xs font-bold text-gray-500 uppercase border-b pb-2 mb-2">
                    <div className="w-6/12">สินค้า</div>
                    <div className="w-2/12 text-right">ราคาต่อหน่วย</div>
                    <div className="w-1/12 text-center">จำนวน</div>
                    <div className="w-3/12 text-right">ราคารวม</div>
                </div>
                {/* Item Rows */}
                {order.details.map((item, index) => (
                    <div key={index} className="flex flex-col md:flex-row items-center py-3 border-b last:border-none">
                        {/* Product Info */}
                        <div className="w-full md:w-6/12 flex items-center mb-2 md:mb-0">
                            <img
                                src={item.PictureURL || 'https://placehold.co/100x100/E0E0E0/333333?text=No+Image'}
                                alt={item.ProductName}
                                className="w-16 h-16 object-cover rounded-md mr-4 border"
                            />
                            <div>
                                <p className="font-semibold text-gray-800">{item.ProductName}</p>
                                <p className="text-sm text-gray-500">สี: {item.color}, ขนาด: {item.size}</p>
                            </div>
                        </div>
                        {/* Prices & Quantity */}
                        <div className="w-full md:w-6/12 flex items-center text-sm">
                            <div className="w-4/12 md:w-4/12 text-left md:text-right">
                                <span className="md:hidden text-gray-500 mr-2">ราคา:</span>
                                <span>{Number(item.UnitPrice || item.Price || item.Unit_Price || item.unitPrice || 0).toFixed(2)}</span>
                            </div>
                            <div className="w-4/12 md:w-2/12 text-center">
                                <span className="md:hidden text-gray-500 mr-2">จำนวน:</span>
                                <span>x{item.Quantity}</span>
                            </div>
                            <div className="w-4/12 md:w-6/12 text-right font-semibold text-base">
                                {Number(item.Quantity * (item.UnitPrice || item.Price || item.Unit_Price || item.unitPrice || 0)).toFixed(2)} บาท
                            </div>
                        </div>
                    </div>
                ))}
                 {/* Order Summary */}
                <div className="flex justify-end pt-3 mt-2">
                    <div className="w-full md:w-1/3">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">ราคาสินค้า:</span>
                            <span>{Number(order.TotalPrice).toFixed(2)} บาท</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">ค่าจัดส่ง:</span>
                            <span>0.00 บาท</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-bold">
                            <span>ยอดรวมสุทธิ:</span>
                            <span className="text-blue-600">{Number(order.TotalPrice).toFixed(2)} บาท</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- ส่วนที่ 2: ข้อมูลอื่นๆ (แบ่ง 3 คอลัมน์) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Customer Info */}
                <div className="lg:col-span-1 bg-white rounded-lg shadow p-4">
                    <h2 className="text-base font-bold border-b pb-2 mb-3">ข้อมูลลูกค้าและที่อยู่</h2>
                    <div className="space-y-1 text-sm">
                        
                        <p><strong>ชื่อ:</strong> {order.Title} {order.FirstName} {order.LastName}</p>
                        <p><strong>เบอร์โทร:</strong> {order.Phone}</p>
                        <p className="mt-1">
                            <strong>ที่อยู่:</strong> {order.Address}  ต.{order.SubdistrictName}  อ.{order.DistrictName}  จ.{order.ProvinceName}  {order.PostalCode}
                        </p>
                    </div>
                </div>
                
                {/* Status Update */}
                <div className="lg:col-span-1 bg-white rounded-lg shadow p-4">
                    <h2 className="text-base font-bold border-b pb-2 mb-3">อัปเดตสถานะและหมายเหตุ</h2>
                    <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                    <select
                        id="status-select"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        {statusOptions.map(option => (
                            <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                    </select>
                    {/* Textarea สำหรับ AdminNotes */}
                    <div className="mt-3">
                        <label htmlFor="admin-notes" className="block text-sm font-medium text-gray-700 mb-1">
                            หมายเหตุ (สำหรับลูกค้า)
                        </label>
                        <textarea
                            id="admin-notes"
                            rows={4}
                            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="เช่น เลขพัสดุ, เหตุผลที่ยกเลิก..."
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                        ></textarea>
                    </div>

                     <button
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center"
                    >
                        {isSaving ? <CircularProgress size={20} color="inherit" /> : 'บันทึกการเปลี่ยนแปลง'}
                    </button>
                    {saveMessage && <Alert severity={saveMessage.includes('สำเร็จ') ? 'success' : 'error'} sx={{ mt: 2, p: 1, fontSize: '0.875rem' }}>{saveMessage}</Alert>}
                </div>
                
                {/* Payment Slip */}
                {order.SlipImageURL && (
                    <div className="lg:col-span-1 bg-white rounded-lg shadow p-4">
                        <h2 className="text-base font-bold border-b pb-2 mb-3">หลักฐานการชำระเงิน</h2>
                        <img
                            src={order.SlipImageURL}
                            alt="Payment Slip Thumbnail"
                            className="w-full max-w-[200px] mx-auto h-auto rounded-lg cursor-pointer border hover:opacity-80"
                            onClick={() => setIsModalOpen(true)}
                        />
                         <p className="text-xs text-center text-gray-500 mt-2">คลิกที่รูปเพื่อดูภาพขนาดเต็ม</p>
                    </div>
                )}
            </div>
            
            {/* Modal for Full Size Slip Image */}
            <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box component="img" src={order.SlipImageURL} alt="Payment Slip Full Size" sx={{ maxHeight: '90vh', maxWidth: '90vw', boxShadow: 24 }} />
            </Modal>
        </div>
    );
}