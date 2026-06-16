import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Master from './pages/Master/Master';

import Ontime from './pages/On Time/Ontime';
import Dashboard from './pages/Dashboard/Dashboard';
import OrderHistory from './pages/Order/OrderHistory';
import DumpPage from './pages/Order/DumpPage';
import MetalIssue from './pages/MetalIssue/MetalIssue';
import FollowUp from './pages/FollowUp/FollowUp';
import QC1 from './pages/QC1/QC1';
import GhatJama from './pages/GhatJama/GhatJama';
import MeenaInhouse from './pages/MeenaInhouse/MeenaInhouse';
import MeenaOutside from './pages/MeenaOutside/MeenaOutside';
import MeenaSubmit from './pages/MeenaCheckSubmit/MeenaSubmit';
import PolishInhouse from './pages/PolishInhouse/PolishInhouse';
import PolishOutside from './pages/PolishOutside/PolishOutside';
import PolishSubmit from './pages/PolishCheckSubmit/PolishSubmit';
import BanglePolish from './pages/BanglePolish/BanglePolish';
import EPolish from './pages/EPolish/EPolish';
import QC2 from './pages/QC2/QC2';
import DispatchDepartment from './pages/DispatchDeparstment/Dispatch';
import ReceiptDepartment from './pages/ReceiptDepartment/Receipt';
import QC3 from './pages/QC3/QC3';
import HuidLabel from './pages/Huid/Label/Label';
import ReceivedInStock from './pages/ReceiveInStock/ReceiveInStock';
import Delivery from './pages/Delivery/Delivery';
import TatSetup from './pages/TatSetup/TatSetup';

import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';

const IndexRedirect = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/dashboard" replace />;
  if (user.accessPages && user.accessPages.length > 0) {
    return <Navigate to={user.accessPages[0]} replace />;
  }
  return <Navigate to="/order-history" replace />;
};

function App() {
  useEffect(() => {
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<IndexRedirect />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="on-time" element={<Ontime />} />
            <Route path="settings" element={<Settings />} />
            <Route path="master" element={<Master />} />

            <Route path="order-history" element={<OrderHistory />} />
            <Route path="dump-order" element={<DumpPage />} />
            <Route path="metal-issue" element={<MetalIssue />} />
            <Route path="follow-up" element={<FollowUp />} />
            <Route path="qc1" element={<QC1 />} />
            <Route path="ghat-jama" element={<GhatJama />} />
            <Route path="meena-inhouse" element={<MeenaInhouse />} />
            <Route path="meena-outside" element={<MeenaOutside />} />
            <Route path="meena-submit" element={<MeenaSubmit />} />
            <Route path="polish-inhouse" element={<PolishInhouse />} />
            <Route path="polish-outside" element={<PolishOutside />} />
            <Route path="polish-submit" element={<PolishSubmit />} />
            <Route path="bangle-polish" element={<BanglePolish />} />
            <Route path="e-polish" element={<EPolish />} />
            <Route path="qc2" element={<QC2 />} />
            <Route path="dispatch" element={<DispatchDepartment />} />
            <Route path="receipt" element={<ReceiptDepartment />} />
            <Route path="qc3" element={<QC3 />} />
            <Route path="huid-label" element={<HuidLabel />} />
            <Route path="receive-in-stock" element={<ReceivedInStock />} />
            <Route path="delivery" element={<Delivery />} />
            <Route path="tat-setup" element={<TatSetup />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;