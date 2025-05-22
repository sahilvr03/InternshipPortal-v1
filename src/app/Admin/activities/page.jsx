'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import RouteGuard from '../../components/RouteGuard';
import Navbar from '../../components/navbar';
import Sidebar from '../../components/sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHistory, faClipboardList, faCalendarCheck,
  faUserEdit, faProjectDiagram, faBell,
  faReply, faCheckCircle, faTimesCircle, faSpinner, faTrash, faSearch
} from '@fortawesome/free-solid-svg-icons';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_URL,
});

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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found');
          return;
        }

        const projectsResponse = await axiosInstance.get('/api/admin/projects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjects(projectsResponse.data || []);

        const internsResponse = await axiosInstance.get('/api/interns', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInterns(internsResponse.data || []);

        const progressResponse = await axiosInstance.get('/api/admin/progress-updates', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const formattedProgressUpdates = progressResponse.data.map(update => ({
          ...update,
          type: 'progress',
          title: `Progress update from ${update.studentName || 'Student'}`,
          date: update.date || update.timestamp || update.createdAt
        }));
        setProgressUpdates(formattedProgressUpdates);

        const allAttendance = [];
        internsResponse.data.forEach(intern => {
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
        setAttendanceRecords(allAttendance);

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
        setActivities(combinedActivities);
        setError(null);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to load activities');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const now = new Date();
    const date = new Date(dateString);
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim() || !selectedProgressUpdate) {
      setError('Feedback cannot be empty');
      return;
    }
    try {
      setSubmittingFeedback(true);
      const token = localStorage.getItem('token');
      await axiosInstance.post(
        `/api/admin/progress-updates/${selectedProgressUpdate._id}/feedback`,
        { feedback: feedbackText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedProgressUpdates = progressUpdates.map(update =>
        update._id === selectedProgressUpdate._id
          ? { ...update, feedback: feedbackText, hasAdminFeedback: true }
          : update
      );
      setProgressUpdates(updatedProgressUpdates);
      const updatedActivities = activities.map(activity =>
        activity.type === 'progress' && activity._id === selectedProgressUpdate._id
          ? { ...activity, feedback: feedbackText, hasAdminFeedback: true }
          : activity
      );
      setActivities(updatedActivities);
      setFeedbackText('');
      setShowFeedbackModal(false);
      setSelectedProgressUpdate(null);
      setError(null);
    } catch (error) {
      setError('Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleDeleteActivity = async (activity) => {
    if (!confirm(`Are you sure you want to delete this ${activity.type} activity?`)) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (activity.type === 'progress') {
        await axiosInstance.delete(`/api/admin/progress-updates/${activity._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProgressUpdates(progressUpdates.filter(u => u._id !== activity._id));
        setActivities(activities.filter(a => a._id !== activity._id));
      } else if (activity.type === 'attendance') {
        await axiosInstance.delete(`/api/admin/attendance/${activity.internId}/${activity._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAttendanceRecords(attendanceRecords.filter(a => a._id !== activity._id));
        setActivities(activities.filter(a => a._id !== activity._id));
      }
    } catch (error) {
      setError('Failed to delete activity');
    } finally {
      setLoading(false);
    }
  };

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

  const openFeedbackModal = (progressUpdate) => {
    setSelectedProgressUpdate(progressUpdate);
    setFeedbackText(progressUpdate.feedback || '');
    setShowFeedbackModal(true);
  };

  // Filter and sort activities
  const filteredActivities = activities
    .filter(activity => activeTab === 'all' || activity.type === activeTab)
    .filter(activity =>
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activity.type === 'progress' && activity.content?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (activity.type === 'attendance' && activity.notes?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (activity.type === 'project' && activity.data?.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date) - new Date(a.date);
      } else if (sortBy === 'date-asc') {
        return new Date(a.date) - new Date(b.date);
      } else if (sortBy === 'type') {
        return a.type.localeCompare(b.type);
      }
      return 0;
    });

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
                  <div className="flex items-center space-x-4">
                    <div className="relative w-64">
                      <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search activities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="date-desc">Sort by Date (Newest)</option>
                      <option value="date-asc">Sort by Date (Oldest)</option>
                      <option value="type">Sort by Type</option>
                    </select>
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
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">{formatDate(activity.date)}</span>
                                {(activity.type === 'progress' || activity.type === 'attendance') && (
                                  <button
                                    onClick={() => handleDeleteActivity(activity)}
                                    className="text-red-500 hover:text-red-600"
                                    title="Delete activity"
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </button>
                                )}
                              </div>
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
                                {activity.data.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FontAwesomeIcon icon={faClipboardList} className="text-gray-400 text-4xl mb-4" />
                      <p className="text-gray-600">No activities found for the selected filters.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Feedback Modal */}
            {showFeedbackModal && selectedProgressUpdate && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Provide Feedback</h2>
                    <button
                      onClick={() => setShowFeedbackModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FontAwesomeIcon icon={faTimesCircle} size="lg" />
                    </button>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>Progress Update:</strong> {selectedProgressUpdate.content}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted by {selectedProgressUpdate.studentName} on {formatDate(selectedProgressUpdate.date)}
                    </p>
                  </div>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Enter your feedback here..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="5"
                  />
                  {error && (
                    <div className="mt-2 text-red-500 text-sm">{error}</div>
                  )}
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => setShowFeedbackModal(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg mr-2 hover:bg-gray-600"
                      disabled={submittingFeedback}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitFeedback}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center"
                      disabled={submittingFeedback}
                    >
                      {submittingFeedback ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                          Submit Feedback
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
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