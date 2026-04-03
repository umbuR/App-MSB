/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TransaksiList from './pages/TransaksiList';
import TransaksiForm from './pages/TransaksiForm';
import AngsuranDetail from './pages/AngsuranDetail';
import PembayaranForm from './pages/PembayaranForm';
import StortingPage from './pages/StortingPage';
import LoginPage from './pages/LoginPage';
import ManageUsers from './pages/ManageUsers';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="transaksi" element={<TransaksiList />} />
        <Route path="transaksi/:id" element={<AngsuranDetail />} />
        <Route path="pencairan" element={<TransaksiForm />} />
        <Route path="pembayaran/:id" element={<PembayaranForm />} />
        <Route path="storting" element={<StortingPage />} />
        <Route path="pegawai" element={<ManageUsers />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}



