    // server/controllers/productController.js
const db = require('../../db');
const categoryIdToNameMap = {
        1: 'เสื้อบาสเกตบอล',
        2: 'เสื้อ T-Shirt',
        3: 'กางเกงบาสเกตบอล',
        4: 'รองเท้าบาสเกตบอล',
        5: 'ถุงเท้า',
    };
    

exports.getAllProducts = async (req, res) => {
    const categoryIdFilter = req.query.categoryId;
    const searchTerm = req.query.searchTerm;
    const view = req.query.view;
    let connection;
    // เตรียม map สำหรับ CategoryName เพื่อลดการ join ที่ไม่จำเป็นในบางกรณี
    const categoryIdToNameMap = {
        1: 'เสื้อบาสเกตบอล', 2: 'เสื้อ T-Shirt', 3: 'กางเกงบาสเกตบอล',
        4: 'รองเท้าบาสเกตบอล', 5: 'ถุงเท้า',
    };
    
    try {
        connection = await db.getConnection();
        const { categoryId, searchTerm, view } = req.query;
        let sql;
        let params = [];
        let whereClause = [];

        if (view === 'admin') {
            // Query สำหรับหน้า Admin Dashboard (แสดงผลแบบ Product)
            sql = `
                SELECT
                    p.Product_ID,
                    p.ProductName,
                    c.CategoryName,
                    COUNT(pv.Variant_ID) AS variantCount,
                    (
                        SELECT pic.PictureURL
                        FROM picture pic
                        WHERE pic.Product_ID = p.Product_ID
                        ORDER BY pic.Picture_ID ASC
                        LIMIT 1
                    ) AS imageUrl
                FROM product p
                LEFT JOIN category c ON p.Category_ID = c.Category_ID
                LEFT JOIN product_variants pv ON p.Product_ID = pv.Product_ID
            `;

            if (categoryId && categoryId !== '0' && categoryId !== 'all') {
                whereClause.push('p.Category_ID = ?');
                params.push(parseInt(categoryId));
            }
            if (searchTerm) {
                whereClause.push(`(LOWER(p.ProductName) LIKE ? OR LOWER(c.CategoryName) LIKE ?)`);
                params.push(`%${searchTerm.toLowerCase()}%`, `%${searchTerm.toLowerCase()}%`);
            }
            if (whereClause.length > 0) sql += ' WHERE ' + whereClause.join(' AND ');

            sql += ' GROUP BY p.Product_ID, p.ProductName, c.CategoryName ORDER BY p.Product_ID ASC';

            const [rows] = await connection.query(sql, params);
            // แปลงข้อมูลให้ Frontend ใช้ง่าย
            const products = rows.map(row => ({
                id: row.Product_ID,
                productName: row.ProductName,
                category: row.CategoryName,
                variantCount: row.variantCount,
                imageUrl: row.imageUrl || 'https://placehold.co/70x70',
            }));
            return res.json(products);

        } else {
             sql = `
                SELECT
                    p.Product_ID, p.ProductName, p.ProductDescription, p.Category_ID, c.CategoryName,
                    GROUP_CONCAT(DISTINCT pic.PictureURL ORDER BY pic.Picture_ID ASC SEPARATOR '|||') AS imageUrls_concat,
                    GROUP_CONCAT(
                        CONCAT_WS('###', pv.Variant_ID, pv.Size, pv.Color, pv.Stock, pv.Price, pv.Cost)
                        ORDER BY pv.Variant_ID ASC SEPARATOR '|||'
                    ) AS variants_concat
                FROM product p
                LEFT JOIN product_variants pv ON p.Product_ID = pv.Product_ID
                LEFT JOIN picture pic ON p.Product_ID = pic.Product_ID
                LEFT JOIN category c ON p.Category_ID = c.Category_ID
            `;
            
            if (categoryIdFilter && categoryIdFilter !== '0' && categoryIdFilter !== 'all') {
                whereClause.push('p.Category_ID = ?');
                params.push(parseInt(categoryIdFilter));
            }
            
            // [แก้ไข] เพิ่มเงื่อนไขการค้นหาให้ครอบคลุม ชื่อ, ประเภท, สี, และ ขนาด
            if (searchTerm) {
                const likeTerm = `%${searchTerm.toLowerCase()}%`;
                whereClause.push(`
                    (
                        LOWER(p.ProductName) LIKE ? OR
                        LOWER(c.CategoryName) LIKE ? OR
                        p.Product_ID IN (
                            SELECT DISTINCT Product_ID FROM product_variants
                            WHERE LOWER(Color) LIKE ? OR LOWER(Size) LIKE ?
                        )
                    )
                `);
                params.push(likeTerm, likeTerm, likeTerm, likeTerm);
            }

            if (whereClause.length > 0) sql += ' WHERE ' + whereClause.join(' AND ');
            sql += ' GROUP BY p.Product_ID ORDER BY p.Product_ID ASC';
        }

        const [rows] = await connection.query(sql, params);
        
        // --- ส่วนประมวลผล Response ---
        if (view === 'admin') {
            const products = rows.map(row => ({
                id: row.Product_ID,
                productName: row.ProductName,
                categoryId: row.Category_ID,
                category: row.CategoryName,
                variantCount: row.variantCount, 
                imageUrl: row.imageUrl || 'https://placehold.co/70x70',
            }));
            res.json(products);
        } else {
            const products = rows.map(row => {
                const imageUrls = row.imageUrls_concat ? row.imageUrls_concat.split('|||') : [];
                const variants = row.variants_concat ? row.variants_concat.split('|||').map(v => {
                    const parts = v.split('###');
                    return { variantId: parseInt(parts[0]), size: parts[1], color: parts[2], stock: parseInt(parts[3]), price: parseFloat(parts[4]), cost: parseFloat(parts[5]) };
                }) : [];
                return {
                    id: row.Product_ID, name: row.ProductName, description: row.ProductDescription || '',
                    categoryId: row.Category_ID, category: row.CategoryName,
                    imageUrl: imageUrls[0] || 'https://placehold.co/250x250',
                    imageUrls, variants,
                };
            });
            res.json(products);
        }

    } catch (error) {
        console.error('Error fetching all products:', error);
        res.status(500).json({ message: 'Failed to fetch products.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};




exports.getOneProduct = async (req, res) => {
    // (ใช้โค้ดชุดเดิมจากคำตอบก่อนหน้าได้เลย เพราะถูกต้องอยู่แล้ว)
    // โค้ดนี้จะแยก Query รูปภาพกับ Variant ทำให้ข้อมูลแม่นยำ
    const { id: productId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const productSql = `
            SELECT p.Product_ID, p.ProductName, p.ProductDescription, p.Category_ID,
                   pv.Variant_ID, pv.Size, pv.Color, pv.Stock, pv.Price, pv.Cost
            FROM product p
            LEFT JOIN product_variants pv ON p.Product_ID = pv.Product_ID
            WHERE p.Product_ID = ? ORDER BY pv.Variant_ID ASC;
        `;
        const [productRows] = await connection.query(productSql, [productId]);

        if (productRows.length === 0 || !productRows[0].Product_ID) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        const imagesSql = `SELECT Variant_ID, PictureURL, ImageType FROM picture WHERE Product_ID = ?;`;
        const [imageRows] = await connection.query(imagesSql, [productId]);
        const imagesByVariant = imageRows.reduce((acc, img) => {
            if (!acc[img.Variant_ID]) acc[img.Variant_ID] = [];
            if (img.PictureURL) acc[img.Variant_ID].push({ PictureURL: img.PictureURL, ImageType: img.ImageType });
            return acc;
        }, {});
        const product = {
            id: productRows[0].Product_ID,
            name: productRows[0].ProductName,
            description: productRows[0].ProductDescription || '',
            categoryId: productRows[0].Category_ID,
            variants: [],
        };
        const variantMap = new Map();
        productRows.forEach(row => {
            if (row.Variant_ID && !variantMap.has(row.Variant_ID)) {
                variantMap.set(row.Variant_ID, {
                    variantId: row.Variant_ID,
                    size: row.Size, color: row.Color, stock: row.Stock,
                    price: row.Price, cost: row.Cost,
                    images: imagesByVariant[row.Variant_ID] || []
                });
            }
        });
        product.variants = Array.from(variantMap.values());
        res.json(product);
    } catch (error) {
        console.error('Error fetching single product:', error);
        res.status(500).json({ message: 'Error fetching product details', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.createProduct = async (req, res) => {
        const { productName, productDescription, categoryId, variants } = req.body;
        let connection;

        if (!productName || !categoryId || !variants || variants.length === 0) {
            return res.status(400).json({ message: 'Product name, category, and at least one variant are required.' });
        }

        try {
            connection = await db.getConnection();
            await connection.beginTransaction();

            // 1. Insert into 'product' table
            const [productResult] = await connection.query(
                'INSERT INTO product (ProductName, ProductDescription, Category_ID) VALUES (?, ?, ?)',
                [productName, productDescription, categoryId]
            );
            const productId = productResult.insertId;

            // 2. Insert into 'product_variants' and 'picture' tables
            for (const variant of variants) {
                const [variantResult] = await connection.query(
                    'INSERT INTO product_variants (Product_ID, Size, Color, Stock, Price, Cost) VALUES (?, ?, ?, ?, ?, ?)',
                    [productId, variant.size, variant.color, variant.stock, variant.price, variant.cost]
                );
                const variantId = variantResult.insertId;

                // อัปโหลดรูปภาพใหม่ (รองรับ front และ back)
                if (variant.images && Array.isArray(variant.images)) {
                    for (const image of variant.images) {
                        await connection.query(
                            'INSERT INTO picture (Product_ID, PictureURL, Variant_ID, ImageType, Color) VALUES (?, ?, ?, ?, ?)',
                            [productId, image.url, variantId, image.type, variant.color]
                        );
                    }
                }
            }

            await connection.commit();
            res.status(201).json({ message: 'Product created successfully!', productId });

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('Error creating product:', error);
            res.status(500).json({ message: 'Failed to create product.', error: error.message });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    };
    


exports.updateProduct = async (req, res) => {
    const { productId } = req.params; 
    const { name, description, categoryId, variants } = req.body;
    let connection;

    if (!productId) {
        return res.status(400).json({ message: 'Product ID is required.' });
    }

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        await connection.query(
            'UPDATE product SET ProductName = ?, ProductDescription = ?, Category_ID = ? WHERE Product_ID = ?',
            [name, description, categoryId, productId]
        );

        if (variants && Array.isArray(variants)) {
            for (const variant of variants) {
                let currentVariantId = variant.variantId;

                if (currentVariantId && currentVariantId !== 'new') {
                    await connection.query(
                        'UPDATE product_variants SET Size = ?, Color = ?, Stock = ?, Price = ?, Cost = ? WHERE Variant_ID = ?',
                        [variant.size, variant.color, variant.stock, variant.price, variant.cost, currentVariantId]
                    );
                    await connection.query('DELETE FROM picture WHERE Variant_ID = ?', [currentVariantId]);
                } else {
                    const [result] = await connection.query(
                        'INSERT INTO product_variants (Product_ID, Size, Color, Stock, Price, Cost) VALUES (?, ?, ?, ?, ?, ?)',
                        [productId, variant.size, variant.color, variant.stock, variant.price, variant.cost]
                    );
                    currentVariantId = result.insertId;
                }

                if (variant.images && Array.isArray(variant.images)) {
                    for (const image of variant.images) {
                        // [สำคัญ] ใช้ Key "PictureURL" และ "ImageType" ให้ตรงกับที่ Frontend ส่งมา
                        if (image.PictureURL && image.ImageType) {
                            await connection.query(
                                'INSERT INTO picture (Product_ID, Variant_ID, PictureURL, ImageType, Color) VALUES (?, ?, ?, ?, ?)',
                                [productId, currentVariantId, image.PictureURL, image.ImageType, variant.color]
                            );
                        }
                    }
                }
            }
        }

        await connection.commit();
        res.status(200).json({ message: 'Product updated successfully!', productId });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Failed to update product.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.deleteVariant = async (req, res) => {
    const { variantId } = req.params;
    let connection;

    if (!variantId) {
        return res.status(400).json({ message: 'Variant ID is required.' });
    }

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        await connection.query('DELETE FROM picture WHERE Variant_ID = ?', [variantId]);
        const [result] = await connection.query('DELETE FROM product_variants WHERE Variant_ID = ?', [variantId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Variant not found.' });
        }

        await connection.commit();
        res.status(200).json({ message: 'Variant deleted successfully.' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error deleting variant:', error);
        res.status(500).json({ message: 'Failed to delete variant.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.deleteProduct = async (req, res) => {
    const { productId } = req.params;
    let connection;

    if (!productId) {
        return res.status(400).json({ message: 'Product ID is required.' });
    }

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. ดึง Variant IDs ทั้งหมดที่อยู่ใต้ Product นี้
        const [variants] = await connection.query(
            'SELECT Variant_ID FROM product_variants WHERE Product_ID = ?', 
            [productId]
        );
        const variantIds = variants.map(v => v.Variant_ID);

        // 2. ถ้ามี Variants, ให้ลบรูปภาพทั้งหมดที่เกี่ยวข้องกับ Variants เหล่านั้น
        if (variantIds.length > 0) {
            await connection.query('DELETE FROM picture WHERE Variant_ID IN (?)', [variantIds]);
        }

        // 3. ลบ Variants ทั้งหมด
        await connection.query('DELETE FROM product_variants WHERE Product_ID = ?', [productId]);

        // 4. ลบ Product หลัก
        const [result] = await connection.query('DELETE FROM product WHERE Product_ID = ?', [productId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        await connection.commit();
        res.status(200).json({ message: 'Product deleted successfully.' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Failed to delete product.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};