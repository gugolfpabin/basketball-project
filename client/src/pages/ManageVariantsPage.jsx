import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, CircularProgress, Snackbar, Alert, Container,
  TextField,MenuItem,
} from '@mui/material';


import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon, 
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon
} from '@mui/icons-material';

const categories = [
    { id: 1, name: 'เสื้อบาสเกตบอล' },
    { id: 2, name: 'เสื้อ T-Shirt' },
    { id: 3, name: 'กางเกงบาสเกตบอล' },
    { id: 4, name: 'รองเท้าบาสเกตบอล' },
    { id: 5, name: 'ถุงเท้า' },
];

export default function ManageVariantsPage() {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [openEditProductDialog, setOpenEditProductDialog] = useState(false);
  const [productToEdit, setProductToEdit] = useState({ name: '', description: '', categoryId: '' });


  const apiBase = 'http://localhost:5000/api';

  const fetchProductDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiBase}/products/${productId}`);
      setProduct(response.data);
      if (response.data) {
        setProductToEdit({
          name: response.data.name,
          description: response.data.description,
          categoryId: response.data.categoryId,
        });
      }
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลสินค้าได้');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);
  
  const handleEdit = (variantId) => navigate(`/admin/products/edit/${productId}/variant/${variantId}`);
  const handleAddVariant = () => navigate(`/admin/products/edit/${productId}/variant/new`);
  const handleDeleteClick = (variant) => {
    setItemToDelete(variant);
    setOpenDeleteDialog(true);
  };
  const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;
        try {
            await axios.delete(`${apiBase}/products/variants/${itemToDelete.variantId}`);
            setSnackbar({ open: true, message: 'ลบ Variant สำเร็จ!', severity: 'success' });
            fetchProductDetails();
        } catch (err) {
            setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการลบ', severity: 'error' });
        } finally {
            setOpenDeleteDialog(false);
            setItemToDelete(null);
        }
    };

  const handleOpenEditProductDialog = () => setOpenEditProductDialog(true);
  const handleCloseEditProductDialog = () => setOpenEditProductDialog(false);

  const handleProductEditChange = (e) => {
    const { name, value } = e.target;
    setProductToEdit(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProductInfo = async () => {
    try {
      const payload = {
        name: productToEdit.name,
        description: productToEdit.description,
        categoryId: productToEdit.categoryId,
      };
      
      await axios.put(`${apiBase}/products/${productId}`, payload);
      setSnackbar({ open: true, message: 'อัปเดตข้อมูลสินค้าสำเร็จ!', severity: 'success' });
      fetchProductDetails();
      handleCloseEditProductDialog();
    } catch (err) {
      setSnackbar({ open: true, message: 'เกิดข้อผิดพลาดในการอัปเดต', severity: 'error' });
    }
  };


  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button startIcon={<ArrowBackIcon />} component={Link} to="/dashboard" sx={{ mb: 2 }}>
        กลับหน้าหลัก
      </Button>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            จัดการสินค้า: {product?.name}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={handleOpenEditProductDialog}>
            แก้ไขข้อมูลสินค้า
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddVariant}>
            เพิ่ม รายละเอียดสินค้า
          </Button>
        </Box>
      </Box>

      {/* ตารางแสดง Variant (เหมือนเดิม) */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
             <TableRow>
              <TableCell>รูปภาพ</TableCell>
              <TableCell>สี</TableCell>
              <TableCell>ขนาด</TableCell>
              <TableCell>ราคา (บาท)</TableCell>
              <TableCell>สต็อก</TableCell>
              <TableCell align="center">การดำเนินการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {product?.variants.map((variant) => (
              <TableRow key={variant.variantId}>
                <TableCell>
                  <Avatar 
                    src={variant.images?.find(img => img.ImageType === 'front')?.PictureURL || 'https://placehold.co/70x70'} 
                    variant="rounded" sx={{ width: 70, height: 70 }} 
                  />
                </TableCell>
                <TableCell>{variant.color}</TableCell>
                <TableCell>{variant.size}</TableCell>
                <TableCell>
                  {Number(variant.price).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell>{variant.stock}</TableCell>
                <TableCell align="center">
                  <Button onClick={() => handleEdit(variant.variantId)} startIcon={<EditIcon/>} sx={{mr: 1}}>แก้ไข</Button>
                  <Button onClick={() => handleDeleteClick(variant)} startIcon={<DeleteIcon/>} color="error">ลบ</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog & Snackbar สำหรับลบ (เหมือนเดิม) */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
         <DialogTitle>ยืนยันการลบ รายละเอียดสินค้านี้?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ต้องการลบ "{product.name}" (สี: {itemToDelete?.color}, ขนาด: {itemToDelete?.size}) ใช่หรือไม่?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>ยกเลิก</Button>
          <Button onClick={handleDeleteConfirm} color="error">ลบ</Button>
         </DialogActions>
      </Dialog>

       <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      
      {/* Dialog สำหรับแก้ไขข้อมูลสินค้า */}
      <Dialog open={openEditProductDialog} onClose={handleCloseEditProductDialog} fullWidth maxWidth="sm">
        <DialogTitle>แก้ไขข้อมูลสินค้า</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="ชื่อสินค้า"
            type="text"
            fullWidth
            variant="outlined"
            value={productToEdit.name}
            onChange={handleProductEditChange}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="คำอธิบายสินค้า"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={productToEdit.description}
            onChange={handleProductEditChange}
            sx={{ mb: 2 }}
          />
           <TextField
            select 
            margin="dense"
            name="categoryId"
            label="ประเภทสินค้า"
            fullWidth
            variant="outlined"
            value={productToEdit.categoryId}
            onChange={handleProductEditChange}
          >
            {/* วนลูปเพื่อสร้างตัวเลือก Dropdown */}
            {categories.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditProductDialog}>ยกเลิก</Button>
          <Button onClick={handleUpdateProductInfo} variant="contained" startIcon={<SaveIcon/>}>บันทึก</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}