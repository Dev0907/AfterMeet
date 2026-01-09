
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    // Check if user is authenticated (using userId or token from localStorage)
    const isAuthenticated = localStorage.getItem('userId');

    if (!isAuthenticated) {
        // If not authenticated, redirect to login page
        return <Navigate to="/signin" replace />;
    }

    return children;
};

export default ProtectedRoute;
