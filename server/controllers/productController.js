// server/controllers/productController.js
const db = require('../db'); // Import the database connection pool

// Define a mapping from Category_ID (number in DB) to category_name (string slug for display)
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
    const view = req.query.view; // Expects 'home' or 'admin'

    let sql;
    let params = [];
    let whereClause = [];

    // The SQL query and data processing logic is different for the Home page and the Admin page.
    if (view === 'admin') {
        // Query for the admin panel, which lists each product variant
        sql = `
            SELECT
                pv.Variant_ID,
                pv.Product_ID,
                p.ProductName,
                p.ProductDescription,
                p.Category_ID,
                pv.Size,
                pv.Color,
                pv.Stock,
                pv.Price,
                pv.Cost,
                (
                    SELECT pic.PictureURL
                    FROM picture pic
                    WHERE pic.Product_ID = p.Product_ID
                    ORDER BY pic.Picture_ID ASC
                    LIMIT 1
                ) AS imageUrl
            FROM
                product_variants pv
            JOIN
                product p ON pv.Product_ID = p.Product_ID
        `;

        if (categoryIdFilter && categoryIdFilter !== '0' && categoryIdFilter !== 'all' && categoryIdFilter !== 'null') {
            whereClause.push('p.Category_ID = ?');
            params.push(parseInt(categoryIdFilter));
        }

        if (searchTerm) {
            const likeTerm = `%${searchTerm}%`;
            whereClause.push(`
                (p.ProductName LIKE ? OR
                 p.ProductDescription LIKE ? OR
                 pv.Size LIKE ? OR
                 pv.Color LIKE ?)
            `);
            params.push(likeTerm, likeTerm, likeTerm, likeTerm);
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
        `;

        if (categoryIdFilter && categoryIdFilter !== '0' && categoryIdFilter !== 'all' && categoryIdFilter !== 'null') {
            whereClause.push('p.Category_ID = ?');
            params.push(parseInt(categoryIdFilter));
        }

        if (searchTerm) {
            const likeTerm = `%${searchTerm}%`;
            whereClause.push(`
                (p.ProductName LIKE ? OR
                 p.ProductDescription LIKE ?)
            `);
            params.push(likeTerm, likeTerm);
        }

        if (whereClause.length > 0) {
            sql += ' WHERE ' + whereClause.join(' AND ');
        }

        sql += ' GROUP BY p.Product_ID ORDER BY p.Product_ID ASC';
    }

    try {
        const [rows] = await db.query(sql, params);

        if (view === 'admin') {
            // Process data for the admin view (list of variants)
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
            // Process data for the home view (list of products with grouped variants/images)
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
    const { productName, productDescription, categoryId, variants, imageUrls } = req.body;

    if (!productName || !categoryId || !variants || variants.length === 0) {
        return res.status(400).json({ message: 'Product name, category, and at least one variant are required.' });
    }

    let connection;
    try {
        connection = await db.getConnection(); // Get a connection from the pool
        await connection.beginTransaction(); // Start a transaction

        // 1. Insert into 'product' table
        const [productResult] = await connection.query(
            'INSERT INTO product (ProductName, ProductDescription, Category_ID) VALUES (?, ?, ?)',
            [productName, productDescription, categoryId]
        );
        const productId = productResult.insertId;

        // 2. Insert into 'product_variants' table
        if (variants && variants.length > 0) {
            const variantValues = variants.map(v => [
                productId,
                v.size,
                v.color,
                v.stock,
                v.price,
                v.cost
            ]);
            await connection.query(
                'INSERT INTO product_variants (Product_ID, Size, Color, Stock, Price, Cost) VALUES ?',
                [variantValues]
            );
        }

        // 3. Insert into 'picture' table
        if (imageUrls && imageUrls.length > 0) {
            const pictureValues = imageUrls.map(url => [productId, url]);
            await connection.query(
                'INSERT INTO picture (Product_ID, PictureURL) VALUES ?',
                [pictureValues]
            );
        }

        await connection.commit(); // Commit the transaction
        res.status(201).json({ message: 'Product created successfully!', productId });

    } catch (error) {
        if (connection) {
            await connection.rollback(); // Rollback on error
        }
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Failed to create product.', error: error.message });
    } finally {
        if (connection) {
            connection.release(); // Release the connection back to the pool
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

        // Optional: Check if this was the last variant for the product.
        // If so, you might want to delete the product and its pictures too.
        const [remainingVariants] = await connection.query(
            'SELECT COUNT(*) AS count FROM product_variants WHERE Product_ID = ?',
            [productId]
        );

        if (remainingVariants[0].count === 0) {
            // No more variants, delete the product and its pictures
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

// --- updateProductVariant: Update a specific product variant ---
exports.updateProductVariant = async (req, res) => {
    const { productId, variantId } = req.params;
    const { size, color, stock, price, cost } = req.body;

    if (!variantId || !productId || !size || !color || stock === undefined || price === undefined || cost === undefined) {
        return res.status(400).json({ message: 'All variant fields (size, color, stock, price, cost) and product/variant IDs are required for update.' });
    }

    try {
        const [result] = await db.query(
            `UPDATE product_variants
             SET Size = ?, Color = ?, Stock = ?, Price = ?, Cost = ?
             WHERE Variant_ID = ? AND Product_ID = ?`,
            [size, color, stock, price, cost, variantId, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product variant not found or no changes made.' });
        }

        res.status(200).json({ message: 'Product variant updated successfully!' });
    } catch (error) {
        console.error('Error updating product variant:', error);
        res.status(500).json({ message: 'Failed to update product variant.', error: error.message });
    }
};
