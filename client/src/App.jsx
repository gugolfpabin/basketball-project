import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


import Home from './Home.jsx';
import Register from './components/Register.jsx'; 
import Login from './components/login.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AddProductPage from './pages/AddProductPage.jsx';
import EditProductPage from './pages/EditProductPage.jsx';
import CartPage from './pages/CartPage';
import ManualPaymentPage from './pages/ManualPaymentPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes (เข้าถึงได้ทุกคน) */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
   {/* User */}
        
        <Route path="/product/:id" element={<ProductDetailPage />} /> 
       <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
       <Route path="/cart" element={<CartPage />} />
       <Route path="/manual-payment" element={<ManualPaymentPage />} />
    
        {/* Protected Routes (เฉพาะ Admin) */}
        <Route element={<ProtectedRoute allowedRoles={['1']} />}>
          <Route path="/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/products/add" element={<AddProductPage />} />
          <Route path="/admin/products/edit/:id/variant/:variantId" element={<EditProductPage />} />

        </Route>
       
        
      </Routes>
    </Router>
  );
}
export default App;