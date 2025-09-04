    // server/controllers/productController.js
    const db = require('../db'); 
    const categoryIdToNameMap = {
        1: 'เสื้อบาสเกตบอล',
        2: 'เสื้อ T-Shirt',
        3: 'กางเกงบาสเกตบอล',
        4: 'รองเท้าบาสเกตบอล',
        5: 'ถุงเท้า',
    };

    // --- getAllProducts: Fetch products based on 'view' (home or admin) and filters ---
    exports.getAllProducts = async (req, res) => {
        const categoryIdFilter = req.query.categoryId;
        const searchTerm = req.query.searchTerm;
        const view = req.query.view;
        let connection;

        try {
            connection = await db.getConnection();
            let sql;
            let params = [];
            let whereClause = [];

            if (view === 'admin') {
                sql = `
                    SELECT
                        pv.Variant_ID,
                        pv.Product_ID,
                        p.ProductName,
                        p.ProductDescription,
                        p.Category_ID,
                        c.CategoryName,
                        pv.Size,
                        pv.Color,
                        pv.Stock,
                        pv.Price,
                        pv.Cost,
                        pic.PictureURL AS imageUrl
                    FROM
                        product_variants pv
                    JOIN
                        product p ON pv.Product_ID = p.Product_ID
                    LEFT JOIN
                        category c ON p.Category_ID = c.Category_ID
                    LEFT JOIN
                        picture pic ON pv.Variant_ID = pic.Variant_ID
                `;

                if (categoryIdFilter && categoryIdFilter !== '0' && categoryIdFilter !== 'all' && categoryIdFilter !== 'null') {
                    whereClause.push('p.Category_ID = ?');
                    params.push(parseInt(categoryIdFilter));
                }

                if (searchTerm) {
                    const likeTerm = `%${searchTerm}%`;
                    whereClause.push(`
                        (LOWER(p.ProductName) LIKE ? OR
                        LOWER(p.ProductDescription) LIKE ? OR
                        LOWER(c.CategoryName) LIKE ? OR
                        LOWER(pv.Size) LIKE ? OR
                        LOWER(pv.Color) LIKE ?)
                    `);
                    params.push(likeTerm, likeTerm, likeTerm, likeTerm, likeTerm);
                }

                if (whereClause.length > 0) {
                    sql += ' WHERE ' + whereClause.join(' AND ');
                }

                sql += ' ORDER BY pv.Product_ID ASC, pv.Variant_ID ASC';

            } else { // Default view (for Home page) or view === 'home'
                // Query for the Home page, which groups variants and images by product
                sql = `
                    SELECT
                        p.Product_ID,
                        p.ProductName,
                        p.ProductDescription,
                        p.Category_ID,
                        c.CategoryName,
                        GROUP_CONCAT(DISTINCT pic.PictureURL ORDER BY pic.Picture_ID ASC SEPARATOR '|||') AS imageUrls_concat,
                        GROUP_CONCAT(
                            CONCAT_WS('###',
                                pv.Variant_ID,
                                pv.Size,
                                pv.Color,
                                pv.Stock,
                                pv.Price,
                                pv.Cost
                            ) ORDER BY pv.Variant_ID ASC SEPARATOR '|||'
                        ) AS variants_concat
                    FROM
                        product p
                    LEFT JOIN
                        product_variants pv ON p.Product_ID = pv.Product_ID
                    LEFT JOIN
                        picture pic ON p.Product_ID = pic.Product_ID
                    LEFT JOIN
                        category c ON p.Category_ID = c.Category_ID
                `;

                if (categoryIdFilter && categoryIdFilter !== '0' && categoryIdFilter !== 'all' && categoryIdFilter !== 'null') {
                    whereClause.push('p.Category_ID = ?');
                    params.push(parseInt(categoryIdFilter));
                }

                if (searchTerm) {
                    const likeTerm = `%${searchTerm.toLowerCase()}%`;
                    whereClause.push(`
                        (LOWER(p.ProductName) LIKE ? OR
                        LOWER(c.CategoryName) LIKE ?)
                    `);
                    params.push(likeTerm, likeTerm);
                }

                if (whereClause.length > 0) {
                    sql += ' WHERE ' + whereClause.join(' AND ');
                }

                sql += ' GROUP BY p.Product_ID ORDER BY p.Product_ID ASC';
            }

            const [rows] = await connection.query(sql, params);

            if (view === 'admin') {
                const productVariants = rows.map(row => {
                    const categoryDisplayName = categoryIdToNameMap[row.Category_ID] || 'หมวดหมู่ไม่ระบุ';
                    return {
                        id: row.Product_ID,
                        variantId: row.Variant_ID,
                        productName: row.ProductName,
                        productDescription: row.ProductDescription || '',
                        categoryId: row.Category_ID,
                        category: categoryDisplayName,
                        size: row.Size,
                        color: row.Color,
                        stock: row.Stock,
                        price: row.Price,
                        cost: row.Cost,
                        imageUrl: row.imageUrl || 'https://placehold.co/70x70/E0E0E0/333333?text=No+Image',
                    };
                });
                res.json(productVariants);
            } else {
                const products = rows.map(row => {
                    const imageUrls = row.imageUrls_concat ? row.imageUrls_concat.split('|||').map(url => url.trim()) : [];
                    const variants = row.variants_concat ?
                        row.variants_concat.split('|||').map(variantStr => {
                            const parts = variantStr.split('###');
                            return {
                                variantId: parseInt(parts[0]),
                                size: parts[1],
                                color: parts[2],
                                stock: parseInt(parts[3]),
                                price: parseFloat(parts[4]),
                                cost: parseFloat(parts[5]),
                            };
                        }) : [];

                    const categoryDisplayName = categoryIdToNameMap[row.Category_ID] || 'หมวดหมู่ไม่ระบุ';

                    return {
                        id: row.Product_ID,
                        name: row.ProductName,
                        description: row.ProductDescription || '',
                        categoryId: row.Category_ID,
                        category: categoryDisplayName,
                        imageUrl: imageUrls.length > 0 ? imageUrls[0] : 'https://placehold.co/200x250/E0E0E0/333333?text=No+Image',
                        imageUrls: imageUrls,
                        variants: variants,
                    };
                });
                res.json(products);
            }
        } catch (error) {
            console.error(`Error fetching products for view '${view}':`, error);
            res.status(500).json({ message: `Error fetching products for view '${view}'`, error: error.message });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    };

    // --- getOneProduct: Fetch details of a single product with ALL its variants and images ---
    exports.getOneProduct = async (req, res) => {
    const productId = req.params.id;

    const sql = `
        SELECT
            p.Product_ID,
            p.ProductName,
            p.ProductDescription,
            p.Category_ID,
            GROUP_CONCAT(DISTINCT pic.PictureURL ORDER BY pic.Picture_ID ASC SEPARATOR '|||') AS imageUrls_concat,
            GROUP_CONCAT(
                CONCAT_WS('###',
                    pv.Variant_ID,
                    pv.Size,
                    pv.Color,
                    pv.Stock,
                    pv.Price,
                    pv.Cost
                ) ORDER BY pv.Variant_ID ASC SEPARATOR '|||'
            ) AS variants_concat
        FROM
            product p
        LEFT JOIN
            product_variants pv ON p.Product_ID = pv.Product_ID
        LEFT JOIN
            picture pic ON p.Product_ID = pic.Product_ID
        WHERE
            p.Product_ID = ?
        GROUP BY p.Product_ID;
    `;

    try {
        const [rows] = await db.query(sql, [productId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const row = rows[0];
        const imageUrls = row.imageUrls_concat ? row.imageUrls_concat.split('|||').map(url => url.trim()) : [];
        const variants = row.variants_concat ?
            row.variants_concat.split('|||').map(variantStr => {
                const parts = variantStr.split('###');
                return {
                    variantId: parseInt(parts[0]),
                    size: parts[1],
                    color: parts[2],
                    stock: parseInt(parts[3]),
                    price: parseFloat(parts[4]),
                    cost: parseFloat(parts[5]),
                };
            }) : [];

        const categoryDisplayName = categoryIdToNameMap[row.Category_ID] || 'uncategorized';

        const product = {
            id: row.Product_ID,
            name: row.ProductName,
            description: row.ProductDescription || '',
            categoryId: row.Category_ID,
            category: categoryDisplayName,
            imageUrl: imageUrls.length > 0 ? imageUrls[0] : 'https://placehold.co/200x250/E0E0E0/333333?text=No+Image',
            imageUrls: imageUrls,
            variants: variants,
        };

        res.json(product);
    } catch (error) {
        console.error('Error fetching single product with variants and images:', error);
        res.status(500).json({ message: 'Error fetching product details', error: error.message });
    }
};


    // --- createProduct: Add a new product with its variants and images ---
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

                if (variant.imageUrl) {
                    await connection.query(
                        'INSERT INTO picture (Product_ID, PictureURL, Variant_ID) VALUES (?, ?, ?)',
                        [productId, variant.imageUrl, variantId]
                    );
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

    // --- deleteProductVariant: Delete a specific product variant ---
    exports.deleteProductVariant = async (req, res) => {
        const { productId, variantId } = req.params; // Get product ID and variant ID from URL params

        if (!variantId) {
            return res.status(400).json({ message: 'Variant ID is required for deletion.' });
        }

        let connection;
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();

            // Delete the specific variant
            const [result] = await connection.query(
                'DELETE FROM product_variants WHERE Variant_ID = ? AND Product_ID = ?',
                [variantId, productId] // Ensure both match
            );

            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Product variant not found or already deleted.' });
            }

            const [remainingVariants] = await connection.query(
                'SELECT COUNT(*) AS count FROM product_variants WHERE Product_ID = ?',
                [productId]
            );

            if (remainingVariants[0].count === 0) {
                await connection.query('DELETE FROM picture WHERE Product_ID = ?', [productId]);
                await connection.query('DELETE FROM product WHERE Product_ID = ?', [productId]);
                console.log(`Product ${productId} and its pictures deleted as no variants remained.`);
            }

            await connection.commit();
            res.status(200).json({ message: 'Product variant deleted successfully!' });

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('Error deleting product variant:', error);
            res.status(500).json({ message: 'Failed to delete product variant.', error: error.message });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    };

    // --- updateProduct: Update product details and its specific variant ---
    exports.updateProduct = async (req, res) => {
    const { productId } = req.params;
    const { productName, productDescription, categoryId, variants } = req.body;

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. อัปเดตข้อมูลหลักของสินค้า (ถ้ามีการส่งค่ามา)
        if (productName || productDescription || categoryId) {
            await connection.query(
                `UPDATE product SET ProductName = ?, ProductDescription = ?, Category_ID = ? WHERE Product_ID = ?`,
                [productName, productDescription, categoryId, productId]
            );
        }

        // 2. จัดการกับ Variants
        if (variants && Array.isArray(variants) && variants.length > 0) {
            const variantTasks = variants.map(async variant => {
                // อัปเดตข้อมูลในตาราง product_variants
                await connection.query(
                    `UPDATE product_variants SET Size = ?, Color = ?, Stock = ?, Price = ?, Cost = ? WHERE Variant_ID = ? AND Product_ID = ?`,
                    [variant.size, variant.color, variant.stock, variant.price, variant.cost, variant.variantId, productId]
                );

                // หากมีการส่ง URL รูปภาพใหม่มา ให้ไปอัปเดตในตารางรูปภาพโดยเฉพาะ
            if (variant.variantImageUrl) {
                    await connection.query(
                        `UPDATE picture SET PictureURL = ? WHERE Variant_ID = ?`,
                        [variant.variantImageUrl, variant.variantId]
                    );
                }
            });
            await Promise.all(variantTasks);
        }

        await connection.commit();
        res.status(200).json({ message: 'Product and variants updated successfully!', productId });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Failed to update product.', error: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
