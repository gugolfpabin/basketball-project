// src/components/Layout.jsx
import React from 'react';
import Navbar from './Navbar'; // Import Navbar ที่เราสร้างไว้

// Layout Component จะรับ 'children' ซึ่งก็คือเนื้อหาของแต่ละหน้า
export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      {/* ส่วน main นี้จะแสดงเนื้อหาของแต่ละหน้าที่ถูกส่งเข้ามา */}
      <main className="flex-grow">
        {children}
      </main>

      {/* คุณสามารถเพิ่ม Footer ที่นี่ได้ในอนาคต */}
      {/* <footer className="bg-gray-800 text-white p-4 text-center">
        © 2025 Basketball Shop
      </footer> */}
    </div>
  );
}