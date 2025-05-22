"use client"
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
  faSignOutAlt, faPlus, faAngleDown, faAngleUp,
  faCalendarAlt, faTasks, faChartLine, faComments,
  faFilter
} from '@fortawesome/free-solid-svg-icons';

function InternDashboard() {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progressUpdate, setProgressUpdate] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [apiHealth, setApiHealth] = useState('unknown');
  const [activeTab, setActiveTab] = useState('projects');
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const { user, logout } = useAuth();
  const router = useRouter();
  const maxProgressLength = 500;

  const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_URL,
  });

  // Calculate unread feedback count
  const unreadFeedbackCount = studentData?.projectFeedback?.filter(
    feedback => !feedback.isRead
  ).length || 0;

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        await axiosInstance.get('/health');
        setApiHealth('online');
      } catch (err) {
        setApiHealth('offline');
      }
    };
    checkApiHealth();
  }, []);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!user || !user.id) {
          return;
        }
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please log in.');
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axiosInstance.get(`/api/student/profile/${user.id}`, { headers });
        const studentData = response.data;
        setStudentData(studentData);
        if (studentData.assignedProjects?.length > 0) {
          setSelectedProjectId(studentData.assignedProjects[0]._id);
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          router.push('/login');
        }
        setError(err.response?.data?.error || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [user, router]);

  const markFeedbackAsRead = async (projectId, feedbackId) => {
    try {
      const token = localStorage.getItem('token');
      await axiosInstance.post(
        `/api/student/feedback/${feedbackId}/mark-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudentData(prevData => ({
        ...prevData,
        projectFeedback: prevData.projectFeedback.map(f =>
          f._id === feedbackId ? { ...f, isRead: true } : f
        )
      }));
    } catch (error) {
      setError('Error marking feedback as read');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const submitProgressUpdate = async (e) => {
    e.preventDefault();
    if (!studentData || !progressUpdate.trim() || !selectedProjectId) {
      setError('Please select a project and enter a progress update.');
      return;
    }
    if (progressUpdate.length > maxProgressLength) {
      setError(`Progress update must be ${maxProgressLength} characters or less.`);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      setLoading(true);
      await axiosInstance.post(
        `/api/student/progress/${selectedProjectId}`,
        { content: progressUpdate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const response = await axiosInstance.get(`/api/student/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudentData(response.data);
      setProgressUpdate('');
      setSelectedProjectId(response.data.assignedProjects?.length > 0 ? response.data.assignedProjects[0]._id : '');
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit progress update.');
    } finally {
      setLoading(false);
    }
  };

  const getProjectProgress = (project) => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    const completedTasks = project.tasks.filter(task => task.completed).length;
    return Math.round((completedTasks / project.tasks.length) * 100);
  };

  const filteredAttendance = studentData?.attendance?.filter(record => {
    if (attendanceFilter === 'all') return true;
    return record.status === attendanceFilter;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-500 mb-4">
            <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200"
            >
              Try Again
            </button>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded text-gray-600 text-sm">
            <h4 className="font-medium mb-1">Debug Information:</h4>
            <p>API Status: <span className={apiHealth === 'online' ? 'text-green-500' : 'text-red-500'}>{apiHealth}</span></p>
            <p>User Role: {user ? user.role || 'Not specified' : 'Not logged in'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <FontAwesomeIcon icon={faGraduationCap} className="mr-2 text-blue-500" />
              NCAI Internship Portal
            </h1>
            <p className="text-gray-600 text-sm">Student Dashboard</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-medium text-gray-800">{studentData?.name || 'Student'}</p>
              <p className="text-xs text-gray-500">{studentData?.email || ''}</p>
            </div>
            <button
              onClick={logout}
              className="bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg border border-gray-300 flex items-center transition duration-200"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md text-white p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome back, {studentData?.name?.split(' ')[0] || 'Student'}!</h2>
              <p className="opacity-90">
                {studentData?.assignedProjects?.length > 0
                  ? `You have ${studentData.assignedProjects.length} active project(s)`
                  : 'You currently have no assigned projects'}
              </p>
              <p className="text-sm mt-1">
                Attendance Status: {studentData?.attendance?.length > 0
                  ? `${studentData.attendance[studentData.attendance.length - 1].status} on ${formatDate(studentData.attendance[studentData.attendance.length - 1].date)}`
                  : 'No attendance recorded yet'}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-full">
              <FontAwesomeIcon icon={faUser} size="lg" />
            </div>
          </div>
        </div>

        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'projects' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <FontAwesomeIcon icon={faTasks} className="mr-2" />
            My Projects
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'progress' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <FontAwesomeIcon icon={faChartLine} className="mr-2" />
            Progress Updates
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'feedback' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <FontAwesomeIcon icon={faComments} className="mr-2" />
            Feedback
            {unreadFeedbackCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">{unreadFeedbackCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 font-medium text-sm flex items-center ${activeTab === 'attendance' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
            Attendance
          </button>
        </div>

        {activeTab === 'projects' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faProjectDiagram} className="mr-2 text-blue-500" />
                Assigned Projects
              </h3>
              {studentData?.assignedProjects?.length > 0 ? (
                <div className="space-y-4">
                  {studentData.assignedProjects.map((project) => (
                    <div key={project._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{project.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center text-sm text-gray-500">
                          <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
                          <span>Start Date: {formatDate(project.startDate)}</span>
                          {project.endDate && (
                            <span className="ml-3">
                              <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
                              End Date: {formatDate(project.endDate)}
                            </span>
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="text-sm text-gray-700">Progress: {getProjectProgress(project)}%</div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{ width: `${getProjectProgress(project)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      {project.tasks && project.tasks.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Tasks</h5>
                          <ul className="space-y-2">
                            {project.tasks.map((task, index) => (
                              <li key={index} className="flex items-start">
                                <span className={`inline-block w-4 h-4 rounded-full mt-1 mr-2 flex-shrink-0 ${task.completed ? 'bg-green-100 border border-green-300' : 'bg-gray-100 border border-gray-300'}`}>
                                  {task.completed && (
                                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 w-3 h-3 relative -left-[1px] -top-[1px]" />
                                  )}
                                </span>
                                <span className={`text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                                  {task.title || task}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <FontAwesomeIcon icon={faProjectDiagram} className="text-gray-400 text-xl" />
                  </div>
                  <h4 className="text-gray-700 font-medium">No projects assigned</h4>
                  <p className="text-gray-500 mt-1">Your supervisor will assign projects to you soon</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <FontAwesomeIcon icon={faChartLine} className="mr-2 text-blue-500" />
                  Progress Updates
                </h3>
                {studentData?.assignedProjects?.length > 0 && (
                  <button
                    onClick={() => document.getElementById('progress-form').scrollIntoView({ behavior: 'smooth' })}
                    className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded flex items-center"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-1" />
                    New Update
                  </button>
                )}
              </div>
              {studentData?.progressUpdates?.length > 0 ? (
                <div className="space-y-4">
                  {studentData.progressUpdates.map((update, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition duration-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {formatDate(update.date || update.timestamp)}
                        </span>
                        {update.hasAdminFeedback && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center">
                            <FontAwesomeIcon icon={faComments} className="mr-1" />
                            Feedback Received
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700">{update.content || update.text}</p>
                      {update.feedback && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center text-blue-500 mb-1">
                            <FontAwesomeIcon icon={faComments} className="mr-2" />
                            <span className="text-sm font-medium">Supervisor Feedback</span>
                          </div>
                          <div className="bg-blue-50 p-3 rounded text-sm text-gray-700">
                            {update.feedback}
                          </div>
                          {update.feedbackDate && (
                            <p className="text-xs text-gray-500 mt-1 text-right">
                              Provided on {formatDate(update.feedbackDate)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <FontAwesomeIcon icon={faClipboardList} className="text-gray-400 text-xl" />
                  </div>
                  <h4 className="text-gray-700 font-medium">No progress updates yet</h4>
                  <p className="text-gray-500 mt-1">Submit your first progress update below</p>
                </div>
              )}
              {studentData?.assignedProjects?.length > 0 && (
                <form
                  id="progress-form"
                  onSubmit={submitProgressUpdate}
                  className="mt-8 border-t pt-6"
                >
                  <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <FontAwesomeIcon icon={faPencilAlt} className="mr-2 text-blue-500" />
                    Submit New Progress Update
                  </h4>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Select Project
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a project</option>
                      {studentData.assignedProjects.map(project => (
                        <option key={project._id} value={project._id}>
                          {project.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <textarea
                      value={progressUpdate}
                      onChange={(e) => setProgressUpdate(e.target.value)}
                      placeholder="What did you accomplish today? What challenges did you face? What are your next steps?"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-32"
                      required
                    ></textarea>
                    <p className="text-xs text-gray-500 mt-1">
                      {progressUpdate.length}/{maxProgressLength} characters
                    </p>
                    {error && (
                      <div className="text-red-500 text-sm mt-2">{error}</div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center transition duration-200"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                          Submit Update
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faComments} className="mr-2 text-blue-500" />
                Feedback from Supervisors
              </h3>
              {studentData?.projectFeedback?.length > 0 ||
              (studentData?.assignedProjects?.some(p => p.feedback?.length > 0)) ? (
                <div className="space-y-4">
                  {studentData?.assignedProjects?.map(project => (
                    project.feedback?.length > 0 && (
                      <div key={project._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <h4 className="font-medium text-gray-900">{project.title}</h4>
                          <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Project Feedback
                          </span>
                        </div>
                        <div className="space-y-3">
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
                    )
                  ))}
                  {studentData?.projectFeedback?.map((feedback, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition duration-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {feedback.projectId ?
                            `Feedback on ${studentData.assignedProjects?.find(p => p._id === feedback.projectId)?.title || 'Project'}` :
                            'General Feedback'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(feedback.date)}
                        </span>
                      </div>
                      <p className="text-gray-700">{feedback.content}</p>
                      {!feedback.isRead && (
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => markFeedbackAsRead(feedback.projectId, feedback._id)}
                            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                          >
                            Mark as Read
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <FontAwesomeIcon icon={faComments} className="text-gray-400 text-xl" />
                  </div>
                  <h4 className="text-gray-700 font-medium">No feedback yet</h4>
                  <p className="text-gray-500 mt-1">Your supervisors will provide feedback on your work</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-blue-500" />
                  Attendance Records
                </h3>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700">Filter:</label>
                  <select
                    value={attendanceFilter}
                    onChange={(e) => setAttendanceFilter(e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                  </select>
                </div>
              </div>
              {filteredAttendance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time In</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Out</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAttendance.slice().reverse().map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(record.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.timeIn || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.timeOut || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {record.notes || 'None'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 text-xl" />
                  </div>
                  <h4 className="text-gray-700 font-medium">No attendance records yet</h4>
                  <p className="text-gray-500 mt-1">Your attendance will be recorded once your internship begins</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
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
