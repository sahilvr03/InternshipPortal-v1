'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import RouteGuard from '../../components/RouteGuard';
import Navbar from "../../components/navbar";
import Sidebar from "../../components/sidebar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHistory, faClipboardList, faCalendarCheck, 
  faUserEdit, faProjectDiagram, faBell,
  faReply, faCheckCircle, faTimesCircle, faSpinner
} from '@fortawesome/free-solid-svg-icons';

function ActivitiesPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [interns, setInterns] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [progressUpdates, setProgressUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedProgressUpdate, setSelectedProgressUpdate] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }

        // Get projects data
        const projectsResponse = await axios.get('https://backend-internship-portal.vercel.app/api/admin/projects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjects(projectsResponse.data || []);

        // Get interns data to gather attendance and progress updates
        const internsResponse = await axios.get('https://backend-internship-portal.vercel.app/api/interns', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInterns(internsResponse.data || []);

        // Get all progress updates directly (improved endpoint)
        const progressResponse = await axios.get('https://backend-internship-portal.vercel.app/api/admin/progress-updates', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const formattedProgressUpdates = progressResponse.data.map(update => ({
          ...update,
          type: 'progress',
          title: `Progress update from ${update.studentName || 'Student'}`,
          date: update.date || update.timestamp || update.createdAt
        }));

        setProgressUpdates(formattedProgressUpdates);

        // Extract attendance records from all interns
        const allAttendance = [];

        internsResponse.data.forEach(intern => {
          // Add attendance records with intern name
          if (intern.attendance && intern.attendance.length > 0) {
            intern.attendance.forEach(record => {
              allAttendance.push({
                ...record,
                internName: intern.name,
                internId: intern._id,
                type: 'attendance',
                title: `${intern.name} was marked ${record.status}`,
                date: record.date
              });
            });
          }
        });

        setAttendanceRecords(allAttendance.sort((a, b) => new Date(b.date) - new Date(a.date)));

        // Combine all activities and sort by date
        const combinedActivities = [
          ...projectsResponse.data.map(project => ({
            type: 'project',
            title: project.title,
            status: project.status,
            date: project.lastModified || project.updatedAt,
            id: project._id,
            data: project
          })),
          ...allAttendance,
          ...formattedProgressUpdates
        ];

        // Sort by date (most recent first)
        combinedActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
        setActivities(combinedActivities);

        setError(null);
      } catch (error) {
        console.error('Error fetching activity data:', error);
        setError(error.response?.data?.message || 'Failed to load activities');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const now = new Date();
    const date = new Date(dateString);
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If yesterday, show "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle providing feedback for a progress update
  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim() || !selectedProgressUpdate) return;

    try {
      setSubmittingFeedback(true);
      const token = localStorage.getItem('token');

      // Send feedback to the server
      await axios.post(
        `https://backend-internship-portal.vercel.app/api/admin/progress-updates/${selectedProgressUpdate._id}/feedback`,
        { feedback: feedbackText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update the progress update in state with the new feedback
      const updatedProgressUpdates = progressUpdates.map(update => 
        update._id === selectedProgressUpdate._id
          ? { ...update, feedback: feedbackText, hasAdminFeedback: true }
          : update
      );
      setProgressUpdates(updatedProgressUpdates);

      // Also update in activities array
      const updatedActivities = activities.map(activity => 
        activity.type === 'progress' && activity._id === selectedProgressUpdate._id
          ? { ...activity, feedback: feedbackText, hasAdminFeedback: true }
          : activity
      );
      setActivities(updatedActivities);

      // Clear form and close modal
      setFeedbackText('');
      setShowFeedbackModal(false);
      setSelectedProgressUpdate(null);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Get status class for styling
  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Not Started':
        return 'bg-gray-100 text-gray-800';
      case 'Incomplete':
        return 'bg-yellow-100 text-yellow-800';
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      case 'Late':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get icon for activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'project':
        return faProjectDiagram;
      case 'attendance':
        return faCalendarCheck;
      case 'progress':
        return faUserEdit;
      default:
        return faBell;
    }
  };

  // Open feedback modal for a progress update
  const openFeedbackModal = (progressUpdate) => {
    setSelectedProgressUpdate(progressUpdate);
    setFeedbackText(progressUpdate.feedback || '');
    setShowFeedbackModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 max-w-lg">
          <h3 className="font-bold mb-2">Error</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Filter activities based on active tab
  const filteredActivities = activeTab === 'all' 
    ? activities
    : activities.filter(activity => activity.type === activeTab);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Recent Activities</h1>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    <FontAwesomeIcon icon={faHistory} className="mr-2 text-gray-600" />
                    System Activities
                  </h2>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setActiveTab('all')}
                      className={`px-3 py-1 rounded-md text-sm ${
                        activeTab === 'all' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setActiveTab('project')}
                      className={`px-3 py-1 rounded-md text-sm ${
                        activeTab === 'project' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      Projects
                    </button>
                    <button 
                      onClick={() => setActiveTab('attendance')}
                      className={`px-3 py-1 rounded-md text-sm ${
                        activeTab === 'attendance' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      Attendance
                    </button>
                    <button 
                      onClick={() => setActiveTab('progress')}
                      className={`px-3 py-1 rounded-md text-sm ${
                        activeTab === 'progress' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      Progress Updates
                    </button>
                  </div>
                </div>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                  {filteredActivities.length > 0 ? (
                    filteredActivities.map((activity, index) => (
                      <div key={index} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg shadow-sm hover:shadow">
                        <div className="flex items-start">
                          <div className="bg-blue-100 p-2 rounded-full mr-4">
                            <FontAwesomeIcon 
                              icon={getActivityIcon(activity.type)} 
                              className="text-blue-600"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium text-gray-900">
                                {activity.title}
                                {activity.status && (
                                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getStatusClass(activity.status)}`}>
                                    {activity.status}
                                  </span>
                                )}
                              </h3>
                              <span className="text-xs text-gray-500">{formatDate(activity.date)}</span>
                            </div>
                            
                            {activity.type === 'progress' && (
                              <div>
                                <p className="mt-1 text-sm text-gray-600">{activity.content}</p>
                                
                                <div className="mt-2 flex justify-between items-center">
                                  <div>
                                    {activity.hasAdminFeedback || activity.feedback ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                                        Feedback provided
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Awaiting feedback
                                      </span>
                                    )}
                                  </div>
                                  
                                  <button
                                    onClick={() => openFeedbackModal(activity)}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                                  >
                                    <FontAwesomeIcon icon={faReply} className="mr-1" />
                                    {activity.hasAdminFeedback || activity.feedback ? 'Edit Feedback' : 'Provide Feedback'}
                                  </button>
                                </div>
                                
                                {(activity.hasAdminFeedback || activity.feedback) && (
                                  <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                                    <p className="text-xs font-medium text-gray-500">Your feedback:</p>
                                    <p className="text-sm text-gray-700">{activity.feedback}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {activity.type === 'attendance' && (
                              <p className="mt-1 text-sm text-gray-600">
                                {activity.notes || `Marked by: ${activity.markedBy || 'Admin'}`}
                              </p>
                            )}
                            
                            {activity.type === 'project' && activity.data && activity.data.description && (
                              <p className="mt-1 text-sm text-gray-600">
                                {activity.data.description.length > 100 
                                  ? `${activity.data.description.substring(0, 100)}...` 
                                  : activity.data.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FontAwesomeIcon icon={faClipboardList} className="text-3xl mb-2" />
                      <p>No {activeTab === 'all' ? 'recent activities' : activeTab} found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Provide Feedback on Progress Update
                </h3>
                <button
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setSelectedProgressUpdate(null);
                    setFeedbackText('');
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FontAwesomeIcon icon={faTimesCircle} size="lg" />
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-800 font-medium">Student Update:</p>
                <p className="text-sm text-gray-600">{selectedProgressUpdate?.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  From: {selectedProgressUpdate?.studentName || 'Student'} - {formatDate(selectedProgressUpdate?.date)}
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Feedback:
                </label>
                <textarea
                  id="feedback"
                  rows="4"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                  placeholder="Provide constructive feedback to the student..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setSelectedProgressUpdate(null);
                    setFeedbackText('');
                  }}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitFeedback}
                  disabled={!feedbackText.trim() || submittingFeedback}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {submittingFeedback ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>Submit Feedback</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProtectedActivitiesPage() {
  return (
    <RouteGuard requireAdmin={true}>
      <ActivitiesPage />
    </RouteGuard>
  );
}