import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Today from './pages/Today';
import Progress from './pages/Progress';
import Journal from './pages/Journal';
import Wins from './pages/Wins';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoadingProvider, useLoading } from './contexts/LoadingContext';

function AppContent() {
  const location = useLocation();
  const { isInitialLoad, setInitialLoadComplete } = useLoading();
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    // Check if we're restoring from a reload (login, restore ID, etc.)
    const restoring = sessionStorage.getItem('isRestoring');
    if (restoring === 'true') {
      sessionStorage.removeItem('isRestoring');
      // Only show loading screen on home route during restore
      // For other routes, just ensure they're available immediately
      if (location.pathname === '/') {
        setIsRestoring(true);
        // Give a bit more time for restore operations on home route
        const timer = setTimeout(() => {
          setIsRestoring(false);
        }, 800);
        return () => clearTimeout(timer);
      } else {
        // On non-home routes, mark load complete immediately and skip loading screen
        setInitialLoadComplete();
      }
    }
  }, [location.pathname, setInitialLoadComplete]);

  // If user is not on the home route, mark initial load as complete immediately
  // This prevents the loading screen from sticking if they navigate directly to another route
  // Also ensures routes are available immediately after reload on non-home routes
  useEffect(() => {
    if (location.pathname !== '/' && isInitialLoad) {
      setInitialLoadComplete();
    }
  }, [location.pathname, isInitialLoad, setInitialLoadComplete]);

  // Show loading screen if:
  // 1. We're on the home route (Today) and initial load isn't complete, OR
  // 2. We're restoring from a reload AND on the home route
  const isLoading = (location.pathname === '/' && isInitialLoad) || (isRestoring && location.pathname === '/');

  return (
    <>
      {isLoading && <LoadingScreen />}
      {/* Always render routes to ensure React Router can match them, even during loading */}
      {/* Use visibility instead of opacity to ensure routes are matched by React Router */}
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isLoading ? 'invisible' : 'visible transition-opacity duration-300'}`}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/wins" element={<Wins />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </>
  );
}

function App() {

  return (
    <ThemeProvider>
      <LoadingProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppContent />
        </BrowserRouter>
      </LoadingProvider>
    </ThemeProvider>
  );
}

export default App;

