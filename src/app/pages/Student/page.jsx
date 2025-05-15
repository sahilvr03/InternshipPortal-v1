'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../components/ProtectedRoute';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faTrash, faPencilAlt, faEye,
  faCheckCircle, faTimesCircle, faExclamationTriangle,
  faGraduationCap, faProjectDiagram, faClipboardList,
  faSignOutAlt, faPlus, faAngleDown, faAngleUp
} from '@fortawesome/free-solid-svg-icons';

function InternDashboard() {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progressUpdate, setProgressUpdate] = useState('');
  const [apiHealth, setApiHealth] = useState('unknown');
  const { user, logout } = useAuth();
  const router = useRouter();

  // Check API health
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        await axios.get('http://localhost:5000/health');
        setApiHealth('online');
      } catch (err) {
        console.error('API health check failed:', err);
        setApiHealth('offline');
      }
    };

    checkApiHealth();
  }, []);

  // Fetch only current logged-in student data
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user || !user.id) {
          console.log('No user ID available yet, waiting...');
          return; // Don't try to fetch data without user ID
        }

        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No auth token found');
          return; // Don't try to fetch without a token
        }

        const headers = { Authorization: `Bearer ${token}` };
        console.log('Fetching student data for ID:', user.id);

        const response = await axios.get(`http://localhost:5000/api/student/profile/${user.id}`, { headers });
        setStudentData(response.data);
        console.log('Student data retrieved successfully');
      } catch (err) {
        console.error('Error fetching student data:', err);

        if (err.response) {
          // Check if the error is due to invalid token/auth
          if (err.response.status === 401 || err.response.status === 403) {
            console.error('Authentication error, redirecting to login');
            // Don't redirect here, let ProtectedRoute handle it
          }

          setError(`Server error: ${err.response.status} - ${err.response.data?.error || 'Unknown error'}`);
        } else if (err.request) {
          setError('No response from server. Please check if the backend is running.');
        } else {
          setError(`Error: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }

      console.log('Student data:', studentData);
    };

    fetchStudentData();
  }, [user]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user || !user.id) {
        console.log('No user ID available yet, waiting...');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      console.log('Fetching student data for ID:', user.id);

      // Get student profile
      const profileResponse = await axios.get(
        `http://localhost:5000/api/student/profile/${user.id}`,
        { headers }
      );

      const studentData = profileResponse.data;

      // If there are assigned projects, fetch full project details for each
      if (studentData.assignedProjects && studentData.assignedProjects.length > 0) {
        const projectPromises = studentData.assignedProjects.map(async (projectRef) => {
          // If it's just an ID string, fetch the full project
          const projectId = typeof projectRef === 'string' ? projectRef : projectRef._id;

          try {
            const projectResponse = await axios.get(
              `http://localhost:5000/api/student/projects/${projectId}`,
              { headers }
            );
            return projectResponse.data;
          } catch (error) {
            console.error(`Error fetching project ${projectId}:`, error);
            // Return the original reference if fetch fails
            return projectRef;
          }
        });

        // Replace assignedProjects with full project details
        const projectDetails = await Promise.all(projectPromises);
        studentData.assignedProjects = projectDetails;
      }

      setStudentData(studentData);
      console.log('Student data retrieved successfully');
    } catch (err) {
      console.error('Error fetching student data:', err);

      if (err.response) {
        setError(`Server error: ${err.response.status} - ${err.response.data?.error || 'Unknown error'}`);
      } else if (err.request) {
        setError('No response from server. Please check if the backend is running.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const markFeedbackAsRead = async (projectId, feedbackId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/student/feedback/${feedbackId}/mark-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setStudentData(prevData => {
        const updatedData = { ...prevData };

        if (updatedData.projectFeedback) {
          const feedbackIndex = updatedData.projectFeedback.findIndex(
            f => f._id === feedbackId
          );

          if (feedbackIndex !== -1) {
            updatedData.projectFeedback[feedbackIndex].isRead = true;
          }
        }

        return updatedData;
      });
    } catch (error) {
      console.error('Error marking feedback as read:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateProgress = (student) => {
    // Calculate progress based on completed tasks or progress updates
    if (!student || !student.assignedProjects || student.assignedProjects.length === 0) {
      return 0;
    }

    // If there are progress updates, use those to calculate progress
    if (student.progressUpdates && student.progressUpdates.length > 0) {
      return Math.min(Math.round((student.progressUpdates.length / 10) * 100), 100);
    }

    // Otherwise check project status
    const completedProjects = student.assignedProjects.filter(
      project => project.status === 'Completed'
    ).length;

    const inProgressProjects = student.assignedProjects.filter(
      project => project.status === 'In Progress'
    ).length;

    if (student.assignedProjects.length === 0) return 0;

    return Math.round(
      ((completedProjects + (inProgressProjects * 0.5)) / student.assignedProjects.length) * 100
    );
  };

  const submitProgressUpdate = async (e) => {
    e.preventDefault();

    if (!studentData || !progressUpdate.trim()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to submit a progress update');
        return;
      }

      // Need to select the first project ID from assigned projects
      if (!studentData.assignedProjects || studentData.assignedProjects.length === 0) {
        alert('You need to have an assigned project to submit progress');
        return;
      }

      // Get the first project ID to use for progress update
      const projectId = studentData.assignedProjects[0]._id;

      setLoading(true);

      await axios.post(
        `http://localhost:5000/api/student/progress/${projectId}`,
        { content: progressUpdate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh data after posting update
      const response = await axios.get(`http://localhost:5000/api/student/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStudentData(response.data);

      setProgressUpdate('');
      alert('Progress update submitted successfully');
    } catch (err) {
      console.error('Error submitting progress update:', err);
      if (err.response) {
        alert(`Failed to submit progress: ${err.response.data?.error || 'Server error'}`);
      } else {
        alert('Failed to submit progress update. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 max-w-lg">
          <h3 className="font-bold mb-2">Error</h3>
          <p>{error}</p>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
          <div className="mt-4 p-3 bg-gray-100 rounded text-gray-700 text-sm">
            <h4 className="font-medium">Debug Information:</h4>
            <p className="mt-1">API Status: {apiHealth}</p>
            <p>Backend URL: http://localhost:5000</p>
            <p>User Role: {user ? user.role || 'Not specified' : 'Not logged in'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 relative">

      <header className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">NCAI Internship Portal</h1>
        <p className="text-gray-600">Student Dashboard</p>

        <div className="flex mt-[-39.5] justify-end">
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
            Logout
          </button>
        </div>
      </header>

      <div className="bg-white shadow-md rounded-lg p-6">
        {studentData ? (
          <div>
            <div className="border-b pb-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{studentData.name}</h2>
                  <p className="text-gray-600">{studentData.email}</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-1">
                  {studentData.role || 'Student'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Username</h3>
                <p>{studentData.username}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Last Active</h3>
                <p>{formatDate(studentData.lastActive)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Progress</h3>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 flex-grow">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${calculateProgress(studentData)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm">{calculateProgress(studentData)}%</span>
                </div>
              </div>
              
            </div>

            {/* Assigned Projects */}
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Assigned Tasks</h3>
              {studentData.assignedProjects && studentData.assignedProjects.length > 0 ? (
                <div className="space-y-3">
                  {studentData.assignedProjects.map((project) => (
                    <div key={project._id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between">
                        <h4 className="font-medium">{project.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {project.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        Start date: {formatDate(project.startDate)}
                      </div>

                      {/* Project tasks if available */}
                      {project.tasks && project.tasks.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-xs font-medium text-gray-600 mb-1">Tasks</h5>
                          <ul className="list-disc list-inside text-sm">
                            {project.tasks.map((task, index) => (
                              <li key={index}>{task.title || task}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Display project feedback if available */}
                      {project.feedback && project.feedback.length > 0 && (
                        <div className="mt-3 border-t border-gray-200 pt-3">
                          <h5 className="text-xs font-medium text-blue-600 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            Feedback from Admin
                          </h5>
                          <div className="space-y-2 mt-2 h-[353] overflow-y-scroll">
                            {project.feedback.map((feedback, idx) => (
                              <div key={idx} className="bg-blue-50 p-3 rounded text-sm">              
                                <p className="text-gray-700">{feedback.comment || feedback.content}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(feedback.date)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No projects assigned</p>
              )}
            </div>

            {/* Progress Updates */}
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Progress Updates</h3>
              {studentData.progressUpdates && studentData.progressUpdates.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {studentData.progressUpdates.map((update, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-600">
                          {formatDate(update.date || update.timestamp)}
                        </span>
                        {update.hasAdminFeedback && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Feedback Received
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{update.content || update.text}</p>

                      {/* Display admin feedback if available */}
                      {update.feedback && (
                        <div className="mt-2 border-t border-gray-200 pt-2">
                          <div className="flex items-center mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            <span className="text-xs font-medium text-blue-600">Admin Feedback:</span>
                          </div>
                          <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded">{update.feedback}</p>
                          {update.feedbackDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              Provided on {formatDate(update.feedbackDate)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No progress updates available</p>
              )}

              {/* Progress Update Form */}
              {studentData.assignedProjects?.length > 0 && (
                <form onSubmit={submitProgressUpdate} className="mt-4 border-t pt-4">
                  <textarea
                    value={progressUpdate}
                    onChange={(e) => setProgressUpdate(e.target.value)}
                    placeholder="What did you work on today?"
                    className="w-full p-2 border rounded-lg resize-none h-24"
                    required
                  ></textarea>
                  <button
                    type="submit"
                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit Progress'}
                  </button>
                </form>
              )}
            </div>

            {/* Attendance Records */}
            {studentData.attendance && studentData.attendance.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium mb-2">Attendance Records</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time In
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {studentData.attendance.slice().reverse().map((record, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {formatDate(record.date)}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${record.status === 'Present' ? 'bg-green-100 text-green-800' :
                                record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                                  record.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {record.timeIn || record.time || 'N/A'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {record.notes || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="mt-4 text-gray-500">No student data available</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProtectedInternDashboard() {
  return (
    <ProtectedRoute>
      <InternDashboard />
    </ProtectedRoute>
  );
}