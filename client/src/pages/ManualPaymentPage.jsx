// src/pages/ManualPaymentPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';

function CountdownTimer({ expiryTime, onExpire }) {
    const calculateTimeLeft = () => {
        const difference = +new Date(expiryTime) - +new Date();
        let timeLeft = null;

        if (difference > 0) {
            timeLeft = {
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            const newTimeLeft = calculateTimeLeft();
            if (!newTimeLeft) {
                onExpire();
            }
            setTimeLeft(newTimeLeft);
        }, 1000);

        return () => clearTimeout(timer);
    }); 


    return (
        <div className="text-red-500 font-bold text-2xl">
            {timeLeft ? (
                // ถ้ายังมีเวลาเหลือ ให้แสดงผลแบบนี้
                <span>
                    หมดอายุใน: {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
            ) : (
                // ถ้าเวลาหมดแล้ว
                <span>QR Code หมดอายุแล้ว</span>
            )}
        </div>
    );
}


export default function ManualPaymentPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isExpired, setIsExpired] = useState(false);
    const { qrCodeImage, orderId, totalAmount, expiresAt } = location.state || {};
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadMessage, setUploadMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const apiBase = 'http://localhost:5000/api';

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleSlipSubmit = async () => {
    try {
        setIsUploading(true);
        setUploadMessage('');
        const token = localStorage.getItem('token');

        const formData = new FormData();
        formData.append('slipImage', selectedFile);

        console.log("🚀 กำลังจะส่งข้อมูลไปที่ Server...");
        
        const response = await axios.post(
            `${apiBase}/orders/upload-slip/${orderId}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        
        console.log("🎉 ได้รับการตอบกลับจาก Server:", response.data);
        setUploadMessage(response.data.message);
        alert('อัปโหลดสลิปสำเร็จ!');
        setTimeout(() => {
            navigate('/cart'); 
        }, 1000);

    } catch (err) {
        console.error("🔥 เกิดข้อผิดพลาดร้ายแรงใน 'catch' block:", err);
        const errorMsg = err.response?.data?.message || 'อัปโหลดไม่สำเร็จ';
        setUploadMessage(errorMsg);
    } finally {
        setIsUploading(false);
    }
};

const handleCancelOrder = async () => {
    if (!window.confirm('คุณต้องการยกเลิกรายการสั่งซื้อนี้ และกลับไปหน้าตะกร้าใช่หรือไม่?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        await axios.post(
            `${apiBase}/orders/delete-pending/${orderId}`, 
            {}, 
            {
                headers: { 'Authorization': `Bearer ${token}` }
            }
        );
        alert('ยกเลิกออเดอร์สำเร็จ');
        navigate('/cart');

    } catch (err) {
        const errorMsg = err.response?.data?.message || 'ไม่สามารถยกเลิกออเดอร์ได้';
        alert(errorMsg);
    }
};

    useEffect(() => {
        if (!qrCodeImage) {
            navigate('/cart'); // ถ้าไม่มีข้อมูล QR ให้กลับไปหน้าตะกร้า
        }
    }, [qrCodeImage, navigate]);

    return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        {/* เพิ่ม 'relative' เผื่อไว้ แต่ไม่จำเป็นสำหรับวิธีนี้ */}
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg text-center w-full max-w-md relative">

            {/* --- แถวหัวเรื่องที่แก้ไขใหม่ (วิธี Flexbox 3 ช่อง) --- */}
            <div className="flex items-center justify-between mb-4">
                {/* ช่องซ้าย: สำหรับปุ่มลูกศร */}
                <div className="w-1/5 text-left">
                    {!isExpired && (
                        <button
                            onClick={handleCancelOrder}
                            className="text-gray-400 hover:text-gray-600"
                            title="ยกเลิกและกลับไปที่ตะกร้า"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    )}
                </div>

                {/* ช่องกลาง: สำหรับหัวเรื่อง */}
                <div className="w-3/5">
                    <h1 className="text-xl sm:text-2xl font-bold">
                        ชำระเงินผ่าน QR Code
                    </h1>
                </div>

                {/* ช่องขวา: เว้นว่างไว้เพื่อความสมดุล */}
                <div className="w-1/5"></div>
            </div>
            {/* --- จบส่วนหัวเรื่อง --- */}

            {/* (ลบ h1 และ button เก่าที่คุณใส่ไว้ข้างบนสุดออก) */}
            
            <p className="text-gray-600 mb-2">หมายเลขออเดอร์ของคุณคือ: <span className="font-bold text-blue-600">{orderId}</span></p>

            {qrCodeImage && !isExpired ? (
                <>
                    <img src={qrCodeImage} alt="QR Code" className="mx-auto border-4 border-gray-300 rounded-lg" />
                    <p className="text-2xl sm:text-3xl font-bold my-4">ยอดชำระ: {Number(totalAmount).toFixed(2)} บาท</p>
                    <div className="mt-4">
                        <CountdownTimer expiryTime={expiresAt} onExpire={() => setIsExpired(true)} />
                    </div>
                    <p className="mt-4 text-sm text-gray-500">
                        กรุณาสแกน QR Code เพื่อชำระเงิน และ **บันทึกสลิป** ไว้เป็นหลักฐานสำหรับการแจ้งชำระเงิน
                    </p>
                </>
            ) : (
                <div className="my-10">
                    <h2 className="text-2xl font-bold text-red-600">QR Code หมดอายุแล้ว</h2>
                    <p className="text-gray-600 mt-2">กรุณากลับไปที่หน้าตะกร้าสินค้าเพื่อทำรายการใหม่อีกครั้ง</p>
                    <Link to="/cart" className="mt-6 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                        กลับไปหน้าตะกร้า
                    </Link>
                </div>
            )}
            {!isExpired && (
    <div className="border-t mt-6 pt-6">
        <h2 className="text-lg font-semibold mb-3">แจ้งชำระเงิน</h2>
        <p className="text-sm text-gray-500 mb-4">
            หลังจากชำระเงินแล้ว กรุณาอัปโหลดสลิปเพื่อยืนยัน
        </p>
        
        <input
            type="file"
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/gif"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        <button
            onClick={handleSlipSubmit}
            disabled={isUploading || !selectedFile}
            className="w-full mt-4 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
            {isUploading ? 'กำลังอัปโหลด...' : 'ยืนยันการชำระเงิน'}
        </button>   

        {uploadMessage && (
            <p className="mt-3 text-sm font-semibold">{uploadMessage}</p>
        )}
    </div>
)}
        </div>
    </div>
);
}