import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, X } from 'lucide-react';

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
        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            if (!newTimeLeft) {
                onExpire();
                clearInterval(timer);
            }
            setTimeLeft(newTimeLeft);
        }, 1000);

        return () => clearInterval(timer);
    }, [expiryTime, onExpire]);

    return (
        <div className="text-red-500 font-bold text-2xl">
            {timeLeft ? (
                <span>
                    เวลาในการชำระเงิน: {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
            ) : (
                <span>หมดเวลาชำระเงินแล้ว</span>
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

    const [address, setAddress] = useState(null);
    const [loadingAddress, setLoadingAddress] = useState(true);

    const [showEdit, setShowEdit] = useState(false);
    const [editData, setEditData] = useState({
        Title: '', FirstName: '', LastName: '', Phone: '', Address: '',
        Province_ID: '', District_ID: '', Subdistrict_ID: '', PostalCode: '',
    });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');
    const [editSuccess, setEditSuccess] = useState('');

    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [subdistricts, setSubdistricts] = useState([]);

    const apiBase = 'http://localhost:5000/api';

    const fetchFullAddress = async () => {
        setLoadingAddress(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) { setLoadingAddress(false); return; }

            const profileRes = await axios.get(`${apiBase}/profile`, { headers: { Authorization: `Bearer ${token}` } });
            const userData = profileRes.data;

            if (userData && userData.Province_ID) {
                const [districtsRes, subdistrictsRes] = await Promise.all([
                    axios.get(`${apiBase}/districts?provinceId=${userData.Province_ID}`),
                    axios.get(`${apiBase}/subdistricts?districtId=${userData.District_ID}`)
                ]);

                const provinceName = provinces.find(p => p.Province_ID.toString() === userData.Province_ID.toString())?.ProvinceName || '';
                const districtName = districtsRes.data.find(d => d.District_ID.toString() === userData.District_ID.toString())?.DistrictName || '';
                const subdistrictName = subdistrictsRes.data.find(s => s.Subdistrict_ID.toString() === userData.Subdistrict_ID.toString())?.SubdistrictName || '';
                
                setAddress({ ...userData, ProvinceName: provinceName, DistrictName: districtName, SubdistrictName: subdistrictName });
            } else {
                setAddress(userData); 
            }
        } catch (err) {
            console.error('Failed to fetch full address:', err);
            setAddress(null);
        } finally {
            setLoadingAddress(false);
        }
    };
    

    useEffect(() => {
        axios.get(`${apiBase}/provinces`).then(r => setProvinces(r.data)).catch(() => {});
    }, []);


    useEffect(() => {
        if (provinces.length > 0) {
            fetchFullAddress();
        }
    }, [provinces]);

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

            const response = await axios.post(
                `${apiBase}/orders/upload-slip/${orderId}`, formData,
                { headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` } }
            );
            setUploadMessage(response.data.message);
            setTimeout(() => { navigate('/cart'); }, 2000);
        } catch (err) {
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
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            alert('ยกเลิกออเดอร์สำเร็จ');
            navigate('/cart');

        } catch (err) {
            alert(err.response?.data?.message || 'ไม่สามารถยกเลิกออเดอร์ได้');
        }
    };

    useEffect(() => {
        if (!qrCodeImage) { navigate('/cart'); }
    }, [qrCodeImage, navigate]);

    const openEdit = () => {
        setEditError('');
        setEditSuccess('');
        setEditData({
            Title: address?.Title || '', FirstName: address?.FirstName || '', LastName: address?.LastName || '',
            Phone: address?.Phone || '', Address: address?.Address || '', Province_ID: address?.Province_ID || '',
            District_ID: address?.District_ID || '', Subdistrict_ID: address?.Subdistrict_ID || '', PostalCode: address?.PostalCode || ''
        });
        setShowEdit(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        if (name === 'Phone') {
            const numericValue = value.replace(/[^0-9]/g, '');
            if (numericValue.length <= 10) {
                setEditData({ ...editData, [name]: numericValue });
            }
        } else {
            setEditData({ ...editData, [name]: value });
        }
    };
    useEffect(() => {
        if (editData.Province_ID) {
            axios.get(`${apiBase}/districts?provinceId=${editData.Province_ID}`)
                .then(res => setDistricts(res.data)).catch(() => setDistricts([]));
        } else {
            setDistricts([]);
            setEditData(prev => ({ ...prev, District_ID: '', Subdistrict_ID: '', PostalCode: '' }));
        }
    }, [editData.Province_ID]);

    useEffect(() => {
        if (editData.District_ID) {
            axios.get(`${apiBase}/subdistricts?districtId=${editData.District_ID}`)
                .then(res => setSubdistricts(res.data)).catch(() => setSubdistricts([]));
        } else {
            setSubdistricts([]);
            setEditData(prev => ({ ...prev, Subdistrict_ID: '', PostalCode: '' }));
        }
    }, [editData.District_ID]);

    useEffect(() => {
        if (editData.Subdistrict_ID) {
            axios.get(`${apiBase}/zipcode?subdistrictId=${editData.Subdistrict_ID}`)
                .then(res => setEditData(prev => ({ ...prev, PostalCode: res.data?.PostalCode || '' })))
                .catch(() => {});
        }
    }, [editData.Subdistrict_ID]);

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (editData.Phone.length !== 10) {
            setEditError('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
            return; 
        }
        setEditLoading(true);
        setEditError('');
        setEditSuccess('');
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${apiBase}/profile`, editData, { headers: { Authorization: `Bearer ${token}` } });
            setEditSuccess('บันทึกข้อมูลที่อยู่สำเร็จ');
            
            await fetchFullAddress(); 
            
            setShowEdit(false);
        } catch (err) {
            setEditError('เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setEditLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg text-center w-full max-w-md relative">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-1/5 text-left">
                        {!isExpired && (
                            <button onClick={handleCancelOrder} className="text-gray-400 hover:text-gray-600" title="ยกเลิกและกลับไปที่ตะกร้า">
                                <ArrowLeft size={24} />
                            </button>
                        )}
                    </div>
                    <div className="w-3/5"> <h1 className="text-xl sm:text-2xl font-bold"> ชำระเงินผ่าน QR Code </h1> </div>
                    <div className="w-1/5"></div>
                </div>
                <div className="bg-gray-50 border rounded-md p-4 mb-4 text-left">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-700">ที่อยู่สำหรับจัดส่ง</span>
                        <button type="button" className="text-blue-600 hover:underline text-sm" title="แก้ไขที่อยู่" onClick={openEdit}>แก้ไข</button>
                    </div>
                    {loadingAddress ? <span className="text-gray-400 text-sm">กำลังโหลด...</span> : address ? (
                        <div className="text-gray-700 text-sm space-y-1">
                            <div><b>ชื่อ:</b> {address.Title} {address.FirstName} {address.LastName}</div>
                            <div><b>เบอร์โทร:</b> {address.Phone}</div>
                            <div>
                                <b>ที่อยู่:</b> {address.Address}
                                {address.SubdistrictName && ` ต.${address.SubdistrictName}`}
                                {address.DistrictName && ` อ.${address.DistrictName}`}
                                {address.ProvinceName && ` จ.${address.ProvinceName}`}
                            </div>
                            {address.PostalCode && <div><b>รหัสไปรษณีย์:</b> {address.PostalCode}</div>}
                        </div>
                    ) : (
                        <span className="text-red-500 text-sm">ไม่พบข้อมูลที่อยู่</span>
                    )}
                </div>

                {showEdit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
                            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowEdit(false)} title="ปิด"><X size={20} /></button>
                            <h2 className="text-lg font-bold mb-4">แก้ไขข้อมูลส่วนตัว / ที่อยู่</h2>
                            <form onSubmit={handleEditSubmit} className="space-y-3 text-left">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm mb-1">คำนำหน้า</label>
                                        <select name="Title" value={editData.Title} onChange={handleEditChange} className="w-full border rounded px-2 py-1" required>
                                            <option value="">เลือก</option> <option value="นาย">นาย</option> <option value="นางสาว">นางสาว</option> <option value="นาง">นาง</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1">เบอร์โทรศัพท์</label>
                                        <input name="Phone" value={editData.Phone} onChange={handleEditChange} className="w-full border rounded px-2 py-1" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1">ชื่อ</label>
                                        <input name="FirstName" value={editData.FirstName} onChange={handleEditChange} className="w-full border rounded px-2 py-1" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1">นามสกุล</label>
                                        <input name="LastName" value={editData.LastName} onChange={handleEditChange} className="w-full border rounded px-2 py-1" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">บ้านเลขที่ / ที่อยู่</label>
                                    <textarea name="Address" value={editData.Address} onChange={handleEditChange} className="w-full border rounded px-2 py-1" required />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm mb-1">จังหวัด</label>
                                        <select name="Province_ID" value={editData.Province_ID} onChange={handleEditChange} className="w-full border rounded px-2 py-1" required>
                                            <option value="">เลือกจังหวัด</option>
                                            {provinces.map(p => <option key={p.Province_ID} value={p.Province_ID}>{p.ProvinceName}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1">อำเภอ</label>
                                        <select name="District_ID" value={editData.District_ID} onChange={handleEditChange} className="w-full border rounded px-2 py-1" required disabled={!editData.Province_ID}>
                                            <option value="">เลือกอำเภอ</option>
                                            {districts.map(d => <option key={d.District_ID} value={d.District_ID}>{d.DistrictName}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1">ตำบล</label>
                                        <select name="Subdistrict_ID" value={editData.Subdistrict_ID} onChange={handleEditChange} className="w-full border rounded px-2 py-1" required disabled={!editData.District_ID}>
                                            <option value="">เลือกตำบล</option>
                                            {subdistricts.map(s => <option key={s.Subdistrict_ID} value={s.Subdistrict_ID}>{s.SubdistrictName}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1">รหัสไปรษณีย์</label>
                                        <input name="PostalCode" value={editData.PostalCode} readOnly className="w-full border rounded px-2 py-1 bg-gray-100" />
                                    </div>
                                </div>
                                {editError && <div className="text-red-500 text-sm">{editError}</div>}
                                {editSuccess && <div className="text-green-600 text-sm">{editSuccess}</div>}
                                <div className="flex justify-end gap-2">
                                    <button type="button" className="px-4 py-1 rounded bg-gray-200 hover:bg-gray-300" onClick={() => setShowEdit(false)}>ยกเลิก</button>
                                    <button type="submit" className="px-4 py-1 rounded bg-blue-600 text-white hover:bg-blue-700" disabled={editLoading}>{editLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                <p className="text-gray-600 mb-2">หมายเลขออเดอร์ของคุณคือ: <span className="font-bold text-blue-600">{orderId}</span></p>
                {qrCodeImage && !isExpired ? (
                    <>
                        <img src={qrCodeImage} alt="QR Code" className="mx-auto border-4 border-gray-300 rounded-lg" />
                        <p className="text-2xl sm:text-3xl font-bold my-4">ยอดชำระ: {Number(totalAmount).toFixed(2)} บาท</p>
                        <div className="mt-4"><CountdownTimer expiryTime={expiresAt} onExpire={() => setIsExpired(true)} /></div>
                        <p className="mt-4 text-sm text-gray-500">กรุณาสแกน QR Code เพื่อชำระเงิน และ <b>บันทึกสลิป</b> ไว้เป็นหลักฐานสำหรับการแจ้งชำระเงิน</p>
                    </>
                ) : (
                    <div className="my-10">
                        <h2 className="text-2xl font-bold text-red-600">QR Code หมดอายุแล้ว</h2>
                        <p className="text-gray-600 mt-2">กรุณากลับไปที่หน้าตะกร้าสินค้าเพื่อทำรายการใหม่อีกครั้ง</p>
                        <button
                            onClick={() => handleCancelOrder(false)}
                            className="mt-6 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                        >
                            กลับไปหน้าตะกร้า
                        </button>
                    </div>
                )}
                {!isExpired && (
                    <div className="border-t mt-6 pt-6">
                        <h2 className="text-lg font-semibold mb-3">แจ้งชำระเงิน</h2>
                        <p className="text-sm text-gray-500 mb-4">หลังจากชำระเงินแล้ว กรุณาอัปโหลดสลิปเพื่อยืนยัน</p>
                        <input type="file" onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        <button onClick={handleSlipSubmit} disabled={isUploading || !selectedFile} className="w-full mt-4 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400">
                            {isUploading ? 'กำลังอัปโหลด...' : 'ยืนยันการชำระเงิน'}
                        </button>
                        {uploadMessage && <p className="mt-3 text-sm font-semibold">{uploadMessage}</p>}
                    </div>
                )}
            </div>
        </div>
    );
}

