"use client";
import { useState, useEffect } from 'react';
import { useAuth, axiosInstance } from '../../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

export default function StudentRequests() {
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [pendingStudents, setPendingStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, isAdmin, user, authLoading });
    if (authLoading) {
      return;
    }
    if (!isAuthenticated || !isAdmin) {
      console.warn('Access denied:', { isAuthenticated, isAdmin });
      setError('You must be logged in as an admin to view this page.');
      setLoading(false);
      return;
    }

    const fetchPendingStudents = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found.');
        }
        const url = `${process.env.NEXT_PUBLIC_URL}/api/student/pending-students`;
        console.log('Fetching from:', url);
        const response = await axiosInstance.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Pending students response:', response.data);
        setPendingStudents(response.data);
      } catch (err) {
        console.error('Error fetching pending students:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          url: err.config?.url,
        });
        setError(err.response?.data?.error || 'Failed to fetch pending students. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingStudents();
  }, [isAuthenticated, isAdmin, authLoading]);

  const handleAccept = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      await axiosInstance.post(`/api/student/pending-students/${studentId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingStudents(pendingStudents.filter((student) => student._id !== studentId));
      toast.success('Student approved successfully!');
    } catch (err) {
      console.error('Error accepting student:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      toast.error(err.response?.data?.error || 'Failed to approve student');
    }
  };

  const handleReject = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      await axiosInstance.post(`/api/student/pending-students/${studentId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingStudents(pendingStudents.filter((student) => student._id !== studentId));
      toast.success('Student request rejected successfully!');
    } catch (err) {
      console.error('Error rejecting student:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      toast.error(err.response?.data?.error || 'Failed to reject student');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Pending Student Requests</h1>
        {loading ? (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p>{error}</p>
          </div>
        ) : pendingStudents.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-600">No pending student requests.</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">University</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LinkedIn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingStudents.map((student) => (
                  <tr key={student._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.program || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.university || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.domain || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.weeks} weeks</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <a href={student.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Profile
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleAccept(student._id)}
                        className="text-green-600 hover:text-green-800 mr-4"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(student._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}