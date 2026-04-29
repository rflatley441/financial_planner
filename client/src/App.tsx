import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="accounts"     element={<Accounts />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="budgets"      element={<Budgets />} />
          <Route path="goals"        element={<Goals />} />
          <Route path="settings"     element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
