import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronDown, Search, Loader } from 'lucide-react';

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

  // Categories for the dropdown filter
  const categories = [
    { id: 'all', name: 'ทั้งหมด', categoryId: null },
    { id: 'basketball-jerseys', name: 'เสื้อบาสเกตบอล', categoryId: 1 },
    { id: 't-shirts', name: 'เสื้อ T-Shirt', categoryId: 2 },
    { id: 'basketball-shorts', name: 'กางเกงบาสเกตบอล', categoryId: 3 },
    { id: 'basketball-shoes', name: 'รองเท้าบาสเกตบอล', categoryId: 4 },
    { id: 'socks', name: 'ถุงเท้า', categoryId: 5 },
  ];

  // --- Functions for Category Dropdown ---
  const handleMenuClickCategory = (event) => {
    setAnchorElCategory(event.currentTarget);
  };

  const handleMenuCloseCategory = () => {
    setAnchorElCategory(null);
  };

  const handleCategorySelect = (categoryId) => {
    handleMenuCloseCategory();
    setSelectedCategoryId(categoryId);
  };

  // --- Functions for User Dropdown Menu ---
  const handleMenuClickUser = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleMenuCloseUser = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    handleMenuCloseUser();
  };

  // Function to fetch products based on selected category and search term
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${apiBase}/products`;
      const queryParams = new URLSearchParams();

      queryParams.append('view', 'home');

      if (selectedCategoryId !== null) {
        queryParams.append('categoryId', selectedCategoryId);
      }

      if (searchTerm) {
        queryParams.append('searchTerm', searchTerm);
      }

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      console.log("Fetching products from URL:", url);
      const response = await axios.get(url);
      setProducts(response.data);
      console.log("Fetched products data for Home page:", response.data);
    } catch (err) {
      console.error("Error fetching products for Home page:", err);
      setError("ไม่สามารถโหลดสินค้าได้ โปรดตรวจสอบ Backend Server และการเชื่อมต่อฐานข้อมูล");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('user');
        setUser(null);
      }
    }

    fetchProducts();
  }, [selectedCategoryId, searchTerm, apiBase]);

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // useMemo to prepare products for display, including calculated displayPrice and displaySize
  const displayedProducts = useMemo(() => {
    return products.map(product => {
      let displayPrice = 'N/A';
      let displaySize = 'N/A';

      if (product.variants && product.variants.length > 0) {
        const minPriceVariant = product.variants.reduce((minV, currentV) =>
          currentV.price < minV.price ? currentV : minV
        );
        displayPrice = minPriceVariant.price;
        displaySize = minPriceVariant.size;
      }

      return {
        ...product,
        displayPrice,
        displaySize,
      };
    });
  }, [products]);

  return (
    <div className="flex-grow">
      {/* Navbar ด้านบน */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <nav className="flex items-center justify-between px-6 py-4">
          {/* Logo/Brand */}
          <div className="flex-1">
            <Link 
              to="/" 
              className="text-xl font-bold text-gray-900 no-underline hover:text-blue-600 transition-colors"
            >
              Home
            </Link>
          </div>

          {/* Category Dropdown */}
          <div className="relative mx-4">
            <button
              onClick={handleMenuClickCategory}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <span>{categories.find(cat => cat.categoryId === selectedCategoryId)?.name || 'หมวดหมู่'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {/* Category Dropdown Menu */}
            {anchorElCategory && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.categoryId)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        cat.categoryId === selectedCategoryId ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 w-48 sm:w-56 md:w-80">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={handleSearchChange}
              className="ml-3 flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-500"
            />
          </div>

          {/* Login/Register or User Profile Dropdown */}
          <div className="ml-6">
            {user ? (
              <div className="relative">
                <button
                  onClick={handleMenuClickUser}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <span className="text-base">{user.email}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {/* User Dropdown Menu */}
                {anchorElUser && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      {user.role === 1 && (
                        <Link
                          to="/dashboard"
                          onClick={handleMenuCloseUser}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors no-underline"
                        >
                          Dashboard
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={handleMenuCloseUser}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors no-underline"
                      >
                        ข้อมูลส่วนตัว
                      </Link>
                      {user.role === 0 && (
                        <Link
                          to="/orders"
                          onClick={handleMenuCloseUser}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors no-underline"
                        >
                          รายการสั่งซื้อ
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        ออกจากระบบ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/register"
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors no-underline"
                >
                  สมัครสมาชิก
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors no-underline"
                >
                  เข้าสู่ระบบ
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Click outside handler for dropdowns */}
      {(anchorElCategory || anchorElUser) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            handleMenuCloseCategory();
            handleMenuCloseUser();
          }}
        />
      )}

      {/* ส่วนเนื้อหาหลักสำหรับ สินค้า */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-8 text-gray-900">
          {categories.find(cat => cat.categoryId === selectedCategoryId)?.name || 'สินค้า'}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center min-h-48">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">กำลังโหลดสินค้า...</span>
          </div>
        ) : error ? (
          <div className="text-center mt-8">
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              {error}
            </h3>
            <p className="text-gray-500 text-sm">
              โปรดตรวจสอบว่า Backend Server ทำงานอยู่และฐานข้อมูลเชื่อมต่อถูกต้อง
            </p>
          </div>
        ) : displayedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product.id)}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300 h-96 flex flex-col"
              >
                <div className="h-64 w-full overflow-hidden flex-shrink-0">
                  <img
                    src={product.imageUrl || 'https://placehold.co/250x250/E0E0E0/333333?text=No+Image'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 h-32 flex flex-col justify-between flex-shrink-0">
                  <h3 
                    className="font-bold text-gray-900 text-base leading-tight overflow-hidden"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.2em',
                      height: '2.4em'
                    }}
                  >
                    {product.name}
                  </h3>
                  <p className="text-xl font-semibold text-blue-600 mt-2">
                    {product.displayPrice} THB
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center mt-8">
            <h3 className="text-lg font-medium text-gray-500">
              ไม่พบสินค้าที่ตรงกับคำค้นหาหรือหมวดหมู่ที่เลือก
            </h3>
          </div>
        )}
      </main>
    </div>
  );
}