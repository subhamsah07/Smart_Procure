import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyOTP } from './pages/VerifyOTP';
import { FarmerLayout } from './components/farmer/FarmerLayout';
import { FarmerDashboard } from './pages/farmer/FarmerDashboard';
import { FindCentre } from './pages/farmer/FindCentre';
import { BookSlot } from './pages/farmer/BookSlot';
import { TrackToken } from './pages/farmer/TrackToken';
import { ProcurementHistory } from './pages/farmer/History';
import { NotificationsPage } from './pages/farmer/NotificationsPage';
import { SettingsPage } from './pages/farmer/Settings';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Admin System Pages and Components (Task 6)
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminCentres } from './pages/admin/AdminCentres';
import { AdminRequests } from './pages/admin/AdminRequests';
import { AdminRequestDetail } from './pages/admin/AdminRequestDetail';
import { AdminQueue } from './pages/admin/AdminQueue';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminCropPrices } from './pages/admin/AdminCropPrices';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminProtectedRoute } from './components/admin/AdminProtectedRoute';
import { AdminLayout } from './components/admin/AdminLayout';

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/farmer/verify-otp" element={<VerifyOTP />} />

      {/* Admin Authentication Route */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin Protected Routes (/admin/*) with Strict State Boundary Isolation */}
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/centres"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminCentres />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/requests"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminRequests />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/requests/:id"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminRequestDetail />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/queue"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminQueue />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminPayments />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/crop-prices"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminCropPrices />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminNotifications />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminSettings />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />

      {/* Primary Protected Farmer Routes (/farmer/*) */}
      <Route
        path="/farmer"
        element={
          <ProtectedRoute>
            <FarmerLayout>
              <FarmerDashboard />
            </FarmerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/booking"
        element={
          <ProtectedRoute>
            <FarmerLayout>
              <BookSlot />
            </FarmerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/book"
        element={
          <ProtectedRoute>
            <FarmerLayout>
              <BookSlot />
            </FarmerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/token"
        element={
          <ProtectedRoute>
            <FarmerLayout>
              <TrackToken />
            </FarmerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/track"
        element={
          <ProtectedRoute>
            <FarmerLayout>
              <TrackToken />
            </FarmerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/history"
        element={
          <ProtectedRoute>
            <FarmerLayout>
              <ProcurementHistory />
            </FarmerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/centres"
        element={
          <ProtectedRoute>
            <FarmerLayout>
              <FindCentre />
            </FarmerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/notifications"
        element={
          <ProtectedRoute>
            <FarmerLayout>
              <NotificationsPage />
            </FarmerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmer/settings"
        element={
          <ProtectedRoute>
            <FarmerLayout>
              <SettingsPage />
            </FarmerLayout>
          </ProtectedRoute>
        }
      />

      {/* Backward-Compatible Dashboard Routes (/dashboard/*) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <FarmerLayout>
              <FarmerDashboard />
            </FarmerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/centres"
        element={
          <ProtectedRoute>
            <FarmerLayout>
              <FindCentre />
            </FarmerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/book"
        element={
          <ProtectedRoute>
            <FarmerLayout>
              <BookSlot />
            </FarmerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/track"
        element={
          <ProtectedRoute>
            <FarmerLayout>
              <TrackToken />
            </FarmerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/history"
        element={
          <ProtectedRoute>
            <FarmerLayout>
              <ProcurementHistory />
            </FarmerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/notifications"
        element={
          <ProtectedRoute>
            <FarmerLayout>
              <NotificationsPage />
            </FarmerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/settings"
        element={
          <ProtectedRoute>
            <FarmerLayout>
              <SettingsPage />
            </FarmerLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
