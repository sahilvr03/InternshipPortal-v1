// pages/admin/registrations.js
"use client"
import { useState, useEffect } from 'react';
import Head from 'next/head';

// You might need a utility to get the auth token, e.g., from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token'); 
};

const AdminRegistrationsPage = () => {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingStudents = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError("Authentication token not found.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_UR}/registrations/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending registrations.');
      }

      const data = await response.json();
      setPendingStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingStudents();
  }, []);

  const handleRequest = async (studentId, action) => {
    if (!['approve', 'reject'].includes(action)) return;

    try {
        const token = getAuthToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_UR}/api/registrations/${action}/${studentId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to ${action} registration.`);
        }

        // Remove the student from the list on successful action
        setPendingStudents(prevStudents => prevStudents.filter(student => student._id !== studentId));

    } catch (err) {
        alert(`Error: ${err.message}`);
    }
  };


  return (
    <>
      <Head>
        <title>Admin: Manage Registrations</title>
      </Head>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Pending Registration Requests
          </h1>

          {loading && <p>Loading requests...</p>}
          {error && <p className="text-red-500">{error}</p>}
          
          {!loading && !error && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul role="list" className="divide-y divide-gray-200">
                {pendingStudents.length > 0 ? (
                  pendingStudents.map((student) => (
                    <li key={student._id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-medium text-indigo-600 truncate">{student.name}</p>
                            <p className="mt-1 flex items-center text-sm text-gray-500">{student.email}</p>
                            <p className="mt-1 text-sm text-gray-500">Username: {student.username}</p>
                          </div>
                          <div className="ml-5 flex-shrink-0 space-x-3">
                            <button
                              onClick={() => handleRequest(student._id, 'approve')}
                              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRequest(student._id, 'reject')}
                              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                    No pending registration requests.
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminRegistrationsPage;