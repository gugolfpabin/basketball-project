import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
    CircularProgress,
    Grid,
    Paper,
    Container,
    IconButton
} from "@mui/material";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

export default function ProfilePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        Title: '',
        FirstName: '',
        LastName: '',
        Phone: '',
        Address: '',
        Province_ID: '',
        District_ID: '',
        Subdistrict_ID: '',
        PostalCode: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // --- START: เพิ่ม State สำหรับตรวจสอบฟอร์ม ---
    const [isFormValid, setIsFormValid] = useState(false);
    // --- END: เพิ่ม State ---

    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [subdistricts, setSubdistricts] = useState([]);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    const apiBase = "http://localhost:5000/api";
    const token = localStorage.getItem('token');

    const showSnackbar = (message, severity) => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setOpenSnackbar(false);
    };
    
    // ... (useEffect for fetching initial data remains the same) ...
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const [profileRes, provincesRes] = await Promise.all([
                    axios.get(`${apiBase}/profile`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${apiBase}/provinces`)
                ]);

                const userData = profileRes.data;
                setUser(userData);
                setProvinces(provincesRes.data);

                setFormData({
                    Title: userData.Title || '',
                    FirstName: userData.FirstName || '',
                    LastName: userData.LastName || '',
                    Phone: userData.Phone || '',
                    Address: userData.Address || '',
                    Province_ID: userData.Province_ID || '',
                    District_ID: userData.District_ID || '',
                    Subdistrict_ID: userData.Subdistrict_ID || '',
                    PostalCode: userData.PostalCode || ''
                });

            } catch (error) {
                console.error("Failed to fetch initial data:", error);
                showSnackbar("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้", "error");
                localStorage.removeItem('token');
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [navigate, token]);

    // ... (useEffect for address dropdowns remains the same) ...
    useEffect(() => {
        if (formData.Province_ID) {
            axios.get(`${apiBase}/districts?provinceId=${formData.Province_ID}`)
                .then(res => setDistricts(res.data))
                .catch(err => console.error("Error fetching districts:", err));
        } else {
            setDistricts([]);
            setFormData(prev => ({ ...prev, District_ID: "", Subdistrict_ID: "", PostalCode: "" }));
        }
    }, [formData.Province_ID]);

    useEffect(() => {
        if (formData.District_ID) {
            axios.get(`${apiBase}/subdistricts?districtId=${formData.District_ID}`)
                .then(res => setSubdistricts(res.data))
                .catch(err => console.error("Error fetching subdistricts:", err));
        } else {
            setSubdistricts([]);
            setFormData(prev => ({ ...prev, Subdistrict_ID: "", PostalCode: "" }));
        }
    }, [formData.District_ID]);

    useEffect(() => {
        if (formData.Subdistrict_ID) {
            axios.get(`${apiBase}/zipcode?subdistrictId=${formData.Subdistrict_ID}`)
                .then(res => setFormData(prev => ({ ...prev, PostalCode: res.data?.PostalCode || "" })))
                .catch(err => console.error("Error fetching postal code:", err));
        }
    }, [formData.Subdistrict_ID]);

    // --- START: เพิ่ม useEffect สำหรับตรวจสอบความสมบูรณ์ของฟอร์ม ---
    useEffect(() => {
        // ไม่นับรหัสไปรษณีย์ เพราะจะถูกเติมอัตโนมัติ
        const { PostalCode, ...requiredFields } = formData;
        const allFieldsFilled = Object.values(requiredFields).every(value => value !== '' && value !== null);
        setIsFormValid(allFieldsFilled);
    }, [formData]);
    // --- END: เพิ่ม useEffect ---

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = e => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleProfileUpdate = async e => {
        e.preventDefault();
        // การตรวจสอบนี้เป็นการป้องกันอีกชั้นหนึ่ง แม้ว่าปุ่มจะถูกปิดใช้งานไปแล้ว
        if (!isFormValid) {
            showSnackbar('กรุณากรอกข้อมูลให้ครบทุกช่อง', 'warning');
            return;
        }

        setIsSubmittingProfile(true);
        try {
            await axios.put(`${apiBase}/profile`, formData, { headers: { Authorization: `Bearer ${token}` } });
            showSnackbar('อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว', 'success');
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล', 'error');
        } finally {
            setIsSubmittingProfile(false);
        }
    };

    const handleChangePassword = async e => {
        e.preventDefault();
        // ... (password change logic remains the same) ...
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showSnackbar('รหัสผ่านใหม่และการยืนยันไม่ตรงกัน', 'error');
            return;
        }
        setIsSubmittingPassword(true);
        try {
            const response = await axios.put(`${apiBase}/change-password`, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            }, { headers: { Authorization: `Bearer ${token}` } });
            showSnackbar(response.data.message, 'success');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setIsEditingPassword(false);
        } catch (error) {
            showSnackbar(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน', 'error');
        } finally {
            setIsSubmittingPassword(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 5 }}>
            <Paper elevation={4} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <IconButton onClick={() => navigate(-1)} sx={{ mr: 1, alignSelf: 'flex-start' }}>
                        <ArrowBackIosNewIcon />
                    </IconButton>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', width: '100%', textAlign: 'center' }}>
                        ข้อมูลส่วนตัว
                    </Typography>
                </Box>

                <Box component="form" onSubmit={handleProfileUpdate}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>คำนำหน้า</InputLabel>
                                <Select name="Title" value={formData.Title} label="คำนำหน้า" onChange={handleChange}>
                                    <MenuItem value="นาย">นาย</MenuItem>
                                    <MenuItem value="นางสาว">นางสาว</MenuItem>
                                    <MenuItem value="นาง">นาง</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth required label="เบอร์โทรศัพท์" name="Phone" value={formData.Phone} onChange={handleChange} />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth required label="ชื่อ" name="FirstName" value={formData.FirstName} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth required label="นามสกุล" name="LastName" value={formData.LastName} onChange={handleChange} />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField fullWidth label="อีเมล" value={user?.Email || ''} disabled sx={{ bgcolor: 'grey.100' }} />
                        </Grid>

                        <Grid item xs={12}>
                             {!isEditingPassword ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <TextField fullWidth label="รหัสผ่าน" value="**********" disabled sx={{ bgcolor: 'grey.100' }} />
                                    <Button variant="outlined" onClick={() => setIsEditingPassword(true)} sx={{ whiteSpace: 'nowrap' }}>แก้ไขรหัสผ่าน</Button>
                                </Box>
                            ) : (
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>เปลี่ยนรหัสผ่าน</Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}><TextField fullWidth required type="password" label="รหัสผ่านปัจจุบัน" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange}/></Grid>
                                        <Grid item xs={12}><TextField fullWidth required type="password" label="รหัสผ่านใหม่" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange}/></Grid>
                                        <Grid item xs={12}><TextField fullWidth required type="password" label="ยืนยันรหัสผ่านใหม่" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange}/></Grid>
                                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                                            <Button onClick={() => setIsEditingPassword(false)}>ยกเลิก</Button>
                                            <Button variant="contained" color="secondary" onClick={handleChangePassword} disabled={isSubmittingPassword}>
                                                {isSubmittingPassword ? <CircularProgress size={24} color="inherit" /> : 'บันทึกรหัสผ่าน'}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            )}
                        </Grid>
                        

                        <Grid item xs={12}>
                            <TextField fullWidth required label="บ้านเลขที่ / ที่อยู่" name="Address" value={formData.Address} onChange={handleChange} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>จังหวัด</InputLabel>
                                <Select name="Province_ID" value={formData.Province_ID} label="จังหวัด" onChange={handleChange}>
                                    {provinces.map(p => <MenuItem key={p.Province_ID} value={p.Province_ID}>{p.ProvinceName}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required disabled={!formData.Province_ID}>
                                <InputLabel>อำเภอ</InputLabel>
                                <Select name="District_ID" value={formData.District_ID} label="อำเภอ" onChange={handleChange}>
                                    {districts.map(d => <MenuItem key={d.District_ID} value={d.District_ID}>{d.DistrictName}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required disabled={!formData.District_ID}>
                                <InputLabel>ตำบล</InputLabel>
                                <Select name="Subdistrict_ID" value={formData.Subdistrict_ID} label="ตำบล" onChange={handleChange}>
                                    {subdistricts.map(s => <MenuItem key={s.Subdistrict_ID} value={s.Subdistrict_ID}>{s.SubdistrictName}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="รหัสไปรษณีย์" name="PostalCode" value={formData.PostalCode} InputProps={{ readOnly: true }} sx={{ bgcolor: 'grey.100' }} />
                        </Grid>

                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button type="submit" variant="contained" size="large" disabled={!isFormValid || isSubmittingProfile}>
                                {isSubmittingProfile ? <CircularProgress size={24} color="inherit" /> : 'บันทึกข้อมูลส่วนตัว'}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>

            <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>{snackbarMessage}</Alert>
            </Snackbar>
        </Container>
    );
}