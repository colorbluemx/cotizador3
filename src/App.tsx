import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DashboardHome from './pages/DashboardHome'
import CompanySetup from './pages/CompanySetup'
import Clients from './pages/Clients'
import ClientForm from './pages/ClientForm'
import Products from './pages/Products'
import ProductForm from './pages/ProductForm'
import Quotes from './pages/Quotes'
import QuoteEditor from './pages/QuoteEditor'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) return <div className="min-h-screen flex items-center justify-center text-primary">Loading...</div>

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function RequireCompany({ children }: { children: React.ReactNode }) {
  const { company, loading } = useAuth()
  if (loading) return null
  if (!company) return <Navigate to="/company-setup" replace />
  return <>{children}</>
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/company-setup"
          element={
            <ProtectedRoute>
              <CompanySetup />
            </ProtectedRoute>
          }
        />

        {/* Dashboard & Nested Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <RequireCompany>
                <Dashboard />
              </RequireCompany>
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />

          <Route path="quotes" element={<Quotes />} />
          <Route path="quotes/new" element={<QuoteEditor />} />
          <Route path="quotes/:id" element={<QuoteEditor />} />

          <Route path="clients" element={<Clients />} />
          <Route path="clients/new" element={<ClientForm />} />
          <Route path="clients/:id" element={<ClientForm />} />

          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id" element={<ProductForm />} />

          <Route path="settings" element={<div className="p-8">Settings (Coming Soon)</div>} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
