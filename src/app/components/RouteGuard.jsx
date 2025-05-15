'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function RouteGuard({ children, requireAdmin = false }) {
  const [authorized, setAuthorized] = useState(false);
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Authentication check function
    const authCheck = () => {
      if (loading) return; // Wait for auth to initialize
      
      if (!isAuthenticated) {
        // Not logged in, redirect to login
        setAuthorized(false);
        router.push('/Login');
      } else if (requireAdmin && user?.role !== 'admin') {
        // Admin route but not admin user
        setAuthorized(false);
        router.push('/pages/student'); // Redirect to student dashboard
      } else {
        // Authorized
        setAuthorized(true);
      }
    };

    authCheck();
  }, [loading, isAuthenticated, user, router, requireAdmin]);

  // Show loading indicator while checking auth
  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return children;
}