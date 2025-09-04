import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronDown, ShoppingCart, Loader } from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [user, setUser] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(false);

  const [showLoginModal, setShowLoginModal] = useState(false);

  const apiBase = 'http://localhost:5000/api';

  // Load user from localStorage
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

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiBase}/products/${id}`);
        setProduct(response.data);
        if (response.data.imageUrls && response.data.imageUrls.length > 0) {
          setSelectedImage(response.data.imageUrls[0]);
        }
        setError(null);
      } catch (err) {
        setError('ไม่สามารถโหลดรายละเอียดสินค้าได้');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Update selected variant when color or size changes
  useEffect(() => {
    if (product && product.variants && selectedColor && selectedSize) {
      const foundVariant = product.variants.find(
        (v) => v.color === selectedColor && v.size === selectedSize
      );
      setSelectedVariant(foundVariant || null);
    } else {
      setSelectedVariant(null);
    }
  }, [selectedColor, selectedSize, product]);

  const handleAddToCart = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!selectedVariant) {
      alert('กรุณาเลือกสีและขนาด');
      return;
    }
    if (selectedVariant.stock <= 0) {
      alert('สินค้าหมดสต็อก');
      return;
    }
    alert(`เพิ่ม ${product.name} (สี: ${selectedVariant.color}, ขนาด: ${selectedVariant.size}) ลงในตะกร้าแล้ว!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    setAnchorElUser(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">กำลังโหลดสินค้า...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h3 className="text-red-600 text-lg font-semibold">{error}</h3>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h3 className="text-gray-700 text-lg">ไม่พบสินค้า</h3>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  const availableColors = Array.from(new Set(product.variants.map(v => v.color)));
  const availableSizes = Array.from(new Set(product.variants.map(v => v.size)));

  return (
    <div className="flex-grow relative">
      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">คุณต้องเข้าสู่ระบบ</h3>
            <p className="mb-6">กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงในตะกร้า</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                เข้าสู่ระบบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <nav className="flex items-center justify-between px-6 py-4">
          <div className="flex-1">
            <Link to="/" className="text-xl font-bold text-gray-900 no-underline hover:text-blue-600">
              Home
            </Link>
          </div>

          <div className="ml-6">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setAnchorElUser(!anchorElUser)}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  <span>{user.email}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {anchorElUser && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white border rounded-md shadow-lg z-50">
                    <div className="py-1">
                      {user.role === 1 && (
                        <Link
                          to="/dashboard"
                          onClick={() => setAnchorElUser(false)}
                          className="block px-4 py-2 text-sm hover:bg-gray-100 no-underline text-gray-700"
                        >
                          Dashboard
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setAnchorElUser(false)}
                        className="block px-4 py-2 text-sm hover:bg-gray-100 no-underline text-gray-700"
                      >
                        ข้อมูลส่วนตัว
                      </Link>
                      {user.role === 0 && (
                        <Link
                          to="/orders"
                          onClick={() => setAnchorElUser(false)}
                          className="block px-4 py-2 text-sm hover:bg-gray-100 no-underline text-gray-700"
                        >
                          รายการสั่งซื้อ
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
                      >
                        ออกจากระบบ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/register" className="px-4 py-2 text-gray-700 hover:text-gray-900">
                  สมัครสมาชิก
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  เข้าสู่ระบบ
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Product Detail */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Images */}
          <div className="flex-1">
            <div className="flex flex-col-reverse sm:flex-row gap-4">
              {/* Thumbnails */}
              <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto max-h-[400px]">
                {product.imageUrls?.map((imgUrl, index) => (
                  <img
                    key={index}
                    src={imgUrl}
                    alt={`Thumbnail ${index + 1}`}
                    className={`w-20 h-20 object-contain rounded-md cursor-pointer border ${
                      imgUrl === selectedImage ? 'border-blue-600' : 'border-gray-300'
                    }`}
                    onClick={() => setSelectedImage(imgUrl)}
                  />
                ))}
              </div>

              {/* Main Image */}
              <div className="flex-1 flex items-center justify-center">
                <img
                  src={selectedImage || 'https://placehold.co/400x500/E0E0E0/333333?text=Product+Image'}
                  alt={product.name}
                  className="max-h-[500px] object-contain rounded-lg shadow-md"
                />
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            <p className="text-2xl text-blue-600 mb-3">
              {selectedVariant ? selectedVariant.price : product.price} THB
            </p>
            {product.description && (
              <p className="text-gray-600 mb-4">{product.description}</p>
            )}

            {/* Colors */}
            {availableColors.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">สี</h4>
                <div className="flex gap-2">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-full border ${
                        selectedColor === color
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {availableSizes.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">ขนาด</h4>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="">เลือกขนาด</option>
                  {availableSizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Stock */}
            {selectedVariant && (
              <p className="mb-4 font-medium">
                จำนวนคงเหลือ: {selectedVariant.stock > 0 ? selectedVariant.stock : 'สินค้าหมด'}
              </p>
            )}

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stock <= 0}
              className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              เพิ่มลงในตะกร้า
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
