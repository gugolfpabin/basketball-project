import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Trash2, Plus, Minus, Loader, ShoppingCart } from 'lucide-react';

export default function CartPage() {
    const [cartItems, setCartItems] = useState([]);
    const [selectedMap, setSelectedMap] = useState({});
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
                const map = {};
                (response.data || []).forEach(it => { map[it.cartItemId] = true; });
                setSelectedMap(map);
                window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: (response.data || []).length } }));
            } catch (err) {
                setError('ไม่สามารถโหลดข้อมูลตะกร้าสินค้าได้');
            } finally {
                setLoading(false);
            }
        };

        fetchCartItems();
    }, [navigate]);

     const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;

    //อัปเดตหน้าจอทันที เพื่อให้ผู้ใช้เห็นว่าตัวเลขเปลี่ยนแล้ว ไม่ต้องรอ(Optimistic Update)
    const originalItems = [...cartItems];
    setCartItems(currentItems =>
        currentItems.map(item =>
            item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
        )
    );

    try {
        const token = localStorage.getItem('token');
        await axios.put(`${apiBase}/cart/update/${cartItemId}`,
            { quantity: newQuantity },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
    } catch (err) {
        alert('ไม่สามารถอัปเดตจำนวนสินค้าได้ กรุณาลองอีกครั้ง');
        console.error("Update quantity error:", err);
        setCartItems(originalItems);
    }
};

    const handleRemoveItem = async (cartItemId) => {
    if (!window.confirm('คุณต้องการลบสินค้านี้ใช่หรือไม่?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        await axios.delete(`${apiBase}/cart/remove/${cartItemId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        setCartItems(currentItems =>
            currentItems.filter(item => item.cartItemId !== cartItemId)
        );

    } catch (err) {
        alert('ไม่สามารถลบสินค้าได้ กรุณาลองอีกครั้ง');
        console.error("Remove item error:", err);
    }
};

const handleCheckout = async () => {
    console.log("1. เริ่มทำงาน handleCheckout");

    const token = localStorage.getItem('token');
    if (cartItems.length === 0) {
        alert("ตะกร้าของคุณว่างเปล่า");
        return;
    }

    const itemsToSend = cartItems.filter(it => selectedMap[it.cartItemId]);
    if (itemsToSend.length === 0) {
        alert('โปรดเลือกสินค้าที่ต้องการชำระเงินก่อน');
        return;
    }

    try {
        const response = await axios.post(`${apiBase}/orders/create-manual`,
            {
                items: itemsToSend,
                subtotal: selectedSubtotal
            },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        try {
            const cartRes = await axios.get(`${apiBase}/cart`, { headers: { 'Authorization': `Bearer ${token}` } });
            const newCart = cartRes.data || [];
            setCartItems(newCart);
            const newMap = {};
            newCart.forEach(it => { newMap[it.cartItemId] = true; });
            setSelectedMap(newMap);
            window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: newCart.length } }));
            window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'สั่งซื้อสำเร็จ !' } }));
        } catch (refreshErr) {
            console.warn('Failed to refresh cart after checkout:', refreshErr);
        }
        navigate('/manual-payment', { state: response.data });

    } catch (err) {
        console.error("เกิดข้อผิดพลาดใน 'catch' block:", err); 
        
        if (err.response) {
            console.error("ข้อมูล Error จาก Server:", err.response.data);
            console.error("Status Code:", err.response.status);
        }
        
        const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดบางอย่าง กรุณาดูที่ Console';
        alert(errorMessage);
    }
};
    const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const selectedItems = cartItems.filter(it => selectedMap[it.cartItemId]);
    const selectedSubtotal = selectedItems.reduce((s, it) => s + (it.unitPrice * it.quantity), 0);

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
                            <div className="flex items-center justify-between mb-3">
                                <label className="inline-flex items-center gap-2">
                                    <input type="checkbox" checked={cartItems.length>0 && cartItems.every(it => selectedMap[it.cartItemId])} onChange={() => {
                                        const all = cartItems.length>0 && cartItems.every(it => selectedMap[it.cartItemId]);
                                        if (all) setSelectedMap({}); else {
                                            const map = {}; cartItems.forEach(it => { map[it.cartItemId] = true; }); setSelectedMap(map);
                                        }
                                    }} />
                                    <span className="text-sm">เลือกทั้งหมด</span>
                                </label>
                            </div>
                            {cartItems.map(item => (
                                <div key={item.cartItemId} className="flex items-center gap-4 border-b py-4 last:border-b-0">
                                    <div>
                                        <input type="checkbox" checked={!!selectedMap[item.cartItemId]} onChange={(e) => setSelectedMap(prev => ({ ...prev, [item.cartItemId]: e.target.checked }))} />
                                    </div>
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
                                <span>ราคารวม (ที่เลือก {selectedItems.length} รายการ)</span>
                                <span>{selectedSubtotal.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} THB</span>
                            </div>
                            <div className="flex justify-between mt-2 text-gray-500">
                                <span>ค่าจัดส่ง</span>
                                <span>(ฟรี)</span>
                            </div>
                            <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
                                <span>ยอดสุทธิ</span>
                                <span>
  {selectedSubtotal.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} THB
</span>
                            </div>
                            <button onClick={handleCheckout} disabled={selectedItems.length === 0} className={`w-full mt-6 py-3 rounded-md ${selectedItems.length === 0 ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                                {selectedItems.length === 0 ? 'โปรดเลือกสินค้าเพื่อชำระเงิน' : `ไปยังหน้าชำระเงิน (${selectedItems.length} รายการ)`}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}