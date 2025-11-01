// const db = require('../../db'); 
// // 1. เพิ่ม date-fns เพื่อช่วยจัดการวันที่
// const { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } = require('date-fns');

// exports.getSalesReport = async (req, res) => {
//     try {
//         // 2. รับค่าแบบใหม่
//         const { filterMode = 'month', selectedDate, categoryId } = req.query;
        
//         let selectClause, groupByClause;
//         let whereClause = "WHERE o.Status = 'completed'";
//         const params = [];

//         // 3. สร้าง Date Range จาก FilterMode และ SelectedDate
//         // ถ้า selectedDate ไม่ได้ส่งมา ให้ใช้ new Date() เป็นค่าเริ่มต้น
//         const date = selectedDate ? parseISO(selectedDate) : new Date();

//         if (filterMode === 'day') {
//             // กราฟ: รายชั่วโมง
//             selectClause = "HOUR(o.CreatedAt) as date";
//             groupByClause = "GROUP BY HOUR(o.CreatedAt)";
//             // ข้อมูลทั้งหมด: ภายในวันนั้น
//             whereClause += " AND o.CreatedAt BETWEEN ? AND ?";
//             params.push(startOfDay(date), endOfDay(date));
//         } else if (filterMode === 'year') {
//             // กราฟ: รายเดือน
//             selectClause = "DATE_FORMAT(o.CreatedAt, '%Y-%m') as date";
//             groupByClause = "GROUP BY DATE_FORMAT(o.CreatedAt, '%Y-%m')";
//             // ข้อมูลทั้งหมด: ภายในปีนั้น
//             whereClause += " AND o.CreatedAt BETWEEN ? AND ?";
//             params.push(startOfYear(date), endOfYear(date));
//         } else { // default to 'month'
//             // กราฟ: รายวัน
//             selectClause = "DATE_FORMAT(o.CreatedAt, '%Y-%m-%d') as date";
//             groupByClause = "GROUP BY DATE_FORMAT(o.CreatedAt, '%Y-%m-%d')";
//             // ข้อมูลทั้งหมด: ภายในเดือนนั้น
//             whereClause += " AND o.CreatedAt BETWEEN ? AND ?";
//             params.push(startOfMonth(date), endOfMonth(date));
//         }

//         // 4. สร้าง Joins (เหมือนเดิม)
//         const baseJoins = `
//             FROM \`orders\` o
//             JOIN \`orderdetails\` od ON o.Order_ID = od.Order_ID
//             JOIN \`product_variants\` pv ON od.Variant_ID = pv.Variant_ID
//             JOIN \`product\` p ON pv.Product_ID = p.Product_ID
//         `;
        
//         // 5. เพิ่มการกรอง Category (เหมือนเดิม)
//         if (categoryId && categoryId !== 'all') {
//             whereClause += " AND p.Category_ID = ?";
//             params.push(categoryId);
//         }
        
//         // --- 1. Sales Report (สำหรับกราฟ) ---
//         // (Query นี้จะใช้ params ที่สร้างจาก filterMode)
//         const sql = `
//             SELECT
//                 ${selectClause},
//                 COALESCE(SUM(od.Quantity * od.UnitPrice), 0) as totalSales,
//                 COALESCE(SUM(od.Quantity * od.UnitCost), 0) as totalCost,
//                 COALESCE(SUM(od.Quantity * od.UnitPrice),0) - COALESCE(SUM(od.Quantity * od.UnitCost),0) as totalProfit,
//                 COUNT(DISTINCT o.Order_ID) as orderCount
//             ${baseJoins}
//             ${whereClause}
//             ${groupByClause}
//             ORDER BY date ASC
//         `;
//         const [reportData] = await db.query(sql, params);
        
//         // --- 2. Top Selling Products (สำหรับตารางสินค้าขายดี และ KPI) ---
//         // (Query นี้จะใช้ params ที่สร้างจาก filterMode)
//         const topProductsSql = `
//             SELECT
//                 p.Product_ID,
//                 p.ProductName,
//                 c.CategoryName,
//                 COALESCE(SUM(od.Quantity),0) as totalQtySold,
//                 COALESCE(SUM(od.Quantity * od.UnitPrice),0) as totalSales,
//                 COALESCE(SUM(od.Quantity * od.UnitCost),0) as totalCost,
//                 (COALESCE(SUM(od.Quantity * od.UnitPrice),0) - COALESCE(SUM(od.Quantity * od.UnitCost),0)) as totalProfit
//             ${baseJoins}
//             JOIN \`category\` c ON p.Category_ID = c.Category_ID
//             ${whereClause}
//             GROUP BY p.Product_ID, p.ProductName, c.CategoryName
//             ORDER BY totalQtySold DESC
//         `;
//         const [topProducts] = await db.query(topProductsSql, params);

//         // --- 3. Top Selling Categories (สำหรับตารางประเภทขายดี) ---
//         // (Query นี้จะใช้ params ที่สร้างจาก filterMode)
//         const topCategoriesSql = `
//             SELECT
//                 c.CategoryName,
//                 c.Category_ID,
//                 COALESCE(SUM(od.Quantity),0) as totalQtySold,
//                 COALESCE(SUM(od.Quantity * od.UnitPrice),0) as totalSales,
//                 COALESCE(SUM(od.Quantity * od.UnitCost),0) as totalCost,
//                 (COALESCE(SUM(od.Quantity * od.UnitPrice),0) - COALESCE(SUM(od.Quantity * od.UnitCost),0)) as totalProfit
//             ${baseJoins}
//             JOIN \`category\` c ON p.Category_ID = c.Category_ID
//             ${whereClause}
//             GROUP BY c.CategoryName, c.Category_ID
//             ORDER BY totalQtySold DESC
//         `;
//         const [topCategories] = await db.query(topCategoriesSql, params);


//         // (เราลบ productBreakdown ออกเพราะไม่ได้ใช้แล้ว)
//         res.status(200).json({ reportData, topProducts, topCategories });

//     } catch (error) {
//         console.error("Get sales report error:", error);
//         res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
//     }
// };
const db = require('../../db'); 
const { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } = require('date-fns');

exports.getSalesReport = async (req, res) => {
    try {
        const { filterMode = 'month', selectedDate, categoryId } = req.query;
        
        let selectClause, groupByClause;
        let whereClause = "WHERE o.Status = 'completed'";
        const params = [];

        const date = selectedDate ? parseISO(selectedDate) : new Date();

        if (filterMode === 'day') {
            selectClause = "HOUR(o.CreatedAt) as date";
            groupByClause = "GROUP BY HOUR(o.CreatedAt)";
            whereClause += " AND o.CreatedAt BETWEEN ? AND ?";
            params.push(startOfDay(date), endOfDay(date));
        } else if (filterMode === 'year') {
            selectClause = "DATE_FORMAT(o.CreatedAt, '%Y-%m') as date";
            groupByClause = "GROUP BY DATE_FORMAT(o.CreatedAt, '%Y-%m')";
            whereClause += " AND o.CreatedAt BETWEEN ? AND ?";
            params.push(startOfYear(date), endOfYear(date));
        } else { // default to 'month'
            selectClause = "DATE_FORMAT(o.CreatedAt, '%Y-%m-%d') as date";
            groupByClause = "GROUP BY DATE_FORMAT(o.CreatedAt, '%Y-%m-%d')";
            whereClause += " AND o.CreatedAt BETWEEN ? AND ?";
            params.push(startOfMonth(date), endOfMonth(date));
        }

        const baseJoins = `
            FROM \`orders\` o
            JOIN \`orderdetails\` od ON o.Order_ID = od.Order_ID
            JOIN \`product_variants\` pv ON od.Variant_ID = pv.Variant_ID
            JOIN \`product\` p ON pv.Product_ID = p.Product_ID
        `;
        
        if (categoryId && categoryId !== 'all') {
            whereClause += " AND p.Category_ID = ?";
            params.push(categoryId);
        }
        const sql = `
            SELECT
                ${selectClause},
                COALESCE(SUM(od.Quantity * od.UnitPrice), 0) as totalSales,
                COALESCE(SUM(od.Quantity * od.UnitCost), 0) as totalCost,
                COALESCE(SUM(od.Quantity * od.UnitPrice),0) - COALESCE(SUM(od.Quantity * od.UnitCost),0) as totalProfit,
                COUNT(DISTINCT o.Order_ID) as orderCount
            ${baseJoins}
            ${whereClause}
            ${groupByClause}
            ORDER BY date ASC
        `;
        const [reportData] = await db.query(sql, params);
        

        const topProductsSql = `
            SELECT
                p.Product_ID,
                p.ProductName,
                c.CategoryName,
                COALESCE(SUM(od.Quantity),0) as totalQtySold,
                COALESCE(SUM(od.Quantity * od.UnitPrice),0) as totalSales,
                COALESCE(SUM(od.Quantity * od.UnitCost),0) as totalCost,
                (COALESCE(SUM(od.Quantity * od.UnitPrice),0) - COALESCE(SUM(od.Quantity * od.UnitCost),0)) as totalProfit
            ${baseJoins}
            JOIN \`category\` c ON p.Category_ID = c.Category_ID
            ${whereClause}
            GROUP BY p.Product_ID, p.ProductName, c.CategoryName
            ORDER BY totalQtySold DESC
        `;
        const [topProducts] = await db.query(topProductsSql, params);


        res.status(200).json({ reportData, topProducts });

    } catch (error) { 
        console.error("Get sales report error:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์' });
    }
};