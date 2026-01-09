
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import Landing from './pages/Landing';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div className="font-sans antialiased text-black">
      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/landing" element={
          <ProtectedRoute>
            <Landing />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;
