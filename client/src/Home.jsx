// src/pages/Home.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronDown, Search, Loader, ShoppingCart } from 'lucide-react';

export default function Home() {
    const navigate = useNavigate();
    const [anchorElCategory, setAnchorElCategory] = useState(null);
    const [anchorElUser, setAnchorElUser] = useState(null);
    const [user, setUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const apiBase = 'http://localhost:5000/api';

    const categories = [
        { id: 'all', name: 'ทั้งหมด', categoryId: null },
        { id: 'basketball-jerseys', name: 'เสื้อบาสเกตบอล', categoryId: 1 },
        { id: 't-shirts', name: 'เสื้อ T-Shirt', categoryId: 2 },
        { id: 'basketball-shorts', name: 'กางเกงบาสเกตบอล', categoryId: 3 },
        { id: 'basketball-shoes', name: 'รองเท้าบาสเกตบอล', categoryId: 4 },
        { id: 'socks', name: 'ถุงเท้า', categoryId: 5 },
    ];

    const handleMenuClickCategory = (event) => setAnchorElCategory(event.currentTarget);
    const handleMenuCloseCategory = () => setAnchorElCategory(null);
    const handleCategorySelect = (categoryId) => {
        handleMenuCloseCategory();
        setSelectedCategoryId(categoryId);
    };

    const handleMenuClickUser = (event) => setAnchorElUser(event.currentTarget);
    const handleMenuCloseUser = () => setAnchorElUser(null);

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
    // ถ้าผู้ใช้กด "Cancel" (ยกเลิก) จะไม่มีอะไรเกิดขึ้น
};

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
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const queryParams = new URLSearchParams({ view: 'home' });
                if (selectedCategoryId) {
                    queryParams.append('categoryId', selectedCategoryId);
                }
                if (searchTerm) {
                    queryParams.append('searchTerm', searchTerm);
                }
                const response = await axios.get(`${apiBase}/products?${queryParams.toString()}`);
                setProducts(response.data);
            } catch (err) {
                setError("ไม่สามารถโหลดสินค้าได้");
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [selectedCategoryId, searchTerm]);

    const handleProductClick = (productId) => navigate(`/product/${productId}`);
    const handleSearchChange = (event) => setSearchTerm(event.target.value);
    
    const displayedProducts = useMemo(() => {
        return products.map(product => {
            let displayPrice = 'N/A';
            if (product.variants && product.variants.length > 0) {
                const prices = product.variants.map(v => v.price);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                displayPrice = minPrice === maxPrice ? `${minPrice}` : `${minPrice} - ${maxPrice}`;
            }
            return { ...product, displayPrice };
        });
    }, [products]);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
                <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="text-xl font-bold text-gray-900 no-underline hover:text-blue-600">
                            Home
                        </Link>
                        {/* Category Dropdown */}
                        <div className="relative hidden md:block">
                            <button onClick={handleMenuClickCategory} className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900">
                                <span>{categories.find(cat => cat.categoryId === selectedCategoryId)?.name || 'หมวดหมู่'}</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            {anchorElCategory && (
                                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-50">
                                    <div className="py-1">
                                        {categories.map((cat) => (
                                            <button key={cat.id} onClick={() => handleCategorySelect(cat.categoryId)}
                                                className={`block w-full text-left px-4 py-2 text-sm ${cat.categoryId === selectedCategoryId ? 'bg-blue-50 text-blue-600' : 'text-gray-700'} hover:bg-gray-100`}>
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 flex justify-center px-4">
                        <div className="w-full max-w-md">
                             <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 w-full">
                                <Search className="w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="ค้นหาสินค้า, สี, ขนาด..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="ml-3 flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* User Controls */}
                    <div className="flex items-center space-x-3">
                        {!user ? (
                            <>
                                <Link to="/register" className="px-4 py-2 text-gray-700 hover:text-gray-900 hidden sm:block">
                                    สมัครสมาชิก
                                </Link>
                                <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                    เข้าสู่ระบบ
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/cart" className="p-2 text-gray-700 hover:text-gray-900">
                                    <ShoppingCart className="w-6 h-6" />
                                </Link>
                                <div className="relative">
                                    <button onClick={handleMenuClickUser} className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900">
                                        <span>{user.email}</span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${anchorElUser ? 'rotate-180' : ''}`} />
                                    </button>
                                    {anchorElUser && (
                                        <div className="absolute top-full right-0 mt-1 w-48 bg-white border rounded-md shadow-lg z-50">
                                            <div className="py-1">
                                                <Link to="/profile" onClick={handleMenuCloseUser} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">ข้อมูลส่วนตัว</Link>
                                                <Link to="/orders" onClick={handleMenuCloseUser} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">ประวัติการสั่งซื้อ</Link>
                                                {user.role === 1 && (
                                                    <Link to="/dashboard" onClick={handleMenuCloseUser} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Dashboard</Link>
                                                )}
                                                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">ออกจากระบบ</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </nav>
            </header>

             {/* Click outside handler for dropdowns */}
            {(anchorElCategory || anchorElUser) && (
                <div className="fixed inset-0 z-40" onClick={() => { handleMenuCloseCategory(); handleMenuCloseUser(); }} />
            )}

            {/* ส่วนเนื้อหาหลักสำหรับ สินค้า */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold mb-8 text-gray-900">
                    {categories.find(cat => cat.categoryId === selectedCategoryId)?.name || 'สินค้าทั้งหมด'}
                </h2>

                {loading ? (
                    <div className="flex items-center justify-center min-h-48">
                        <Loader className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : error ? (
                    <div className="text-center mt-8 text-red-600">{error}</div>
                ) : displayedProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {displayedProducts.map((product) => (
                            <div key={product.id} onClick={() => handleProductClick(product.id)}
                                className="bg-white rounded-lg border overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                                <div className="h-64 w-full overflow-hidden">
                                    <img src={product.imageUrl || 'https://placehold.co/250x250/E0E0E0/333333?text=No+Image'}
                                        alt={product.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 truncate">{product.name}</h3>
                                    <p className="text-xl font-semibold text-blue-600 mt-2">{product.displayPrice} THB</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center mt-8 text-gray-500">ไม่พบสินค้า</div>
                )}
            </main>
        </div>
    );
}