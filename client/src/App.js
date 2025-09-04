import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


import Home from './Home';
import Register from './components/Register.jsx'; 
import Login from './components/login.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout';

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

        <Route path="/product/:id" element={<ProductDetailPage />} /> 
        
       

  
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