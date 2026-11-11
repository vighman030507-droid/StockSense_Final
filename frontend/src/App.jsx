import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              className: '!bg-slate-900 !text-slate-100 !border !border-slate-800 !shadow-xl !text-sm !rounded-xl',
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
                  <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
                    <Sidebar />
                    <div className="flex-1 flex flex-col min-w-0">
                      <Navbar />
                      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
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
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
