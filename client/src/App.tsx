import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout      from './components/Layout'
import Auth        from './pages/Auth'
import Dashboard   from './pages/Dashboard'
import Accounts    from './pages/Accounts'
import Transactions from './pages/Transactions'
import Budgets     from './pages/Budgets'
import Goals       from './pages/Goals'
import Settings    from './pages/Settings'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*"    element={<Navigate to="/auth" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index              element={<Dashboard />} />
        <Route path="accounts"   element={<Accounts />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="budgets"    element={<Budgets />} />
        <Route path="goals"      element={<Goals />} />
        <Route path="settings"   element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
