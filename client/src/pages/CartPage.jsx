// src/pages/CartPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Trash2, Plus, Minus, Loader, ShoppingCart } from 'lucide-react';

export default function CartPage() {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const apiBase = 'http://localhost:5000/api';

    useEffect(() => {
        const fetchCartItems = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                setLoading(true);
                const response = await axios.get(`${apiBase}/cart`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setCartItems(response.data);
            } catch (err) {
                setError('ไม่สามารถโหลดข้อมูลตะกร้าสินค้าได้');
            } finally {
                setLoading(false);
            }
        };

        fetchCartItems();
    }, [navigate]);

    // ** ฟังก์ชันสำหรับแก้ไข/ลบสินค้า (จะทำในขั้นตอนถัดไป) **
     const handleUpdateQuantity = async (cartItemId, newQuantity) => { // <--- เปลี่ยนเป็น async
    if (newQuantity < 1) return;

    // 1. อัปเดตหน้าจอทันที (Optimistic Update)
    // เพื่อให้ผู้ใช้เห็นว่าตัวเลขเปลี่ยนแล้ว ไม่ต้องรอ
    const originalItems = [...cartItems]; // เก็บของเก่าไว้เผื่อ Error
    setCartItems(currentItems =>
        currentItems.map(item =>
            item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
        )
    );

    // 2. ส่งคำสั่งไปบันทึกที่ Server
    try {
        const token = localStorage.getItem('token');
        await axios.put(`${apiBase}/cart/update/${cartItemId}`,
            { quantity: newQuantity },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        // ถ้าสำเร็จก็ไม่ต้องทำอะไร เพราะหน้าจอเปลี่ยนไปแล้ว

    } catch (err) {
        alert('ไม่สามารถอัปเดตจำนวนสินค้าได้ กรุณาลองอีกครั้ง');
        console.error("Update quantity error:", err);
        // ถ้า Server Error ให้เอารายการของเก่ากลับมาแสดง
        setCartItems(originalItems);
    }
};

    const handleRemoveItem = async (cartItemId) => { // <--- เปลี่ยนเป็น async
    if (!window.confirm('คุณต้องการลบสินค้านี้ใช่หรือไม่?')) {
        return;
    }

    try {
        // --- ส่วนที่เพิ่มเข้ามา: ส่งคำสั่งลบไปที่ Server ---
        const token = localStorage.getItem('token');
        await axios.delete(`${apiBase}/cart/remove/${cartItemId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        // --- จบส่วนที่เพิ่มเข้ามา ---

        // อัปเดตหน้าจอ (ทำเหมือนเดิม)
        setCartItems(currentItems =>
            currentItems.filter(item => item.cartItemId !== cartItemId)
        );

    } catch (err) {
        alert('ไม่สามารถลบสินค้าได้ กรุณาลองอีกครั้ง');
        console.error("Remove item error:", err);
    }
};

const handleCheckout = async () => {
    console.log("1. เริ่มทำงาน handleCheckout"); // Log ที่ 1

    const token = localStorage.getItem('token');
    if (cartItems.length === 0) {
        alert("ตะกร้าของคุณว่างเปล่า");
        return;
    }

    console.log("2. ข้อมูลที่จะส่งไป Backend:", { // Log ที่ 2
        items: cartItems,
        subtotal: subtotal
    });

    try {
        const response = await axios.post(`${apiBase}/orders/create-manual`,
            {
                items: cartItems,
                subtotal: subtotal
            },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        console.log("3. ได้รับข้อมูลตอบกลับจาก Backend:", response.data); // Log ที่ 3
        navigate('/manual-payment', { state: response.data });
        console.log("4. กำลังจะเปลี่ยนหน้าไป /manual-payment"); // Log ที่ 4

    } catch (err) {
        // Log ที่สำคัญที่สุดตอนเกิดปัญหา
        console.error("เกิดข้อผิดพลาดใน 'catch' block:", err); 
        
        if (err.response) {
            // ถ้า Server ตอบกลับมาพร้อม Error ให้แสดงรายละเอียด
            console.error("ข้อมูล Error จาก Server:", err.response.data);
            console.error("Status Code:", err.response.status);
        }
        
        const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดบางอย่าง กรุณาดูที่ Console';
        alert(errorMessage);
    }
};
    const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin" /></div>;
    if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

    return (
        <div className="bg-gray-50 min-h-screen">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">ตะกร้าสินค้าของคุณ</h1>

                {cartItems.length === 0 ? (
                    <div className="text-center bg-white p-10 rounded-lg shadow">
                        <ShoppingCart className="mx-auto h-16 w-16 text-gray-400" />
                        <h2 className="mt-4 text-xl font-semibold text-gray-700">ตะกร้าของคุณว่างเปล่า</h2>
                        <p className="mt-2 text-gray-500">เลือกซื้อสินค้าที่คุณสนใจได้เลย!</p>
                        <Link to="/" className="mt-6 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                            เลือกซื้อสินค้า
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* รายการสินค้า */}
                        <div className="flex-grow bg-white rounded-lg shadow p-6 h-fit">
                            {cartItems.map(item => (
                                <div key={item.cartItemId} className="flex items-center gap-4 border-b py-4 last:border-b-0">
                                    <img src={item.imageUrl || 'https://placehold.co/100x100'} alt={item.productName} className="w-24 h-24 object-cover rounded-md" />
                                    <div className="flex-grow">
                                        <h3 className="font-semibold text-gray-800">{item.productName}</h3>
                                        <p className="text-sm text-gray-500">สี: {item.color}, ขนาด: {item.size}</p>
                                        <p className="text-md font-bold text-blue-600 mt-1">{item.unitPrice.toFixed(2)} THB</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity - 1)} disabled={item.quantity <= 1} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"><Minus size={16} /></button>
                                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                        <button onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity + 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><Plus size={16} /></button>
                                    </div>
                                    <p className="w-24 text-right font-bold text-gray-800">{(item.unitPrice * item.quantity).toFixed(2)} THB</p>
                                    <button onClick={() => handleRemoveItem(item.cartItemId)} className="text-gray-400 hover:text-red-500"><Trash2 size={20} /></button>
                                </div>
                            ))}
                        </div>

                        {/* สรุปยอด */}
                        <div className="lg:w-80 bg-white rounded-lg shadow p-6 h-fit">
                            <h2 className="text-xl font-semibold border-b pb-4">สรุปรายการสั่งซื้อ</h2>
                            <div className="flex justify-between mt-4">
                                <span>ราคารวม</span>
                                <span>{subtotal.toFixed(2)} THB</span>
                            </div>
                            <div className="flex justify-between mt-2 text-gray-500">
                                <span>ค่าจัดส่ง</span>
                                <span>(คำนวณในขั้นตอนถัดไป)</span>
                            </div>
                            <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
                                <span>ยอดสุทธิ</span>
                                <span>{subtotal.toFixed(2)} THB</span>
                            </div>
                            <button onClick={handleCheckout} className="w-full mt-6 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700">
                                ไปยังหน้าชำระเงิน
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}