
// src/pages/ProductDetailPage.jsx
import React, { useState, useEffect, useMemo } from 'react'; // <--- เพิ่ม useMemo
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronDown, ShoppingCart, Loader } from 'lucide-react';
import Navbar from '../components/Navbar';



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
    const [currentView, setCurrentView] = useState('front'); // 'front' หรือ 'back'
    const [colorImages, setColorImages] = useState({}); // เก็บรูปของแต่ละสี
    const [user, setUser] = useState(null);
    const [anchorElUser, setAnchorElUser] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');


    const apiBase = 'http://localhost:5000/api';

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));

        const fetchProduct = async () => {
            try {
                // Reset state ก่อน fetch ใหม่
                setLoading(true);
                setProduct(null); 
                setError(null);
                
                const response = await axios.get(`${apiBase}/products/${id}`);
                setProduct(response.data);
                
                // จัดกลุ่มรูปภาพตามสี
                if (response.data.variants && response.data.variants.length > 0) {
                    const imageGroups = {};
                    response.data.variants.forEach(variant => {
                        if (variant.images) {
                            imageGroups[variant.color] = {
                                front: variant.images.find(img => img.ImageType === 'front')?.PictureURL || '',
                                back: variant.images.find(img => img.ImageType === 'back')?.PictureURL || ''
                            };
                        }
                    });
                    setColorImages(imageGroups);
                    
                    // เลือกสีแรกที่มีรูป
                    const firstColor = Object.keys(imageGroups)[0];
                    if (firstColor) {
                        setSelectedColor(firstColor);
                        setSelectedImage(imageGroups[firstColor].front || imageGroups[firstColor].back || '');
                    }
                }
            } catch (err) {
                setError('ไม่สามารถโหลดรายละเอียดสินค้าได้');
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    useEffect(() => {
        if (product && product.variants && selectedColor && selectedSize) {
            const foundVariant = product.variants.find(v => v.color === selectedColor && v.size === selectedSize);
            setSelectedVariant(foundVariant || null);
        } else {
            setSelectedVariant(null);
        }
    }, [selectedColor, selectedSize, product]);

    // [แก้ไข] ใช้ useMemo เพื่อคำนวณค่าต่างๆ อย่างปลอดภัย
    const availableColors = useMemo(() => {
        // ถ้ายังไม่มี product หรือ variants ให้ return array ว่างกลับไปก่อน
        if (!product || !product.variants) return [];
        // ถ้ามีแล้ว ค่อยคำนวณ
        return [...new Set(product.variants.map(v => v.color))];
    }, [product]); // คำสั่งนี้จะทำงานใหม่ก็ต่อเมื่อ product เปลี่ยนแปลง

    const currentColorImages = useMemo(() => {
        if (!selectedColor || !colorImages[selectedColor]) return [];
        const images = [];
        if (colorImages[selectedColor].front) images.push(colorImages[selectedColor].front);
        if (colorImages[selectedColor].back) images.push(colorImages[selectedColor].back);
        return images;
    }, [selectedColor, colorImages]);

    const availableSizes = useMemo(() => {
        if (!product || !product.variants || !selectedColor) return [];
        return [...new Set(product.variants
            .filter(v => v.color === selectedColor)
            .map(v => v.size))
        ];
    }, [product, selectedColor]);


    const handleColorSelect = (color) => {
        setSelectedColor(color);
        setSelectedSize(''); // Reset ขนาดที่เลือกเมื่อเปลี่ยนสี
        setCurrentView('front'); // Reset เป็นรูปหน้า
        if (colorImages[color]) {
            setSelectedImage(colorImages[color].front || colorImages[color].back || '');
        }
    };

    const handleViewToggle = (view) => {
        setCurrentView(view);
        if (selectedColor && colorImages[selectedColor]) {
            setSelectedImage(colorImages[selectedColor][view] || '');
        }
    };
    


    const handleAddToCart =  async () => {
        if (!user) {
        setShowLoginModal(true);
        return;
       }

       if (!selectedVariant) {
        setModalMessage('กรุณาเลือกสีและขนาด');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        return;
    }
    if (selectedVariant.stock <= 0) {
        setModalMessage('สินค้าหมดสต็อก');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        return;
    }
    console.log('ตรวจสอบ object selectedVariant ทั้งหมด:', selectedVariant);
    console.log('ข้อมูลที่จะส่งไป Backend:', {
        variantId: selectedVariant.Variant_ID,
        quantity: 1
    });
     try {
        const token = localStorage.getItem('token'); // ดึง token ที่เก็บไว้ตอน login
        if (!token) {
            alert('Session หมดอายุ, กรุณาเข้าสู่ระบบใหม่');
            navigate('/login');
            return;
        }

        const response = await axios.post(
            `${apiBase}/cart/add`, // Endpoint ที่เราจะสร้าง
            {
                variantId: selectedVariant.variantId, // ส่ง Variant_ID ไป
                quantity: 1 // กำหนดจำนวนเบื้องต้นเป็น 1
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}` // ส่ง token ไปใน header
                }
            }
            
        ); ;setTimeout(() => navigate('/cart'), 2000);

        setModalMessage(response.data.message || 'เพิ่มสินค้าลงตะกร้าสำเร็จ!');
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);

    } catch (err) {
         const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาด';
            setModalMessage(errorMessage);
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 3000);
    }
  };

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
                <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    กลับหน้าหลัก
                </button>
            </div>
        );
    }
    
    // Guard สุดท้าย ถ้าโหลดเสร็จแล้ว แต่ไม่มีข้อมูล
    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h3 className="text-gray-700 text-lg">ไม่พบสินค้า</h3>
                <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    กลับหน้าหลัก
                </button>
            </div>
        );
    }

    return (
        <div className="flex-grow relative">
           <Navbar />
            {/* ... (Navbar และ Modal เหมือนเดิม) ... */}

           {showLoginModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">คุณต้องเข้าสู่ระบบก่อน</h3>
                        <p className="text-gray-600 mb-6">กรุณาเข้าสู่ระบบเพื่อเพิ่มสินค้าลงในตะกร้าของคุณ</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                ไปหน้าเข้าสู่ระบบ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSuccessModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 transition-opacity duration-300">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 flex items-center gap-4 animate-fade-in-down">
                    {/* ไอคอน Checkmark (SVG) */}
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p className="font-semibold text-gray-800">{modalMessage}</p>
                </div>
            </div>
        )}

            
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left: Images */}
                    <div className="flex-1">
                        <div className="flex flex-col-reverse sm:flex-row gap-4">
                            {/* Thumbnails */}
                            <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto max-h-[400px]">
                                {currentColorImages.map((imgUrl, index) => (
                                    <img key={index} src={imgUrl} alt={`Thumbnail ${index + 1}`}
                                        className={`w-20 h-20 object-contain rounded-md cursor-pointer border ${
                                            imgUrl === selectedImage ? 'border-blue-600' : 'border-gray-300'
                                        }`}
                                        onClick={() => setSelectedImage(imgUrl)}
                                    />
                                ))}
                            </div>
                            {/* Main Image */}
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <img src={selectedImage || 'https://placehold.co/400x500/E0E0E0/333333?text=Product+Image'} alt={product.name} className="max-h-[500px] object-contain rounded-lg shadow-md" />
                                
                            
                            </div>
                        </div>
                    </div>

                    {/* Right: Details */}
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
                        <p className="text-2xl text-blue-600 mb-3">
                            {selectedVariant 
                                ? `${selectedVariant.price} THB` 
                                : product.variants.length > 0 ? `${Math.min(...product.variants.map(v => v.price))} - ${Math.max(...product.variants.map(v => v.price))} THB` : ''
                            }
                        </p>
                        
                        {product.description && <p className="text-gray-600 mb-4">{product.description}</p>}

                        {/* Colors */}
                        <div className="mb-4">
                            <h4 className="font-semibold mb-2">สี</h4>
                            <div className="flex gap-2">
                                {availableColors.map((color) => (
                                    <button key={color} onClick={() => handleColorSelect(color)}
                                        className={`px-4 py-2 rounded-full border ${selectedColor === color ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}>
                                        {color}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sizes */}
                        {selectedColor && availableSizes.length > 0 && (
                            <div className="mb-4">
                                <h4 className="font-semibold mb-2">ขนาด</h4>
                                <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className="w-full border rounded-md px-3 py-2">
                                    <option value="">เลือกขนาด</option>
                                    {availableSizes.map((size) => <option key={size} value={size}>{size}</option>)}
                                </select>
                            </div>
                        )}
                        
                        {/* Stock & Add to Cart */}
                        {selectedVariant && (
              <p className="mb-4 font-medium">
                จำนวนคงเหลือ: {selectedVariant.stock > 0 ? selectedVariant.stock : 'สินค้าหมด'}
              </p>
            )}
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