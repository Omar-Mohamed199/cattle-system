import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';

// Placeholder Pages
import Dashboard from './pages/Dashboard';
import Cows from './pages/Cows';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="cows" element={<Cows />} />

        <Route path="payments" element={<Payments />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  );
};

export default App;
