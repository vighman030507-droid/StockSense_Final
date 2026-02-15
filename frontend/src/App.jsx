import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Components from './pages/Components';
import PCBs from './pages/PCBs';
import Production from './pages/Production';
import Analytics from './pages/Analytics';
import ExcelManagement from './pages/ExcelManagement';
import Procurement from './pages/Procurement';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="flex min-h-screen bg-gray-100">
                  <Sidebar />
                  <div className="flex-1 flex flex-col">
                    <Navbar />
                    <main className="flex-1 p-6 overflow-y-auto">
                      <Routes>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/components" element={<Components />} />
                        <Route path="/pcbs" element={<PCBs />} />
                        <Route path="/production" element={<Production />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/excel" element={<ExcelManagement />} />
                        <Route path="/procurement" element={<Procurement />} />
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
