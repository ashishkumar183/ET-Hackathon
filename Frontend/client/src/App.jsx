import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import NavBar from './components/NavBar';   

import { 
  FinancialNavigator, 
  FinancialDashboard, 
  EmptyDashboard 
} from "./pages/FinancialDashboard";

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>

      <NavBar />   {/* ✅ ADD THIS LINE */}

      <Routes>
        <Route 
          path="/" 
          element={
            !user ? <Landing onLoginSuccess={setUser} /> 
                  : (user.onboardingComplete ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />)
          } 
        />

        <Route 
          path="/onboarding" 
          element={user ? <Onboarding user={user} setUser={setUser} /> : <Navigate to="/" />} 
        />

        <Route 
          path="/dashboard" 
          element={
            user && user.onboardingComplete ? <Dashboard user={user} setUser={setUser} /> 
                                            : <Navigate to="/onboarding" />
          } 
        />

        <Route path="/navigator" element={<FinancialNavigator />} />
      </Routes>
    </Router>
  );
}