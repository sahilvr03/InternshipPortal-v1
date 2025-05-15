'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Wait until the auth context finishes loading
    if (!loading) {
      // Check if user is logged in
      if (!user) {
        router.push('/Login');
        return;
      }
      
      // Check if admin-only route and user is not admin
      if (adminOnly && !isAdmin) {
        router.push('/pages/Student');
        return;
      }
      
      // User is authenticated and authorized
      setAuthorized(true);
    }
  }, [user, loading, router, adminOnly, isAdmin]);

  // Show loading state while checking authorization
  if (loading || !authorized) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return children;
}