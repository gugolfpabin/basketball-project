const db = require('../db');

exports.addToCart = async (req, res) => {
    const memberId = req.user.id; 
    const { variantId, quantity } = req.body;

    if (!variantId || !quantity) {
        return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [variants] = await connection.query('SELECT Price, Stock FROM product_variants WHERE Variant_ID = ?', [variantId]);
        
        if (variants.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'ไม่พบสินค้านี้' });
        }
        
        const variant = variants[0];
        if (variant.Stock < quantity) {
            await connection.rollback();
            return res.status(400).json({ message: 'สินค้าในสต็อกไม่เพียงพอ' });
        }
        const unitPrice = variant.Price;

        let [carts] = await connection.query('SELECT Cart_ID FROM cart WHERE Member_ID = ?', [memberId]);
        let cartId;

        if (carts.length === 0) {
            const [newCart] = await connection.query('INSERT INTO cart (Member_ID, Created_Date) VALUES (?, NOW())', [memberId]);
            cartId = newCart.insertId;
        } else {
            cartId = carts[0].Cart_ID;
        }

        const [items] = await connection.query('SELECT CartItem_ID, Quantity FROM cartitem WHERE Cart_ID = ? AND Variant_ID = ?', [cartId, variantId]);

        if (items.length > 0) {
            const newQuantity = items[0].Quantity + quantity;
            await connection.query('UPDATE cartitem SET Quantity = ? WHERE CartItem_ID = ?', [newQuantity, items[0].CartItem_ID]);
        } else {
            await connection.query(
                'INSERT INTO cartitem (Cart_ID, Variant_ID, Quantity, UnitPrice) VALUES (?, ?, ?, ?)',
                [cartId, variantId, quantity, unitPrice]
            );
        }

        await connection.commit();
        res.status(200).json({ message: 'เพิ่มสินค้าลงในตะกร้าสำเร็จ!' });

    } catch (error) {
        await connection.rollback();
        console.error('Add to cart error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    } finally {
        connection.release();
    }
};

exports.getCart = async (req, res) => {
    const memberId = req.user.id;

    try {
        const sql = `
            SELECT
                ci.CartItem_ID AS cartItemId,
                p.Product_ID AS productId,
                p.ProductName AS productName,
                pv.Variant_ID AS variantId,
                pv.Size AS size,
                pv.Color AS color,
                ci.Quantity AS quantity,
                ci.UnitPrice AS unitPrice,
                pic.PictureURL AS imageUrl
            FROM cart c
            JOIN cartitem ci ON c.Cart_ID = ci.Cart_ID
            JOIN product_variants pv ON ci.Variant_ID = pv.Variant_ID
            JOIN product p ON pv.Product_ID = p.Product_ID
            LEFT JOIN (
                -- หารูปภาพ 1 รูปสำหรับ variant นั้นๆ
                SELECT Variant_ID, PictureURL, ROW_NUMBER() OVER(PARTITION BY Variant_ID ORDER BY Picture_ID) as rn
                FROM picture
            ) AS pic ON pv.Variant_ID = pic.Variant_ID AND pic.rn = 1
            WHERE c.Member_ID = ?
            ORDER BY ci.CartItem_ID ASC;
        `;

        const [items] = await db.query(sql, [memberId]);

        res.status(200).json(items);

    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    }
};

exports.validateStock = async (req, res) => {
    const { items } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: "ไม่มีสินค้าในตะกร้า" });
    }

    try {
        for (const item of items) {
            const [rows] = await db.query(
                'SELECT Stock, p.ProductName FROM product_variants pv JOIN product p ON pv.Product_ID = p.Product_ID WHERE pv.Variant_ID = ?', 
                [item.variantId]
            );

            if (rows.length === 0) {
                return res.status(400).json({ message: `ไม่พบสินค้า ID: ${item.variantId}` });
            }

            const stockAvailable = rows[0].Stock;
            const productName = rows[0].ProductName;

            if (item.quantity > stockAvailable) {
                return res.status(400).json({ 
                    success: false,
                    message: `ขออภัย, สินค้า "${productName}" (สี: ${item.color}, ขนาด: ${item.size}) มีเหลือเพียง ${stockAvailable} ชิ้น` 
                });
            }
        }

        res.status(200).json({ success: true, message: "สต็อกสินค้าเพียงพอ" });

    } catch (error) {
        console.error("Stock validation error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
    }
};
exports.removeCartItem = async (req, res) => {
    const { cartItemId } = req.params;
    const memberId = req.user.id;

    try {
        const [rows] = await db.query(
            `SELECT * FROM cartitem ci 
             JOIN cart c ON ci.Cart_ID = c.Cart_ID 
             WHERE ci.CartItem_ID = ? AND c.Member_ID = ?`,
            [cartItemId, memberId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบรายการสินค้านี้ในตะกร้าของคุณ' });
        }
        
        await db.query('DELETE FROM cartitem WHERE CartItem_ID = ?', [cartItemId]);
        res.status(200).json({ message: 'ลบสินค้าออกจากตะกร้าแล้ว' });

    } catch (error) {
        console.error('Remove cart item error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    }
};

exports.updateCartItem = async (req, res) => {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    const memberId = req.user.id;

    if (!quantity || quantity < 1) {
        return res.status(400).json({ message: 'จำนวนไม่ถูกต้อง' });
    }

    try {
        const [rows] = await db.query(
            `SELECT * FROM cartitem ci JOIN cart c ON ci.Cart_ID = c.Cart_ID WHERE ci.CartItem_ID = ? AND c.Member_ID = ?`,
            [cartItemId, memberId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบรายการสินค้านี้' });
        }

        await db.query('UPDATE cartitem SET Quantity = ? WHERE CartItem_ID = ?', [quantity, cartItemId]);
        res.status(200).json({ message: 'อัปเดตจำนวนสินค้าสำเร็จ' });

    } catch (error) {
        console.error('Update cart item error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    }
};