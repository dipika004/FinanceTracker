import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignUp from './pages/SignUp/SignUp';
import Login from './pages/Login/Login';
import Onboarding from './pages/Onboarding/Onboarding';
import Dashboard from './pages/Dashboard/Dashboard';
import AddTransaction from './pages/AddTransaction/AddTransaction';
import Transactions from './pages/Transactions/Transactions';
import Goals from './pages/Goals/Goals';
import AddGoal from './pages/AddGoal/AddGoal';
import LandingPage from './pages/LandingPage/LandingPage';
import MainLayout from './layouts/MainLayout';
import Settings from './pages/Settings/Settings';
import AIAssistant from './pages/AiAssistant/AiAssistant';

function App() {
  return (
    
      <Routes>
        {/* 🚫 Pages WITHOUT Navbar */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* ✅ Pages WITH Navbar */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-transaction" element={<AddTransaction />} />
          <Route path="/update-transaction/:id" element={<AddTransaction />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/add-goal" element={<AddGoal />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
        </Route>
      </Routes>
    
  );
}

export default App;
