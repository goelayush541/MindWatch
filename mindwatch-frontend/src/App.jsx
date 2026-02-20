import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import MoodTracker from './pages/MoodTracker';
import Journal from './pages/Journal';
import Mindfulness from './pages/Mindfulness';
import History from './pages/History';
import VoiceTherapy from './pages/VoiceTherapy';

// Layout
import Sidebar from './components/Sidebar';

// Background blobs
const BackgroundBlobs = () => (
    <>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
    </>
);

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
    );
    if (!user) return <Navigate to="/login" replace />;
    return (
        <div className="page-wrapper">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

// Public-only route (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (user) return <Navigate to="/dashboard" replace />;
    return children;
};

function AppRoutes() {
    return (
        <>
            <BackgroundBlobs />
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                <Route path="/mood" element={<ProtectedRoute><MoodTracker /></ProtectedRoute>} />
                <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
                <Route path="/mindfulness" element={<ProtectedRoute><Mindfulness /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                <Route path="/voice-therapy" element={<ProtectedRoute><VoiceTherapy /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: 'rgba(13, 17, 23, 0.95)',
                            color: '#f0f4ff',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: 12,
                            backdropFilter: 'blur(16px)',
                            fontSize: 14
                        },
                        success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
                    }}
                />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
