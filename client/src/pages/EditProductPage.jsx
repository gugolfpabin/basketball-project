// // src/pages/EditProductPage.jsx
// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate, Link } from "react-router-dom";
// import axios from "axios";
// import { Loader2 } from "lucide-react";
// import { styled } from "@mui/material/styles";
// import {
//   Container,
//   Paper,
//   Typography,
//   TextField,
//   Button,
//   Box,
//   CircularProgress,
//   Alert,
//   MenuItem,
// } from "@mui/material";

// const FormContainer = styled(Paper)(({ theme }) => ({
//   padding: theme.spacing(4),
//   marginTop: theme.spacing(4),
//   marginBottom: theme.spacing(4),
// }));

// export default function EditProductPage() {
//   const { id, variantId } = useParams();
//   const navigate = useNavigate();

//   const [product, setProduct] = useState(null);
//   const [variant, setVariant] = useState(null);
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(false);
//   const [imageFile, setImageFile] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);

//   const apiBase = "http://localhost:5000/api";

//   useEffect(() => {
    
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         setError(null);
        
//         // ดึงข้อมูลสินค้าและหมวดหมู่พร้อมกัน
//         const [productRes, categoriesRes] = await Promise.all([
//           axios.get(`${apiBase}/products/${id}`),
//           axios.get(`${apiBase}/categories`),
//         ]);
//         console.log("productRes.data", productRes.data);

//         const productData = productRes.data;
//         setCategories(categoriesRes.data);

//         // หา variant ที่ตรงกับ variantId ที่ส่งมาจาก URL
//         const foundVariant = productData.variants.find(
//           (v) => v.variantId == variantId
//         );

//         if (foundVariant) {
//           setProduct(productData);
//           setVariant(foundVariant);
//           // ตั้งค่า preview รูปภาพเริ่มต้นด้วยรูปของ variant นั้นๆ
//           setImagePreview(foundVariant.Variant_Image_Url);
//         } else {
//           setError("ไม่พบ Variant ของสินค้าที่ระบุ");
//         }
//       } catch (err) {
//         setError("ไม่สามารถโหลดข้อมูลสินค้าได้ โปรดตรวจสอบ Console");
//         console.error("Error fetching data:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [id, variantId]);

//   const handleProductChange = (e) => {
//     setProduct({ ...product, [e.target.name]: e.target.value });
//   };

//   const handleVariantChange = (e) => {
//     setVariant({ ...variant, [e.target.name]: e.target.value });
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setImageFile(file);
//       setImagePreview(URL.createObjectURL(file));
//     } else {
//       setImageFile(null);
//       setImagePreview(variant.Variant_Image_Url);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setSubmitting(true);
//     setError(null);
//     setSuccess(false);

//     if (!product || !variant) {
//         setError("ข้อมูลสินค้าไม่สมบูรณ์");
//         setSubmitting(false);
//         return;
//     }

//     try {
//       let finalImageUrl = variant.Variant_Image_Url;

//       // 1. ถ้ามีการเลือกไฟล์รูปภาพใหม่ ให้อัปโหลดก่อน
//       if (imageFile) {
//         const formData = new FormData();
//         formData.append("image", imageFile);

//         try {
//             const uploadRes = await axios.post(`${apiBase}/upload-images`, formData, {
//               headers: { "Content-Type": "multipart/form-data" },
//             });

//             if (uploadRes.data.success) {
//               finalImageUrl = uploadRes.data.imageUrl;
//             } else {
//               throw new Error(uploadRes.data.message || 'Image upload failed');
//             }
//         } catch (uploadErr) {
//             console.error("Error uploading image:", uploadErr.response ? uploadErr.response.data : uploadErr.message);
//             throw new Error("ไม่สามารถอัปโหลดรูปภาพได้");
//         }
//       }
      
//       // 2. สร้าง payload สำหรับการอัปเดตข้อมูลสินค้าและ Variant ที่แก้ไขเท่านั้น
//       const payload = {
//         productName: product.Product_Name,
//         productDescription: product.Product_Description,
//         categoryId: product.Category_ID,
//         variants: [
//           {
//             variantId: variant.Variant_ID,
//             size: variant.Size,
//             color: variant.Color,
//             stock: parseInt(variant.Stock),
//             price: parseFloat(variant.Price),
//             cost: parseFloat(variant.Cost),
//             variantImageUrl: finalImageUrl,
//           },
//         ],
//       };

//       // 3. ส่งข้อมูลทั้งหมดไปยัง endpoint update product
//       await axios.put(`${apiBase}/products/${id}`, payload, {
//         headers: { "Content-Type": "application/json" },
//       });

//       setSuccess(true);
//       setTimeout(() => {
//         navigate("/dashboard");
//       }, 1500);
//     } catch (err) {
//       setError("ไม่สามารถบันทึกการแก้ไขได้ โปรดตรวจสอบ Console");
//       console.error("Error updating product:", err.response ? err.response.data : err.message);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (loading || !product || !variant) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <Container maxWidth="sm">
//         <Box sx={{ mt: 4 }}>
//           <Alert severity="error">{error}</Alert>
//         </Box>
//       </Container>
//     );
//   }

//   return (
//     <div className="max-w-3xl mx-auto p-6">
//       <h2 className="text-2xl font-bold mb-6">แก้ไขสินค้า</h2>
//       {success && <Alert severity="success" sx={{ mb: 2 }}>บันทึกการแก้ไขเรียบร้อยแล้ว!</Alert>}
//       <form onSubmit={handleSubmit} className="space-y-4">
//         {/* ชื่อสินค้า */}
//         <div>
//           <label className="block font-medium">ชื่อสินค้า</label>
//           <input
//             type="text"
//             name="Product_Name"
//             value={product.Product_Name || ""}
//             onChange={handleProductChange}
//             className="w-full border rounded-lg p-2"
//             required
//           />
//         </div>
        
//         {/* คำอธิบาย */}
//         <div>
//           <label className="block font-medium">รายละเอียดสินค้า</label>
//           <textarea
//             name="Product_Description"
//             value={product.Product_Description || ""}
//             onChange={handleProductChange}
//             className="w-full border rounded-lg p-2"
//           />
//         </div>
        
//         {/* หมวดหมู่ */}
//         <div>
//           <label className="block font-medium">หมวดหมู่</label>
//           <select
//             name="Category_ID"
//             value={product.Category_ID || ""}
//             onChange={handleProductChange}
//             className="w-full border rounded-lg p-2"
//           >
//             <option value="">-- เลือกหมวดหมู่ --</option>
//             {categories.map((cat) => (
//               <option key={cat.id} value={cat.id}>
//                 {cat.categoryName}
//               </option>
//             ))}
//           </select>
//         </div>
        
//         {/* ข้อมูล Variant */}
//         <h3 className="text-xl font-bold pt-4">ข้อมูล Variant</h3>
//         <div>
//           <label className="block font-medium">ขนาด (Size)</label>
//           <input
//             type="text"
//             name="Size"
//             value={variant.Size || ""}
//             onChange={handleVariantChange}
//             className="w-full border rounded-lg p-2"
//             required
//           />
//         </div>
//         <div>
//           <label className="block font-medium">สี (Color)</label>
//           <input
//             type="text"
//             name="Color"
//             value={variant.Color || ""}
//             onChange={handleVariantChange}
//             className="w-full border rounded-lg p-2"
//             required
//           />
//         </div>
//         <div>
//           <label className="block font-medium">ราคา</label>
//           <input
//             type="number"
//             name="Price"
//             value={variant.Price || ""}
//             onChange={handleVariantChange}
//             className="w-full border rounded-lg p-2"
//             required
//           />
//         </div>
//         <div>
//           <label className="block font-medium">ต้นทุน</label>
//           <input
//             type="number"
//             name="Cost"
//             value={variant.Cost || ""}
//             onChange={handleVariantChange}
//             className="w-full border rounded-lg p-2"
//             required
//           />
//         </div>
//         <div>
//           <label className="block font-medium">จำนวนสต็อก</label>
//           <input
//             type="number"
//             name="Stock"
//             value={variant.Stock || ""}
//             onChange={handleVariantChange}
//             className="w-full border rounded-lg p-2"
//             required
//           />
//         </div>

//         {/* รูปภาพ */}
//         <div>
//           <label className="block font-medium">รูปภาพสินค้า</label>
//           {(imagePreview) && (
//             <img
//               src={imagePreview}
//               alt="Product preview"
//               className="w-32 h-32 object-cover mb-2 rounded"
//             />
//           )}
//           <input type="file" accept="image/*" onChange={handleFileChange} />
//         </div>

//         {/* ปุ่มบันทึก */}
//         <div className="flex justify-end gap-4">
//           <Link
//             to="/dashboard"
//             className="px-4 py-2 bg-gray-400 text-white rounded-lg"
//           >
//             ยกเลิก
//           </Link>
//           <button
//             type="submit"
//             disabled={submitting}
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
//           >
//             {submitting && <Loader2 className="animate-spin w-4 h-4" />}
//             บันทึกการแก้ไข
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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
          setProduct(productData);
          setVariant(foundVariant);
          // ตั้งค่า preview รูปภาพเริ่มต้นด้วยรูปของ variant นั้นๆ
          setImagePreview(foundVariant.variantImageUrl);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(variant.variantImageUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    if (!product || !variant) {
      setError("ข้อมูลสินค้าไม่สมบูรณ์");
      setSubmitting(false);
      return;
    }

    try {
      let finalImageUrl = variant.variantImageUrl;

      // 1. ถ้ามีการเลือกไฟล์รูปภาพใหม่ ให้อัปโหลดก่อน
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);

        try {
          const uploadRes = await axios.post(`${apiBase}/upload-images`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          if (uploadRes.data.success) {
            finalImageUrl = uploadRes.data.imageUrl;
          } else {
            throw new Error(uploadRes.data.message || 'Image upload failed');
          }
        } catch (uploadErr) {
          console.error("Error uploading image:", uploadErr.response ? uploadErr.response.data : uploadErr.message);
          throw new Error("ไม่สามารถอัปโหลดรูปภาพได้");
        }
      }
      
      // 2. สร้าง payload สำหรับการอัปเดตข้อมูลสินค้าและ Variant ที่แก้ไขเท่านั้น
      const payload = {
        productName: product.name,
        productDescription: product.description,
        categoryId: product.categoryId,
        variants: [
          {
            variantId: variant.variantId,
            size: variant.size,
            color: variant.color,
            stock: parseInt(variant.stock),
            price: parseFloat(variant.price),
            cost: parseFloat(variant.cost),
            variantImageUrl: finalImageUrl,
          },
        ],
      };

      // 3. ส่งข้อมูลทั้งหมดไปยัง endpoint update product
      await axios.put(`${apiBase}/products/${id}`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      setError("ไม่สามารถบันทึกการแก้ไขได้ โปรดตรวจสอบ Console");
      console.error("Error updating product:", err.response ? err.response.data : err.message);
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
        <h3 className="text-xl font-bold pt-4">ข้อมูล Variant</h3>
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
          <label className="block font-medium">รูปภาพสินค้า</label>
          {(imagePreview) && (
            <img
              src={imagePreview}
              alt="Product preview"
              className="w-32 h-32 object-cover mb-2 rounded"
            />
          )}
          <input type="file" accept="image/*" onChange={handleFileChange} />
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
