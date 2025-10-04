-- แก้ไขตาราง picture เพื่อรองรับรูปหน้าและหลัง
-- เพิ่มคอลัมน์ใหม่
ALTER TABLE `picture` ADD COLUMN `ImageType` ENUM('front', 'back') NOT NULL DEFAULT 'front';
ALTER TABLE `picture` ADD COLUMN `Color` varchar(50) DEFAULT NULL;

-- สร้าง index สำหรับการค้นหาที่เร็วขึ้น
ALTER TABLE `picture` ADD INDEX `idx_variant_color_type` (`Variant_ID`, `Color`, `ImageType`);

-- อัปเดตข้อมูลเก่าให้มี ImageType เป็น 'front' และ Color จาก product_variants
UPDATE `picture` p 
JOIN `product_variants` pv ON p.Variant_ID = pv.Variant_ID 
SET p.Color = pv.Color, p.ImageType = 'front'
WHERE p.Variant_ID IS NOT NULL;