import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/ui/Header'
import { ToastProvider } from './components/ui/Toast'
import { CompareProvider, useCompare } from './context/CompareContext'
import { AuthProvider } from './context/AuthContext'
import HomePage from './pages/HomePage'
import SupplierDetailPage from './pages/SupplierDetailPage'
import SupplierFormPage from './pages/SupplierFormPage'
import ComparePage from './pages/ComparePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function AppContent() {
  const { ids } = useCompare()

  return (
    <>
      <Header compareCount={ids.length} />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/suppliers/new" element={<SupplierFormPage />} />
          <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
          <Route path="/suppliers/:id/edit" element={<SupplierFormPage />} />
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <CompareProvider>
            <AppContent />
          </CompareProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}