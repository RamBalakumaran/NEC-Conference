import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  const isAdmin = sessionStorage.getItem('isAdmin') === 'true';

  if (!token || !isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default AdminRoute;
