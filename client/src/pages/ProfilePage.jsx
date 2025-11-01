import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  Snackbar,
  InputAdornment,
  Paper,
  Divider,
  CircularProgress,
  Grid,
} from "@mui/material";
import IconButton from '@mui/material/IconButton'; 
import { useNavigate } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Navbar from "../components/Navbar"; 

export default function ProfilePage() {
    const navigate = useNavigate();
    const [displayData, setDisplayData] = useState(null);
    const [form, setForm] = useState(null);

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "", newPassword: "", confirmPassword: ""
    });

    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [subdistricts, setSubdistricts] = useState([]);
    
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false); 
    const [loading, setLoading] = useState(true);
    const [submittingProfile, setSubmittingProfile] = useState(false);
    const [submittingPassword, setSubmittingPassword] = useState(false);

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [showPassword, setShowPassword] = useState(false);
    const apiBase = "http://localhost:5000/api";

    const fetchFullUserData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const [profileRes, provincesRes] = await Promise.all([
                axios.get(`${apiBase}/profile`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${apiBase}/provinces`)
            ]);
            
            const userData = profileRes.data;
            const allProvinces = provincesRes.data;
            setProvinces(allProvinces);

            if (userData && userData.Province_ID) {
                const [districtsRes, subdistrictsRes] = await Promise.all([
                    axios.get(`${apiBase}/districts?provinceId=${userData.Province_ID}`),
                    axios.get(`${apiBase}/subdistricts?districtId=${userData.District_ID}`)
                ]);
                const provinceName = allProvinces.find(p => p.Province_ID === userData.Province_ID)?.ProvinceName || "";
                const districtName = districtsRes.data.find(d => d.District_ID === userData.District_ID)?.DistrictName || "";
                const subdistrictName = subdistrictsRes.data.find(s => s.Subdistrict_ID === userData.Subdistrict_ID)?.SubdistrictName || "";
                
                setDisplayData({
                    ...userData,
                    provinceName, districtName, subdistrictName
                });
            } else {
                setDisplayData(userData);
            }
        } catch (err) {
            console.error("Failed to fetch data:", err);
            showSnackbar("ไม่สามารถโหลดข้อมูลผู้ใช้ได้", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFullUserData();
    }, [navigate]);

    useEffect(() => {
        if (form?.provinceId) {
            axios.get(`${apiBase}/districts?provinceId=${form.provinceId}`)
                .then(res => setDistricts(res.data))
                .catch(() => showSnackbar("ไม่สามารถโหลดข้อมูลอำเภอได้", "error"));
        }
    }, [form?.provinceId]);

    useEffect(() => {
        if (form?.districtId) {
            axios.get(`${apiBase}/subdistricts?districtId=${form.districtId}`)
                .then(res => setSubdistricts(res.data))
                .catch(() => showSnackbar("ไม่สามารถโหลดข้อมูลตำบลได้", "error"));
        }
    }, [form?.districtId]);
    
    useEffect(() => {
        if (form?.subdistrictId) {
            axios.get(`${apiBase}/zipcode?subdistrictId=${form.subdistrictId}`)
                .then(res => setForm(prev => ({ ...prev, postalCode: res.data?.PostalCode || "" })))
                .catch(() => {});
        }
    }, [form?.subdistrictId]);

    const handleEditClick = () => {
        setForm({
            title: displayData?.Title || "",
            firstName: displayData?.FirstName || "",
            lastName: displayData?.LastName || "",
            phone: displayData?.Phone || "",
            email: displayData?.Email || "",
            address: displayData?.Address || "",
            provinceId: displayData?.Province_ID || "",
            districtId: displayData?.District_ID || "",
            subdistrictId: displayData?.Subdistrict_ID || "",
            postalCode: displayData?.PostalCode || ""
        });
        setIsEditing(true);
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        setIsChangingPassword(false);
        setForm(null);
    };

    const handleChange = e => {
        const { name, value } = e.target;
        if (name === 'phone') {
            const numericValue = value.replace(/[^0-9]/g, '');
            if (numericValue.length <= 10) {
                setForm(prev => ({ ...prev, [name]: numericValue }));
            }
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePasswordChange = e => {
        setPasswordForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleProfileSubmit = async e => {
        e.preventDefault();
        if (form.phone.length !== 10) {
            showSnackbar("กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก", "error");
            return;
        }

        setSubmittingProfile(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                Title: form.title, FirstName: form.firstName, LastName: form.lastName,
                Phone: form.phone, Address: form.address, Province_ID: form.provinceId,
                District_ID: form.districtId, Subdistrict_ID: form.subdistrictId, PostalCode: form.postalCode
            };
            await axios.put(`${apiBase}/profile`, payload, { headers: { Authorization: `Bearer ${token}` } });
            showSnackbar("อัปเดตข้อมูลส่วนตัวสำเร็จ", "success");
            await fetchFullUserData();
            setIsEditing(false);
            setIsChangingPassword(false);
        } catch (err) {
            showSnackbar("เกิดข้อผิดพลาดในการอัปเดตข้อมูล", "error");
        } finally {
            setSubmittingProfile(false);
        }
    };

    const handlePasswordSubmit = async e => {
        e.preventDefault();
        const { currentPassword, newPassword, confirmPassword } = passwordForm;
        if (!currentPassword || !newPassword || !confirmPassword) {
            showSnackbar("กรุณากรอกข้อมูลรหัสผ่านให้ครบถ้วน", "error");
            return;
        }
        if (newPassword !== confirmPassword) {
            showSnackbar("รหัสผ่านใหม่ไม่ตรงกัน", "error");
            return;
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])[A-Za-z0-9]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            showSnackbar("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัว, และประกอบด้วยตัวพิมพ์เล็กและพิมพ์ใหญ่", "error");
            return;
        }

        setSubmittingPassword(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${apiBase}/profile/change-password`, { currentPassword, newPassword }, { headers: { Authorization: `Bearer ${token}` } });
            showSnackbar("เปลี่ยนรหัสผ่านสำเร็จ", "success");
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setIsChangingPassword(false);
        } catch (err) {
            showSnackbar(err.response?.data?.message || "เกิดข้อผิดพลาด", "error");
        } finally {
            setSubmittingPassword(false);
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbarMessage(message); setSnackbarSeverity(severity); setOpenSnackbar(true);
    };
    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setOpenSnackbar(false);
    };
    const handleClickShowPassword = () => setShowPassword((prev) => !prev);
    const handleMouseDownPassword = (event) => event.preventDefault();

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }
    
    return (
        <>
            <Navbar />
            <Box sx={{ bgcolor: '#f5f5f5', minHeight: 'calc(100vh - 64px)', p: 4, display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ maxWidth: '800px', width: '100%' }}>
                    <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>ข้อมูลส่วนตัว</Typography>
                    
                    {!isEditing ? (
                        // --- VIEW MODE ---
                        <Paper sx={{ p: 4, mb: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6">ข้อมูลส่วนตัวและที่อยู่สำหรับจัดส่ง</Typography>
                                <Button variant="outlined" onClick={handleEditClick}>แก้ไขข้อมูล</Button>
                            </Box>
                            {displayData ? (
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}><Typography color="text.secondary">ชื่อ-นามสกุล:</Typography><Typography>{`${displayData.Title} ${displayData.FirstName} ${displayData.LastName}`}</Typography></Grid>
                                    <Grid item xs={12} sm={6}><Typography color="text.secondary">เบอร์โทรศัพท์:</Typography><Typography>{displayData.Phone}</Typography></Grid>
                                    <Grid item xs={12} sm={6}><Typography color="text.secondary">อีเมล:</Typography><Typography>{displayData.Email}</Typography></Grid>
                                    <Grid item xs={12}><Typography color="text.secondary">ที่อยู่:</Typography><Typography>{`${displayData.Address}, ต.${displayData.subdistrictName}, อ.${displayData.districtName}, จ.${displayData.provinceName}, ${displayData.PostalCode}`}</Typography></Grid>
                                </Grid>
                            ) : <Typography>ไม่พบข้อมูล</Typography>}
                        </Paper>
                    ) : (
                        // --- EDIT MODE ---
                        <>
                            <Paper component="form" onSubmit={handleProfileSubmit} sx={{ p: 4, mb: 4 }}>
                                <Typography variant="h6" sx={{ mb: 3 }}>แก้ไขข้อมูลส่วนตัว</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                        <FormControl fullWidth required><InputLabel>คำนำหน้า</InputLabel><Select name="title" value={form.title} label="คำนำหน้า" onChange={handleChange}><MenuItem value="นาย">นาย</MenuItem><MenuItem value="นางสาว">นางสาว</MenuItem><MenuItem value="นาง">นาง</MenuItem></Select></FormControl>
                                        <TextField label="เบอร์โทรศัพท์" name="phone" type="tel" value={form.phone} onChange={handleChange} required inputProps={{ maxLength: 10 }} />
                                    </Box>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                        <TextField label="ชื่อ" name="firstName" value={form.firstName} onChange={handleChange} required />
                                        <TextField label="นามสกุล" name="lastName" value={form.lastName} onChange={handleChange} required />
                                    </Box>
                                    <TextField label="อีเมล" name="email" type="email" value={form.email} required InputProps={{ readOnly: true }} sx={{ bgcolor: '#eeeeee' }} />
                                    <TextField label="ที่อยู่เลขที่่" name="address" value={form.address} onChange={handleChange} required multiline rows={2} />
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                        <FormControl fullWidth required><InputLabel>จังหวัด</InputLabel><Select name="provinceId" value={form.provinceId} label="จังหวัด" onChange={handleChange}>{provinces.map(p => <MenuItem key={p.Province_ID} value={p.Province_ID}>{p.ProvinceName}</MenuItem>)}</Select></FormControl>
                                        <FormControl fullWidth required><InputLabel>อำเภอ/เขต</InputLabel><Select name="districtId" value={form.districtId} label="อำเภอ/เขต" onChange={handleChange} disabled={!form.provinceId}>{districts.map(d => <MenuItem key={d.District_ID} value={d.District_ID}>{d.DistrictName}</MenuItem>)}</Select></FormControl>
                                    </Box>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                        <FormControl fullWidth required><InputLabel>ตำบล/แขวง</InputLabel><Select name="subdistrictId" value={form.subdistrictId} label="ตำบล/แขวง" onChange={handleChange} disabled={!form.districtId}>{subdistricts.map(s => <MenuItem key={s.Subdistrict_ID} value={s.Subdistrict_ID}>{s.SubdistrictName}</MenuItem>)}</Select></FormControl>
                                        <TextField label="รหัสไปรษณีย์" name="postalCode" value={form.postalCode} InputProps={{ readOnly: true }} sx={{ bgcolor: '#eeeeee' }} />
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                                        <Button variant="text" onClick={handleCancelClick}>ยกเลิก</Button>
                                        <Button type="submit" variant="contained" disabled={submittingProfile}>{submittingProfile ? <CircularProgress size={24} /> : 'บันทึกข้อมูล'}</Button>
                                    </Box>
                                </Box>
                            </Paper>

                            {!isChangingPassword ? (
                                <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography>รหัสผ่าน</Typography>
                                    <Button variant="outlined" color="secondary" onClick={() => setIsChangingPassword(true)}>
                                        เปลี่ยนรหัสผ่าน
                                    </Button>
                                </Paper>
                            ) : (
                                <Paper component="form" onSubmit={handlePasswordSubmit} sx={{ p: 4 }}>
                                    <Typography variant="h6" sx={{ mb: 3 }}>เปลี่ยนรหัสผ่าน</Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <TextField label="รหัสผ่านปัจจุบัน" name="currentPassword" type={showPassword ? 'text' : 'password'} value={passwordForm.currentPassword} onChange={handlePasswordChange} required InputProps={{ endAdornment: ( <InputAdornment position="end"><IconButton onClick={handleClickShowPassword} onMouseDown={handleMouseDownPassword}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> )}} />
                                        <TextField label="รหัสผ่านใหม่" name="newPassword" type={showPassword ? 'text' : 'password'} value={passwordForm.newPassword} onChange={handlePasswordChange} required helperText="อย่างน้อย 8 ตัว, ต้องมีตัวพิมพ์เล็กและพิมพ์ใหญ่" InputProps={{ endAdornment: ( <InputAdornment position="end"><IconButton onClick={handleClickShowPassword} onMouseDown={handleMouseDownPassword}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> )}} />
                                        <TextField label="ยืนยันรหัสผ่านใหม่" name="confirmPassword" type={showPassword ? 'text' : 'password'} value={passwordForm.confirmPassword} onChange={handlePasswordChange} required InputProps={{ endAdornment: ( <InputAdornment position="end"><IconButton onClick={handleClickShowPassword} onMouseDown={handleMouseDownPassword}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> )}} />
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                                            <Button variant="text" onClick={() => setIsChangingPassword(false)}>ยกเลิก</Button>
                                            <Button type="submit" variant="contained" color="secondary" disabled={submittingPassword}>
                                                {submittingPassword ? <CircularProgress size={24} /> : 'บันทึกรหัสผ่านใหม่'}
                                            </Button>
                                        </Box>
                                    </Box>
                                </Paper>
                            )}
                        </>
                    )}
                </Box>
            </Box>

            <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>{snackbarMessage}</Alert>
            </Snackbar>
        </>
    );
}

