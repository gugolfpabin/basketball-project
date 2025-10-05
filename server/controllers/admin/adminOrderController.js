// server/controllers/orderController.js
const db = require('../../db');


exports.getAllOrders = async (req, res) => {
    try {
        const { status, startDate, endDate, page = 1 } = req.query;
        const limit = 50;
        const offset = (page - 1) * limit;

        let where = 'WHERE 1=1';
        const params = [];
        if (status) {
            where += ' AND o.Status = ?';
            params.push(status);
        }
        if (startDate && endDate) {
            where += ' AND o.CreatedAt BETWEEN ? AND ?';
            params.push(startDate, `${endDate} 23:59:59`);
        }

        const sql = `
            SELECT o.Order_ID, m.FirstName, m.LastName, o.TotalPrice, o.Status, o.CreatedAt,
                   COALESCE(SUM(od.Quantity * od.UnitCost),0) as totalCost,
                   COUNT(od.Quantity) as itemCount
            FROM \`orders\` o
            JOIN \`member\` m ON o.Member_ID = m.Member_ID
            LEFT JOIN \`orderdetails\` od ON o.Order_ID = od.Order_ID
            ${where}
            GROUP BY o.Order_ID
            ORDER BY o.CreatedAt DESC
            LIMIT ? OFFSET ?
        `;
        params.push(limit, offset);

        const [orders] = await db.query(sql, params);

        res.status(200).json(orders);

    } catch (error) {
        console.error("Get all orders error:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    }
};



exports.getOrderById = async (req, res) => {
    const { orderId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const [orderRows] = await connection.query(
            `SELECT 
                o.*,m.Title, m.FirstName, m.LastName, m.Email, m.Phone, m.Address,
                s.SubdistrictName, s.PostalCode, d.DistrictName, p.ProvinceName
             FROM \`orders\` o
             JOIN \`member\` m ON o.Member_ID = m.Member_ID
             LEFT JOIN \`subdistrict\` s ON m.Subdistrict_ID = s.Subdistrict_ID
             LEFT JOIN \`district\` d ON s.District_ID = d.District_ID
             LEFT JOIN \`province\` p ON d.Province_ID = p.Province_ID
             WHERE o.Order_ID = ?`,
            [orderId]
        );
      

        if (orderRows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบออเดอร์' });
        }
        const order = orderRows[0];

        const [detailRows] = await connection.query(
            `SELECT 
                od.Quantity, od.UnitPrice, od.UnitCost,
                p.ProductName, 
                pv.color, pv.size, 
                (SELECT PictureURL FROM picture pi 
                 WHERE pi.Product_ID = p.Product_ID AND pi.Color = pv.color AND ImageType = 'front' 
                 LIMIT 1) as PictureURL
             FROM \`orderdetails\` od
             JOIN \`product_variants\` pv ON od.Variant_ID = pv.Variant_ID
             JOIN \`product\` p ON pv.Product_ID = p.Product_ID
             WHERE od.Order_ID = ?`,
            [orderId]
        );
        order.details = detailRows;
        
        res.status(200).json(order);
    } catch (error) {
        console.error("Get order by id error:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    } finally {
        if (connection) connection.release();
    }
};


exports.updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status: newStatus, adminNotes } = req.body;

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [orders] = await connection.query('SELECT * FROM `orders` WHERE Order_ID = ? FOR UPDATE', [orderId]);
        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'ไม่พบออเดอร์' });
        }
        const oldStatus = orders[0].Status;


        // ถ้าสถานะเดิม "ยังไม่ถูกยกเลิก" และสถานะใหม่ "คือยกเลิก"
        if (oldStatus !== 'cancelled' && newStatus === 'cancelled') {
            const [orderDetails] = await connection.query('SELECT * FROM `orderdetails` WHERE Order_ID = ?', [orderId]);
            for (const item of orderDetails) {
                await connection.query(
                    'UPDATE product_variants SET Stock = Stock + ? WHERE Variant_ID = ?',
                    [item.Quantity, item.Variant_ID]
                );
            }
        }

        // อัปเดตสถานะและหมายเหตุ
        await connection.query(
            'UPDATE `orders` SET Status = ?, AdminNotes = ? WHERE Order_ID = ?',
            [newStatus, adminNotes, orderId]
        );
        
        await connection.commit();
        res.status(200).json({ message: 'อัปเดตสถานะออเดอร์สำเร็จ' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Update order status error:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    } finally {
        if (connection) connection.release();
    }
};
