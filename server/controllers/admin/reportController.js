const db = require('../../db'); 

exports.getSalesReport = async (req, res) => {
    try {
        const { granularity = 'month', startDate, endDate } = req.query;

        // --- สร้างส่วนของ SQL Query แบบไดนามิก ---
        let selectClause, groupByClause;

        switch (granularity) {
            case 'day':
                selectClause = "DATE_FORMAT(CreatedAt, '%Y-%m-%d') as date";
                groupByClause = "GROUP BY DATE_FORMAT(CreatedAt, '%Y-%m-%d')";
                break;
            case 'year':
                selectClause = "YEAR(CreatedAt) as date";
                groupByClause = "GROUP BY YEAR(CreatedAt)";
                break;
            case 'month':
            default:
                selectClause = "DATE_FORMAT(CreatedAt, '%Y-%m') as date";
                groupByClause = "GROUP BY DATE_FORMAT(CreatedAt, '%Y-%m')";
                break;
        }

        let whereClause = "WHERE Status = 'completed'";
        const params = [];

        if (startDate && endDate) {
            whereClause += " AND CreatedAt BETWEEN ? AND ?";
            // เพิ่มเวลา 23:59:59 เพื่อให้รวมข้อมูลของวันสุดท้ายทั้งวัน
            params.push(startDate, `${endDate} 23:59:59`); 
        }
        
        const sql = `
            SELECT
                ${selectClause},
                SUM(TotalPrice) as totalSales,
                COUNT(Order_ID) as orderCount
            FROM \`orders\`
            ${whereClause}
            ${groupByClause}
            ORDER BY date ASC
        `;
        
        const [reportData] = await db.query(sql, params);
        
        res.status(200).json(reportData);

    } catch (error) {
        console.error("Get sales report error:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    }
};