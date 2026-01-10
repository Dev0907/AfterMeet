
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import TeamsList from './pages/TeamsList';
import TeamMeetings from './pages/TeamMeetings';
import MeetingDetail from './pages/MeetingDetail';
import MeetingAnalytics from './pages/MeetingAnalytics';
import JoinTeam from './pages/JoinTeam';

import ProtectedRoute from './components/ProtectedRoute';

// Smart redirect: if logged in, go to teams; otherwise signin
const HomeRedirect = () => {
  const isLoggedIn = localStorage.getItem('userId');
  return <Navigate to={isLoggedIn ? '/teams' : '/signin'} replace />;
};

function App() {
  return (
    <div className="font-sans antialiased text-black">
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />

        {/* Join team via invite code */}
        <Route path="/join" element={<JoinTeam />} />
        <Route path="/join/:inviteCode" element={<JoinTeam />} />

        {/* Teams-based navigation */}
        <Route path="/teams" element={
          <ProtectedRoute>
            <TeamsList />
          </ProtectedRoute>
        } />
        <Route path="/teams/:teamId/meetings" element={
          <ProtectedRoute>
            <TeamMeetings />
          </ProtectedRoute>
        } />
        <Route path="/teams/:teamId/meetings/:meetingId" element={
          <ProtectedRoute>
            <MeetingDetail />
          </ProtectedRoute>
        } />
        <Route path="/teams/:teamId/meetings/:meetingId/analytics" element={
          <ProtectedRoute>
            <MeetingAnalytics />
          </ProtectedRoute>
        } />

        {/* Legacy routes redirect to teams */}
        <Route path="/landing" element={<Navigate to="/teams" replace />} />
        <Route path="/meetings" element={<Navigate to="/teams" replace />} />
        <Route path="/meetings/:meetingId" element={<Navigate to="/teams" replace />} />
      </Routes>
    </div>
  );
}

export default App;
