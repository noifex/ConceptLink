import { createBrowserRouter, Navigate } from "react-router-dom";
import Root from "./Root";
import ConceptDetail from "./ConceptDetail";
import LandingPage from "./pages/LandingPage";
import AnimationDemo from './pages/AnimationDemo';
import Registration from './components/Registration';
import { useAuth } from './contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/register" replace />;
  }

  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage
  },
  {
    path: "/animation-demo",
    Component: AnimationDemo
  },
  {
    path: "/register",
    Component: Registration
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <Root />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>左側からConceptを選択してください</div> },
      { path: "concepts/:id", Component: ConceptDetail }
    ]
  },
]);

export { router };
