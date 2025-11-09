import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Feed } from './pages/Feed';
import { Upload } from './pages/Upload';
import { Profile } from './pages/Profile';
import { Verify } from './pages/Verify';
import { Milestones } from './pages/Milestones';
import { Settings } from './pages/Settings';
import { EventFeed } from './pages/EventFeed';
import { EventDetail } from './pages/EventDetail';
import { OrganizerDashboard } from './pages/OrganizerDashboard';
import { AdminPanel } from './pages/AdminPanel';
import { FloatingJoinButton } from './components/FloatingJoinButton';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // In a real app, check authentication status
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user?.is_admin) {
    return <Navigate to="/feed" replace />;
  }
  return <>{children}</>;
}

function OrganizerRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user?.is_organizer && !user?.is_admin) {
    return <Navigate to="/feed" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <Feed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <EventFeed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:id"
              element={
                <ProtectedRoute>
                  <EventDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizer"
              element={
                <OrganizerRoute>
                  <OrganizerDashboard />
                </OrganizerRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:id"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/verify"
              element={
                <ProtectedRoute>
                  <Verify />
                </ProtectedRoute>
              }
            />
            <Route
              path="/milestones"
              element={
                <ProtectedRoute>
                  <Milestones />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rewards"
              element={<Navigate to="/milestones" replace />}
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <FloatingJoinButton />
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;

