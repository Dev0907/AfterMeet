
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import TeamsList from './pages/TeamsList';
import TeamMeetings from './pages/TeamMeetings';
import MeetingDetail from './pages/MeetingDetail';
import MeetingAnalytics from './pages/MeetingAnalytics';
import JoinTeam from './pages/JoinTeam';
import LandingPage from './pages/LandingPage';
import KanbanPage from './pages/KanbanPage';
import TeamCalendarPage from './pages/TeamCalendarPage';

import ProtectedRoute from './components/ProtectedRoute';

// Smart redirect: if logged in, go to teams; otherwise show landing
const HomeRedirect = () => {
  const isLoggedIn = localStorage.getItem('userId');
  return isLoggedIn ? <Navigate to="/teams" replace /> : <LandingPage />;
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

        {/* Teams-based navigation (Main App) */}
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
        <Route path="/teams/:teamId/kanban" element={
          <ProtectedRoute>
            <KanbanPage />
          </ProtectedRoute>
        } />
        <Route path="/teams/:teamId/kanban/team" element={
          <ProtectedRoute>
            <KanbanPage />
          </ProtectedRoute>
        } />
        <Route path="/teams/:teamId/members/:memberId/kanban" element={
          <ProtectedRoute>
            <KanbanPage />
          </ProtectedRoute>
        } />
        <Route path="/teams/:teamId/calendar" element={
          <ProtectedRoute>
            <TeamCalendarPage />
          </ProtectedRoute>
        } />

        {/* Legacy/Redirects */}
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="/dashboard" element={<Navigate to="/teams" replace />} />
        <Route path="/meetings" element={<Navigate to="/teams" replace />} />
        <Route path="/meetings/:meetingId" element={<Navigate to="/teams" replace />} />
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </div>
  );
}

export default App;
