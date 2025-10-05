const db = require('../../db'); 

exports.getSalesReport = async (req, res) => {
    try {
        const { granularity = 'month', startDate, endDate } = req.query;

        // --- สร้างส่วนของ SQL Query แบบไดนามิก ---
        let selectClause, groupByClause;

        switch (granularity) {
            case 'day':
                selectClause = "DATE_FORMAT(o.CreatedAt, '%Y-%m-%d') as date";
                groupByClause = "GROUP BY DATE_FORMAT(o.CreatedAt, '%Y-%m-%d')";
                break;
            case 'year':
                selectClause = "YEAR(o.CreatedAt) as date";
                groupByClause = "GROUP BY YEAR(o.CreatedAt)";
                break;
            case 'month':
            default:
                selectClause = "DATE_FORMAT(o.CreatedAt, '%Y-%m') as date";
                groupByClause = "GROUP BY DATE_FORMAT(o.CreatedAt, '%Y-%m')";
                break;
        }

    let whereClause = "WHERE o.Status = 'completed'";
        const params = [];

        if (startDate && endDate) {
            whereClause += " AND CreatedAt BETWEEN ? AND ?";
            // เพิ่มเวลา 23:59:59 เพื่อให้รวมข้อมูลของวันสุดท้ายทั้งวัน
            params.push(startDate, `${endDate} 23:59:59`); 
        }
        
        const sql = `
            SELECT
                ${selectClause},
                COALESCE(SUM(od.Quantity * od.UnitPrice), 0) as totalSales,
                COALESCE(SUM(od.Quantity * od.UnitCost), 0) as totalCost,
                COALESCE(SUM(od.Quantity * od.UnitPrice),0) - COALESCE(SUM(od.Quantity * od.UnitCost),0) as totalProfit,
                COUNT(DISTINCT o.Order_ID) as orderCount
            FROM \`orders\` o
            JOIN \`orderdetails\` od ON o.Order_ID = od.Order_ID
            ${whereClause}
            ${groupByClause}
            ORDER BY date ASC
        `;

        const [reportData] = await db.query(sql, params);
        
        // --- product breakdown per period ---
        const productSql = `
            SELECT
                ${selectClause},
                p.Product_ID,
                p.ProductName,
                COALESCE(SUM(od.Quantity),0) as qtySold,
                COALESCE(SUM(od.Quantity * od.UnitPrice),0) as sales,
                COALESCE(SUM(od.Quantity * od.UnitCost),0) as cost
            FROM \`orders\` o
            JOIN \`orderdetails\` od ON o.Order_ID = od.Order_ID
            JOIN \`product\` p ON od.Variant_ID = (SELECT Variant_ID FROM product_variants pv WHERE pv.Variant_ID = od.Variant_ID LIMIT 1)
            ${whereClause}
            GROUP BY date, p.Product_ID, p.ProductName
            ORDER BY date ASC, qtySold DESC
        `;

        const [productBreakdown] = await db.query(productSql, params);

        res.status(200).json({ reportData, productBreakdown });

    } catch (error) {
        console.error("Get sales report error:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    }
};