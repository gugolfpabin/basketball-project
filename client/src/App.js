import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


import Home from './Home';
import Register from './components/Register.jsx'; 
import Login from './components/login.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';



import TShirtsPage from './pages/TShirtsPage';
import BasketballShortsPage from './pages/BasketballShortsPage';
import BasketballShoesPage from './pages/BasketballShoesPage';
import SocksPage from './pages/SocksPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AddProductPage from './pages/AddProductPage';
import EditProductPage from './pages/EditProductPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes (เข้าถึงได้ทุกคน) */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />


         {/* Routes สำหรับหน้าหมวดหมู่สินค้า */}
        <Route path="/category/t-shirts" element={<TShirtsPage />} />
        <Route path="/category/basketball-shorts" element={<BasketballShortsPage />} />
        <Route path="/category/basketball-shoes" element={<BasketballShoesPage />} />
        <Route path="/category/socks" element={<SocksPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} /> 
        
        <Route path="/admin/products/edit/:productId/:variantId" element={<EditProductPage />} />

  <Route path="/admin/products/add" element={<AddProductPage />} />
        {/* Protected Routes (เฉพาะ Admin) */}
        <Route element={<ProtectedRoute allowedRoles={['1']} />}>
          <Route path="/dashboard" element={<AdminDashboardPage />} />
          
        </Route>
       
        
      </Routes>
    </Router>
  );
}
export default App;