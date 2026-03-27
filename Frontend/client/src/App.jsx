import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
     <Routes>
        <Route 
          path="/" 
          element={
            !user ? <Landing onLoginSuccess={setUser} /> 
                  : (user.onboardingComplete ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />)
          } 
        />

        {/* UPDATED: Let all logged-in users access onboarding to see their summary! */}
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
      </Routes>
    </Router>
  );
}