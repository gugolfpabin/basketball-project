// // src/pages/EditProductPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { styled } from "@mui/material/styles";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  MenuItem,
} from "@mui/material";

const FormContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

export default function EditProductPage() {
  const { id, variantId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variant, setVariant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [frontImageFile, setFrontImageFile] = useState(null);
  const [backImageFile, setBackImageFile] = useState(null);
  const [frontImagePreview, setFrontImagePreview] = useState(null);
  const [backImagePreview, setBackImagePreview] = useState(null);
  const apiBase = "http://localhost:5000/api";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ดึงข้อมูลสินค้าและหมวดหมู่พร้อมกัน
        const [productRes, categoriesRes] = await Promise.all([
          // แก้ไขให้เรียกใช้ getOneProduct ที่แก้ไขแล้ว
          axios.get(`${apiBase}/products/${id}`),
          axios.get(`${apiBase}/categories`),
        ]);
        console.log("productRes.data", productRes.data);

        const productData = productRes.data;
        setCategories(categoriesRes.data);

        // หา variant ที่ตรงกับ variantId ที่ส่งมาจาก URL
        const foundVariant = productData.variants.find(
          (v) => v.variantId == variantId
        );

        if (foundVariant) {
    // ...โค้ดเดิม...

    const frontImg = foundVariant.images.find(img => img.ImageType === 'front');
    const backImg = foundVariant.images.find(img => img.ImageType === 'back');

    // --- ส่วนที่แก้ไข ---
    // 1. ตั้งค่า Preview สำหรับแสดงผล (เหมือนเดิม)
    setFrontImagePreview(frontImg?.PictureURL || null);
    setBackImagePreview(backImg?.PictureURL || null);

    // 2. [สำคัญ] เก็บ URL รูปเก่าไว้ใน State `variant` ด้วย
    // โดยเพิ่ม property ใหม่เข้าไป
    setVariant({
        ...foundVariant,
        frontImageUrl: frontImg?.PictureURL || '',
        backImageUrl: backImg?.PictureURL || ''
    });
setProduct(productData);
        } else {
          setError("ไม่พบ Variant ของสินค้าที่ระบุ");
        }
      } catch (err) {
        setError("ไม่สามารถโหลดข้อมูลสินค้าได้ โปรดตรวจสอบ Console");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, variantId]);

  const handleProductChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleVariantChange = (e) => {
    setVariant({ ...variant, [e.target.name]: e.target.value });
  };

  const handleFileChangeFront = (e) => {
    const file = e.target.files[0];
    if (file) {
        setFrontImageFile(file);
        setFrontImagePreview(URL.createObjectURL(file));
    }
};

const handleFileChangeBack = (e) => {
    const file = e.target.files[0];
    if (file) {
        setBackImageFile(file);
        setBackImagePreview(URL.createObjectURL(file));
    }
};

const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
        // ฟังก์ชันช่วยอัปโหลดรูปภาพ
        const uploadImage = async (file) => {
            const formData = new FormData();
            formData.append("image", file);
            const res = await axios.post(`${apiBase}/upload-images`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (res.data.success) {
                return res.data.imageUrl;
            }
            throw new Error(res.data.message || 'Image upload failed');
        };

        // 1. จัดการ URL รูปภาพ
        let finalFrontImageUrl = variant.frontImageUrl;
        let finalBackImageUrl = variant.backImageUrl;

        if (frontImageFile) {
            finalFrontImageUrl = await uploadImage(frontImageFile);
        }
        if (backImageFile) {
            finalBackImageUrl = await uploadImage(backImageFile);
        }

        // 2. สร้าง array `images` สำหรับส่งไป backend
        const imagesForPayload = [];
        if (finalFrontImageUrl) {
            imagesForPayload.push({ url: finalFrontImageUrl, type: 'front' });
        }
        if (finalBackImageUrl) {
            imagesForPayload.push({ url: finalBackImageUrl, type: 'back' });
        }

        // 3. สร้าง Array `updatedVariants` เหมือนเดิม แต่เปลี่ยน payload รูปภาพ
        const updatedVariants = product.variants.map(v => {
            if (v.variantId == variantId) {
                return {
                    ...variant,
                    stock: parseInt(variant.stock, 10),
                    price: parseFloat(variant.price),
                    cost: parseFloat(variant.cost),
                    // ส่งเป็น array `images` แทน field รูปเดียว
                    images: imagesForPayload,
                };
            }
            return v;
        });

        // 4. สร้าง payload สุดท้ายเพื่อส่งไป API
        const payload = {
            productName: product.name,
            productDescription: product.description,
            categoryId: product.categoryId,
            variants: updatedVariants,
        };

        await axios.put(`${apiBase}/products/${id}`, payload);

        setSuccess(true);
        setTimeout(() => navigate("/dashboard"), 1500);

    } catch (err) {
        setError(err.message || "ไม่สามารถบันทึกการแก้ไขได้");
        console.error("Error updating product:", err);
    } finally {
        setSubmitting(false);
    }
};

  if (loading || !product || !variant) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">แก้ไขสินค้า</h2>
      {success && <Alert severity="success" sx={{ mb: 2 }}>บันทึกการแก้ไขเรียบร้อยแล้ว!</Alert>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ชื่อสินค้า */}
        <div>
          <label className="block font-medium">ชื่อสินค้า</label>
          <input
            type="text"
            name="name"
            value={product.name || ""}
            onChange={handleProductChange}
            className="w-full border rounded-lg p-2"
            required
          />
        </div>
        
        {/* คำอธิบาย */}
        <div>
          <label className="block font-medium">รายละเอียดสินค้า</label>
          <textarea
            name="description"
            value={product.description || ""}
            onChange={handleProductChange}
            className="w-full border rounded-lg p-2"
          />
        </div>
        
        {/* หมวดหมู่ */}
        <div>
          <label className="block font-medium">หมวดหมู่</label>
          <select
            name="categoryId"
            value={product.categoryId || ""}
            onChange={handleProductChange}
            className="w-full border rounded-lg p-2"
          >
            <option value="">-- เลือกหมวดหมู่ --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.categoryName}
              </option>
            ))}
          </select>
        </div>
        
        {/* ข้อมูล Variant */}
        <h3 className="text-2xl font-bold pt-4">รายละเอียด</h3>
        <div>
          <label className="block font-medium">ขนาด (Size)</label>
          <input
            type="text"
            name="size"
            value={variant.size || ""}
            onChange={handleVariantChange}
            className="w-full border rounded-lg p-2"
            required
          />
        </div>
        <div>
          <label className="block font-medium">สี (Color)</label>
          <input
            type="text"
            name="color"
            value={variant.color || ""}
            onChange={handleVariantChange}
            className="w-full border rounded-lg p-2"
            required
          />
        </div>
        <div>
          <label className="block font-medium">ราคา</label>
          <input
            type="number"
            name="price"
            value={variant.price || ""}
            onChange={handleVariantChange}
            className="w-full border rounded-lg p-2"
            required
          />
        </div>
        <div>
          <label className="block font-medium">ต้นทุน</label>
          <input
            type="number"
            name="cost"
            value={variant.cost || ""}
            onChange={handleVariantChange}
            className="w-full border rounded-lg p-2"
            required
          />
        </div>
        <div>
          <label className="block font-medium">จำนวนสต็อก</label>
          <input
            type="number"
            name="stock"
            value={variant.stock || ""}
            onChange={handleVariantChange}
            className="w-full border rounded-lg p-2"
            required
          />
        </div>

        {/* รูปภาพ */}
        <div>
    <label className="block font-medium">รูปภาพด้านหน้า</label>
    {frontImagePreview && (
        <img
            src={frontImagePreview}
            alt="Front preview"
            className="w-32 h-32 object-cover mb-2 rounded"
        />
    )}
    <input type="file" accept="image/*" onChange={handleFileChangeFront} />
</div>

<div>
    <label className="block font-medium">รูปภาพด้านหลัง</label>
    {backImagePreview && (
        <img
            src={backImagePreview}
            alt="Back preview"
            className="w-32 h-32 object-cover mb-2 rounded"
        />
    )}
    <input type="file" accept="image/*" onChange={handleFileChangeBack} />
</div>

        {/* ปุ่มบันทึก */}
        <div className="flex justify-end gap-4">
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-gray-400 text-white rounded-lg"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
          >
            {submitting && <Loader2 className="animate-spin w-4 h-4" />}
            บันทึกการแก้ไข
          </button>
        </div>
      </form>
    </div>
  );
}
