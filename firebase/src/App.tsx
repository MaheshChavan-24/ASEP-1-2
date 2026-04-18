import { AuthProvider, useAuth } from './hooks/useAuth';
import LandingPage from './pages/landing/LandingPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function AppContent() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <LandingPage />;
  return <div className="p-8">Welcome, {user.email}</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
