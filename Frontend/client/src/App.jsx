import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthScreen from './components/AuthScreen';
import Dashboard from './pages/Dashboard';

export default function App() {
  // Global user state
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        
        {/* Route 1: The Gatekeeper (Auth/Landing) */}
        <Route 
          path="/" 
          element={!user ? <AuthScreen onLoginSuccess={setUser} /> : <Navigate to="/dashboard" />} 
        />

        {/* Route 2: The Co-Pilot Dashboard */}
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/" />} 
        />

        {/* Future Route: Financial Navigator, etc. */}
        {/* <Route path="/navigator" element={<Navigator />} /> */}

      </Routes>
    </Router>
  );
}