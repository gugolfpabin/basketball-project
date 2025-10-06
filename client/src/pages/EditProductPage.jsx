import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Container, Paper, Typography, TextField, Button, Box, CircularProgress, Alert,
} from "@mui/material";
import { styled } from '@mui/material/styles';

const FormContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4), marginTop: theme.spacing(4), marginBottom: theme.spacing(4),
}));

export default function EditProductPage() {
  const { id: productId, variantId } = useParams();
  const navigate = useNavigate();
  const isNewVariant = variantId === 'new';
  const apiBase = 'http://localhost:5000/api';

  const [product, setProduct] = useState(null);
  const [variant, setVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [frontImageFile, setFrontImageFile] = useState(null);
  const [backImageFile, setBackImageFile] = useState(null);
  const [frontImagePreview, setFrontImagePreview] = useState(null);
  const [backImagePreview, setBackImagePreview] = useState(null);

  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${apiBase}/products/${productId}`);
        setProduct(res.data);
        if (isNewVariant) {
          setVariant({ size: '', color: '', stock: 0, price: 0, cost: 0, images: [] });
        } else {
          const currentVariant = res.data.variants.find(v => v.variantId.toString() === variantId);
          if (currentVariant) {
            setVariant(currentVariant);
            setFrontImagePreview(currentVariant.images?.find(img => img.ImageType === 'front')?.PictureURL || null);
            setBackImagePreview(currentVariant.images?.find(img => img.ImageType === 'back')?.PictureURL || null);
          }
        }
      } catch (err) {
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
  }, [productId, variantId, isNewVariant]);

  const handleVariantChange = (e) => {
    const { name, value } = e.target;
    setVariant(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (type === 'front') {
      setFrontImageFile(file);
      setFrontImagePreview(URL.createObjectURL(file));
    } else {
      setBackImageFile(file);
      setBackImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!variant || !product) return;
    setSubmitting(true);
    setError(null);

    const uploadImage = async (file) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await axios.post(`${apiBase}/upload-images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) return res.data.PictureURL;
      throw new Error(res.data.message || 'Image upload failed');
    };

    try {
      // [แก้ไข] สร้าง Array รูปภาพโดยยึดจากของเดิม เพื่อ "รักษารูปที่ไม่ถูกเปลี่ยน"
      let finalImages = [...(variant.images || [])];

      // ถ้ามี "ไฟล์รูปด้านหน้าใหม่" ให้อัปโหลดและอัปเดต URL
      if (frontImageFile) {
        const frontUrl = await uploadImage(frontImageFile);
        finalImages = [...finalImages.filter(img => img.ImageType !== 'front'), { PictureURL: frontUrl, ImageType: 'front' }];
      }

      // ถ้ามี "ไฟล์รูปด้านหลังใหม่" ให้อัปโหลดและอัปเดต URL
      if (backImageFile) {
        const backUrl = await uploadImage(backImageFile);
        finalImages = [...finalImages.filter(img => img.ImageType !== 'back'), { PictureURL: backUrl, ImageType: 'back' }];
      }

      // [สำคัญ] คัดกรองเอารูปภาพที่มี PictureURL จริงๆ เท่านั้น ก่อนส่งไป Backend
      const updatedVariant = { ...variant, images: finalImages.filter(img => img.PictureURL) };

      const finalVariants = isNewVariant
        ? [...product.variants, updatedVariant]
        : product.variants.map(v => v.variantId.toString() === variantId ? updatedVariant : v);
      
      const payload = {
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        variants: finalVariants,
      };

      await axios.put(`${apiBase}/products/${productId}`, payload);
      setSuccess(true);
      setTimeout(() => navigate(`/admin/products/manage/${productId}`), 1500);

    } catch (err) {
      setError('เกิดข้อผิดพลาดในการบันทึก: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button component={Link} to={`/admin/products/manage/${productId}`} sx={{ mt: 2 }}>
          กลับไปหน้าจัดการ
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <FormContainer component="form" onSubmit={handleSubmit}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          {isNewVariant ? `เพิ่ม Variant สำหรับ ${product?.name || ''}` : `แก้ไข Variant`}
        </Typography>
        
        {success && <Alert severity="success" sx={{ mb: 2 }}>บันทึกข้อมูลสำเร็จ!</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <TextField
            label="สี (Color)"
            name="color"
            value={variant?.color || ""}
            onChange={handleVariantChange}
            fullWidth
            required
          />
          <TextField
            label="ขนาด (Size)"
            name="size"
            value={variant?.size || ""}
            onChange={handleVariantChange}
            fullWidth
            required
          />
          <TextField
            label="ราคา (Price)"
            name="price"
            type="number"
            value={variant?.price ?? 0} // ใช้ ?? 0 เพื่อรองรับค่า null/undefined
            onChange={handleVariantChange}
            fullWidth
            required
            InputProps={{ inputProps: { min: 0 } }}
          />
          <TextField
            label="สต็อก (Stock)"
            name="stock"
            type="number"
            value={variant?.stock ?? 0}
            onChange={handleVariantChange}
            fullWidth
            required
            InputProps={{ inputProps: { min: 0 } }}
          />

          {/* ส่วนจัดการรูปภาพ */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>รูปภาพด้านหน้า</Typography>
            {frontImagePreview && (
              <img src={frontImagePreview} alt="Front preview" style={{ width: 128, height: 128, objectFit: 'cover', marginBottom: 8, borderRadius: '4px' }} />
            )}
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'front')} />
          </Box>
          <Box>
            <Typography variant="subtitle1" gutterBottom>รูปภาพด้านหลัง</Typography>
            {backImagePreview && (
              <img src={backImagePreview} alt="Back preview" style={{ width: 128, height: 128, objectFit: 'cover', marginBottom: 8, borderRadius: '4px' }} />
            )}
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'back')} />
          </Box>
        </Box>

        {/* ปุ่มควบคุม */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <Button
            component={Link}
            to={`/admin/products/manage/${productId}`}
            variant="outlined"
            color="secondary"
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            variant="contained"
            color="primary"
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </Button>
        </Box>
      </FormContainer>
    </Container>
  );
}