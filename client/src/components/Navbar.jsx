// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ShoppingCart } from 'lucide-react';
import axios from 'axios';

export default function Navbar() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [anchorElUser, setAnchorElUser] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [toast, setToast] = useState({ open: false, message: '' });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                localStorage.removeItem('user');
                setUser(null);
            }
        }

        const fetchCart = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await axios.get('http://localhost:5000/api/cart', { headers: { Authorization: `Bearer ${token}` } });
                setCartCount((res.data || []).length);
            } catch (e) {}
        };

        fetchCart();

        const onCartUpdated = (e) => {
            if (e?.detail?.count != null) setCartCount(e.detail.count);
            else fetchCart();
        };
        const onToast = (ev) => {
            const msg = ev?.detail?.message || '';
            if (!msg) return;
            setToast({ open: true, message: msg });
            setTimeout(() => setToast({ open: false, message: '' }), 3000);
        };

        window.addEventListener('cartUpdated', onCartUpdated);
        window.addEventListener('toast', onToast);
        return () => {
            window.removeEventListener('cartUpdated', onCartUpdated);
            window.removeEventListener('toast', onToast);
        };
    }, []);

   const handleLogout = () => {
    // แสดงหน้าต่าง Pop-up พร้อมข้อความและปุ่ม "OK" กับ "Cancel"
    if (window.confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
        // ถ้าผู้ใช้กด "OK" (ตกลง) โค้ดในนี้จะทำงาน
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setAnchorElUser(false); // ปิดเมนู Dropdown
        navigate('/login');
    }
};

    return (
        <>
        <header className="bg-white border-b  border-gray-200 shadow-sm">
            <nav className="flex items-center justify-between  px-6 py-4 max-w-7xl mx-auto">
                {/* ส่วนที่ 1: Logo หรือ Home */}
                <div className="flex-1">
                    <Link to="/" className="text-xl font-bold text-gray-900 no-underline hover:text-blue-600">
                        Home
                    </Link>
                </div>

                {/* ส่วนที่ 2: User-specific Controls */}
                <div className="flex items-center space-x-3">
                    {!user && (
                        // --- 1. สำหรับผู้ใช้ทั่วไป (Guest) ---
                        <>
                            <Link to="/register" className="px-4 py-2 text-gray-700 hover:text-gray-900">
                                สมัครสมาชิก
                            </Link>
                            <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                เข้าสู่ระบบ
                            </Link>
                        </>
                    )}

                    {user && (
                        // --- 2. สำหรับสมาชิกและแอดมิน (Logged In) ---
                        <>
                            <Link to="/cart" className="p-2 text-gray-700 hover:text-gray-900">
                                <div className="relative">
                                    <ShoppingCart className="w-6 h-6" />
                                    {/* removed red badge per user request */}
                                </div>
                            </Link>
                            
                            <div className="relative">
                                <button
                                    onClick={() => setAnchorElUser(!anchorElUser)}
                                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900"
                                >
                                    <span>{user.email}</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${anchorElUser ? 'rotate-180' : ''}`} />
                                </button>

                                {anchorElUser && (
                                    <div className="absolute top-full right-0 mt-1 w-48 bg-white border rounded-md shadow-lg z-50">
                                        <div className="py-1">
                                            <Link to="/profile" onClick={() => setAnchorElUser(false)} className="block px-4 py-2 text-sm hover:bg-gray-100 no-underline text-gray-700">
                                                ข้อมูลส่วนตัว
                                            </Link>
                                            <Link to="/my-orders" onClick={() => setAnchorElUser(false)} className="block px-4 py-2 text-sm hover:bg-gray-100 no-underline text-gray-700">
                                                ประวัติการสั่งซื้อ
                                            </Link>
                                            {user.role === 1 && ( // แสดงเฉพาะ Admin
                                                <Link to="/dashboard" onClick={() => setAnchorElUser(false)} className="block px-4 py-2 text-sm hover:bg-gray-100 no-underline text-gray-700">
                                                    Dashboard
                                                </Link>
                                            )}
                                            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700">
                                                ออกจากระบบ
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </nav>
        </header>
        {/* simple text toast (will show briefly when window dispatches 'toast') */}
        {toast.open && (
            <div className="fixed right-6 bottom-6 bg-black text-white px-4 py-2 rounded shadow-lg z-50">
                {toast.message}
            </div>
        )}
        </>
    );
}