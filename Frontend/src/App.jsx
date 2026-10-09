import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import OrganicBackground from './components/OrganicBackground';

// Pages
import Login from './pages/Login';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Consultations from './pages/Consultations';

// Layout wrapper for authenticated pages
function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col relative pb-12">
      <OrganicBackground />
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#FEFEFA',
            color: '#2C2C24',
            border: '1px solid #DED8CF',
            borderRadius: '1.25rem',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 10px 30px -5px rgba(93, 112, 82, 0.15)',
            fontFamily: 'Nunito, sans-serif',
          },
          success: {
            iconTheme: {
              primary: '#5D7052',
              secondary: '#F3F4F1',
            },
          },
          error: {
            iconTheme: {
              primary: '#A85448',
              secondary: '#F8ECE9',
            },
          },
        }}
      />

      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Patients />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Appointments />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/consultations"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Consultations />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Root Redirect to /patients */}
        <Route path="/" element={<Navigate to="/patients" replace />} />

        {/* Fallback 404 Route */}
        <Route path="*" element={<Navigate to="/patients" replace />} />
      </Routes>
    </>
  );
}
