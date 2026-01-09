'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import RouteGuard from '../../components/RouteGuard';
import Sidebar from '../../components/sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faTrash, faPencilAlt, faEye,
  faCheckCircle, faTimesCircle, faExclamationTriangle,
  faGraduationCap, faProjectDiagram, faClipboardList,
  faSignOutAlt, faPlus, faAngleDown, faAngleUp, faTimes, faDownload, faSearch
} from '@fortawesome/free-solid-svg-icons';
import { saveAs } from 'file-saver';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_URL,
});

function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('interns');
  const [interns, setInterns] = useState([]);
  const [pastInterns, setPastInterns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showAddInternForm, setShowAddInternForm] = useState(false);
  const [showPastInterns, setShowPastInterns] = useState(false);
  const [newIntern, setNewIntern] = useState({
    name: '',
    email: '',
    duration: 1,
    tasks: [],
    username: '',
    password: ''
  });
  const [internFile, setInternFile] = useState(null);
  const [stats, setStats] = useState({
    students: 0,
    projects: 0,
    completedProjects: 0,
    activeInterns: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [message, setMessage] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [viewInternModalOpen, setViewInternModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectFeedback, setProjectFeedback] = useState('');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to sort interns by createdAt (latest first)
  const sortInternsByCreatedAt = (internsArray) => {
    return [...internsArray].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.lastActive || '1970-01-01');
      const dateB = new Date(b.createdAt || b.lastActive || '1970-01-01');
      return dateB - dateA;
    });
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }

        const internsResponse = await axiosInstance.get('/api/interns', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const projectsResponse = await axiosInstance.get('/api/admin/projects', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const sortedInterns = sortInternsByCreatedAt(internsResponse.data || []);

        setInterns(sortedInterns);
        setProjects(projectsResponse.data || []);

        try {
          const pastInternsResponse = await axiosInstance.get('/api/interns/past', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setPastInterns(pastInternsResponse.data || []);
        } catch (err) {
          console.error('Error fetching past interns:', err);
          setPastInterns([]);
        }

        const completedProjects = projectsResponse.data.filter(
          project => project.status === 'Completed'
        ).length;

        setStats({
          students: internsResponse.data.length,
          projects: projectsResponse.data.length,
          completedProjects,
          activeInterns: internsResponse.data.length
        });

        setError(null);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const downloadInternsCSV = () => {
    const headers = [
      'No.', 'Name', 'Email', 'Username', 'Department', 'Domain', 'Week', 'Program', 'University',
      'Contact Number', 'Bio', 'Duration (Months)', 'Joining Date', 'Progress (%)'
    ];

    const rows = interns.map((intern, index) => [
      index + 1,
      intern.name || 'N/A',
      intern.email || 'N/A',
      intern.student?.username || intern.username || 'N/A',
      intern.student?.department || 'N/A',
      intern.student?.domain || 'N/A',
      intern.student?.week || 'N/A',
      intern.student?.program || 'N/A',
      intern.student?.university || intern.university || 'N/A',
      intern.student?.contactNumber || 'N/A',
      intern.student?.bio || 'N/A',
      intern.duration || 'N/A',
      formatDate(intern.joiningDate) || 'N/A',
      intern.progress || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'interns_data.csv');
  };

  const handleUpdateProjectStatus = async (projectId, newStatus) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const now = new Date();
      const formattedDate = now.toLocaleString();

      await axiosInstance.put(
        `/api/admin/projects/${projectId}`,
        {
          status: newStatus,
          feedback: `Project status updated to ${newStatus} at ${formattedDate}`
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setProjects(prevProjects =>
        prevProjects.map(project =>
          project._id === projectId
            ? {
                ...project,
                status: newStatus,
                lastModified: new Date(),
                feedback: [
                  ...(project.feedback || []),
                  {
                    comment: `Project status updated to ${newStatus} at ${formattedDate}`,
                    from: 'admin',
                    date: new Date()
                  }
                ]
              }
            : project
        )
      );

      if (selectedProject && selectedProject._id === projectId) {
        setSelectedProject({
          ...selectedProject,
          status: newStatus,
          lastModified: new Date(),
          feedback: [
            ...(selectedProject.feedback || []),
            {
              comment: `Project status updated to ${newStatus} at ${formattedDate}`,
              from: 'admin',
              date: new Date()
            }
          ]
        });
      }

      alert(`Project status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating project status:', error);
      alert(`Failed to update project status: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTaskText = (text) => {
    if (!text) return '';
    const textStr = typeof text === 'string' ? text : String(text);
    return textStr
      .replace(/^\[|\]$|^"|"$|^'|'$/g, '')
      .replace(/\\"/g, '"')
      .trim();
  };

  const handleAddIntern = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      let formattedTasks;
      if (Array.isArray(newIntern.tasks)) {
        formattedTasks = newIntern.tasks;
      } else if (typeof newIntern.tasks === 'string') {
        formattedTasks = newIntern.tasks
          .split(',')
          .map(task => task.trim())
          .filter(Boolean);
      } else {
        formattedTasks = [];
      }

      const formData = new FormData();
      formData.append('name', newIntern.name);
      formData.append('email', newIntern.email);
      formData.append('username', newIntern.username);

      if (newIntern.password) {
        formData.append('password', newIntern.password);
      } else {
        const randomPassword = Math.random().toString(36).slice(-8);
        formData.append('password', randomPassword);
        setNewIntern({ ...newIntern, password: randomPassword });
      }

      formData.append('duration', newIntern.duration);
      formData.append('tasks', JSON.stringify(formattedTasks));

      if (internFile) {
        formData.append('resume', internFile);
      }

      await axiosInstance.post('/api/interns', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const response = await axiosInstance.get('/api/interns', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const sortedInterns = sortInternsByCreatedAt(response.data);

      setInterns(sortedInterns);
      setStats(prev => ({
        ...prev,
        students: response.data.length,
        activeInterns: response.data.length
      }));

      setNewIntern({
        name: '',
        email: '',
        duration: 1,
        tasks: [],
        username: '',
        password: ''
      });
      setInternFile(null);
      setShowAddInternForm(false);

      alert('Intern added successfully!');
    } catch (error) {
      console.error('Error adding intern:', error);
      alert(`Failed to add intern: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIntern = async (e) => {
    e.preventDefault();
    if (!selectedIntern) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const formattedTasks = Array.isArray(newIntern.tasks)
        ? newIntern.tasks
        : newIntern.tasks.split(',').map(task => task.trim());

      const formData = new FormData();
      formData.append('name', newIntern.name);
      formData.append('email', newIntern.email);
      formData.append('duration', newIntern.duration);
      formData.append('tasks', JSON.stringify(formattedTasks));

      if (internFile) {
        formData.append('resume', internFile);
      }

      await axiosInstance.put(`/api/interns/${selectedIntern._id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (newIntern.username || newIntern.password) {
        const credentialsData = {};
        if (newIntern.username) credentialsData.username = newIntern.username;
        if (newIntern.password) credentialsData.password = newIntern.password;

        await axiosInstance.put(
          `/api/interns/${selectedIntern._id}/credentials`,
          credentialsData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      const response = await axiosInstance.get('/api/interns', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const sortedInterns = sortInternsByCreatedAt(response.data);

      setInterns(sortedInterns);
      setNewIntern({
        name: '',
        email: '',
        duration: 1,
        tasks: [],
        username: '',
        password: ''
      });
      setInternFile(null);
      setShowAddInternForm(false);
      setSelectedIntern(null);

      alert('Intern updated successfully!');
    } catch (error) {
      console.error('Error updating intern:', error);
      alert(`Failed to update intern: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

const handleDeleteIntern = async (internId) => {
  if (!confirm('Are you sure you want to move this intern to past interns?')) return;

  try {
    setLoading(true);
    const token = localStorage.getItem('token');

    // ← Changed this line
    await axiosInstance.post(`/api/interns/archive/${internId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Refresh lists
    const response = await axiosInstance.get('/api/interns', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const sortedInterns = sortInternsByCreatedAt(response.data);
    setInterns(sortedInterns);

    const pastResponse = await axiosInstance.get('/api/interns/past', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setPastInterns(pastResponse.data || []);

    alert('Intern moved to past interns successfully!');
  } catch (error) {
    console.error('Error archiving intern:', error);
    alert(`Failed to archive intern: ${error.response?.data?.error || error.message}`);
  } finally {
    setLoading(false);
  }
};
  const handleSendMessage = async () => {
    if (!selectedIntern || !message.trim()) {
      alert('Please select an intern and enter a message');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      await axiosInstance.post(
        `/api/interns/${selectedIntern._id}/progress`,
        { content: `Message from admin: ${message}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Message sent to ${selectedIntern.name}!`);
      setMessage('');
      setShowMessageModal(false);
    } catch (error) {
      console.error('Error sending message:', error);
      alert(`Failed to send message: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordAttendance = async (internId, status) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const now = new Date();
      const timeIn = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      await axiosInstance.post(
        `/api/interns/${internId}/attendance`,
        {
          date: now.toISOString(),
          status,
          timeIn,
          notes: `Marked by admin: ${user?.name || 'Admin'}`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const response = await axiosInstance.get('/api/interns', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const sortedInterns = sortInternsByCreatedAt(response.data);

      setInterns(sortedInterns);
      alert(`Attendance for ${sortedInterns.find(intern => intern._id === internId)?.name || 'intern'} marked as ${status}`);

      if (selectedIntern && selectedIntern._id === internId) {
        const updatedIntern = sortedInterns.find(i => i._id === internId);
        if (updatedIntern) setSelectedIntern(updatedIntern);
      }
    } catch (error) {
      console.error('Error recording attendance:', error);
      alert(`Failed to record attendance: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openEditInternForm = (intern) => {
    setSelectedIntern(intern);
    let tasksForForm = '';
    if (Array.isArray(intern.tasks)) {
      tasksForForm = intern.tasks
        .map(task => typeof task === 'string' ? task.replace(/['"]+/g, '') : task)
        .join(', ');
    } else if (typeof intern.tasks === 'string') {
      tasksForForm = intern.tasks.replace(/[\[\]"']+/g, '');
    }

    setNewIntern({
      name: intern.name || '',
      email: intern.email || '',
      duration: intern.duration || 1,
      tasks: tasksForForm,
      username: intern.username || '',
      password: ''
    });
    setShowAddInternForm(true);
  };

  const openAddInternForm = () => {
    const randomUsername = `intern${Math.floor(Math.random() * 10000)}`;
    const randomPassword = Math.random().toString(36).slice(-8);

    setSelectedIntern(null);
    setNewIntern({
      name: '',
      email: '',
      duration: 1,
      tasks: [],
      username: randomUsername,
      password: randomPassword
    });
    setShowAddInternForm(true);
  };

  const openMessageModal = (intern) => {
    setSelectedIntern(intern);
    setShowMessageModal(true);
  };

  const openViewInternModal = (intern) => {
    setSelectedIntern(intern);
    setViewInternModalOpen(true);
  };

  const openProjectModal = (project) => {
    setSelectedProject(project);
    setProjectFeedback('');
    setShowProjectModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateProgress = (intern) => {
    if (!intern) return 0;

    if (intern.progressUpdates && intern.progressUpdates.length > 0) {
      return Math.min(Math.round((intern.progressUpdates.length / 10) * 100), 100);
    }

    if (intern.assignedProjects && intern.assignedProjects.length > 0) {
      const completedProjects = intern.assignedProjects.filter(
        project => project.status === 'Completed'
      ).length;

      const inProgressProjects = intern.assignedProjects.filter(
        project => project.status === 'In Progress'
      ).length;

      return Math.round(
        ((completedProjects + (inProgressProjects * 0.5)) / intern.assignedProjects.length) * 100
      );
    }

    return 0;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Present':
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'Absent':
        return 'bg-rose-100 text-rose-800';
      case 'Late':
        return 'bg-amber-100 text-amber-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Not Started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInterns = interns.filter(intern =>
    intern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    intern.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (intern.student?.username || intern.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg max-w-full sm:max-w-md text-center">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Error</h3>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 text-sm sm:text-base"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-0">Admin Dashboard</h1>
            <button
              onClick={logout}
              className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-all duration-300 flex items-center text-sm sm:text-base"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 overflow-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {[
              { title: 'Total Internships', value: stats.students, color: 'blue-600' },
              { title: 'Active Interns', value: stats.activeInterns, color: 'emerald-600' },
              { title: 'Completed Projects', value: stats.completedProjects, color: 'purple-600' },
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-sm bg-opacity-80"
              >
                <h2 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">{stat.title}</h2>
                <p className="text-2xl sm:text-3xl font-bold text-center" style={{ color: `var(--${stat.color})` }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm backdrop-blur-sm bg-opacity-80">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-2 sm:space-x-4 px-4 sm:px-6 pt-4 overflow-x-auto">
                {['interns', 'projects'].map(tab => (
                  <button
                    key={tab}
                    className={`px-3 sm:px-4 py-2 text-sm font-medium transition-all duration-300 flex items-center whitespace-nowrap ${
                      activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    <FontAwesomeIcon icon={tab === 'interns' ? faGraduationCap : faProjectDiagram} className="mr-2" />
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-4 sm:p-6">
              {activeTab === 'interns' && (
                <>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Intern Management</h2>
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                      <div className="relative w-full sm:w-64">
                        <FontAwesomeIcon
                          icon={faSearch}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="Search by name, email, or username"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={openAddInternForm}
                          className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center text-sm"
                        >
                          <FontAwesomeIcon icon={faPlus} className="mr-2" />
                          Add Intern
                        </button>
                        <button
                          onClick={() => setShowPastInterns(!showPastInterns)}
                          className="bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center text-sm"
                        >
                          {showPastInterns ? (
                            <>
                              <FontAwesomeIcon icon={faAngleUp} className="mr-2" />
                              Hide Past Interns
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faAngleDown} className="mr-2" />
                              Show Past Interns
                            </>
                          )}
                        </button>
                        <button
                          onClick={downloadInternsCSV}
                          className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-300 flex items-center text-sm"
                        >
                          <FontAwesomeIcon icon={faDownload} className="mr-2" />
                          Download CSV
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Table */}
<div className="hidden sm:block">
  <h3 className="text-base font-semibold text-gray-800 mb-3">
    Current Interns
  </h3>

  <div className="border rounded-lg overflow-hidden bg-white">
    <table className="w-full text-sm">
      <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
        <tr>
          <th className="px-4 py-3 text-left">#</th>
          <th className="px-4 py-3 text-left">Intern</th>
          <th className="px-4 py-3 text-left">Dept</th>
          <th className="px-4 py-3 text-left">Domain</th>
          <th className="px-4 py-3 text-left">Week</th>
          <th className="px-4 py-3 text-left">Attendance</th>
          <th className="px-4 py-3 text-right">Actions</th>
        </tr>
      </thead>

      <tbody className="divide-y">
        {filteredInterns.length ? (
          filteredInterns.map((intern, i) => (
            <tr key={intern._id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-500">{i + 1}</td>

              <td className="px-4 py-3">
                <p className="font-medium text-gray-800">{intern.name}</p>
                <p className="text-xs text-gray-500">{intern.email}</p>
              </td>

              <td className="px-4 py-3">
                {intern.student?.department || '—'}
              </td>

              <td className="px-4 py-3">
                {intern.student?.domain || '—'}
              </td>

              <td className="px-4 py-3">
                {intern.student?.week || '—'}
              </td>

              {/* Attendance */}
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRecordAttendance(intern._id, 'Present')}
                    className="w-7 h-7 rounded bg-emerald-500 text-white hover:bg-emerald-600"
                    title="Present"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => handleRecordAttendance(intern._id, 'Absent')}
                    className="w-7 h-7 rounded bg-rose-500 text-white hover:bg-rose-600"
                    title="Absent"
                  >
                    ✕
                  </button>
                  <button
                    onClick={() => handleRecordAttendance(intern._id, 'Late')}
                    className="w-7 h-7 rounded bg-amber-500 text-white hover:bg-amber-600"
                    title="Late"
                  >
                    !
                  </button>
                </div>
              </td>

              {/* Actions */}
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-3 text-gray-500">
                  <button onClick={() => openViewInternModal(intern)} title="View" className="hover:text-blue-600">
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                  <button onClick={() => openEditInternForm(intern)} title="Edit" className="hover:text-emerald-600">
                    <FontAwesomeIcon icon={faPencilAlt} />
                  </button>
                  <button onClick={() => handleDeleteIntern(intern._id)} title="Delete" className="hover:text-rose-600">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                  <button onClick={() => openMessageModal(intern)} title="Message" className="hover:text-purple-600">
                    <FontAwesomeIcon icon={faClipboardList} />
                  </button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" className="px-4 py-6 text-center text-gray-500">
              No interns found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>


                  {/* Mobile Cards */}
                  <div className="sm:hidden space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Current Interns</h3>
                    {filteredInterns.length > 0 ? (
                      filteredInterns.map((intern, index) => (
                        <div key={intern._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="flex items-center mb-3">
                            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm">
                              {intern.name ? intern.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{intern.name}</div>
                              <div className="text-xs text-gray-500">{intern.student?.username || intern.username}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            <div><span className="font-medium">Email:</span> {intern.email}</div>
                            <div><span className="font-medium">Department:</span> {intern.student?.department || 'N/A'}</div>
                            <div><span className="font-medium">Domain:</span> {intern.student?.domain || 'N/A'}</div>
                            <div><span className="font-medium">Week:</span> {intern.student?.week || 'N/A'}</div>
                          </div>
                          <div className="mt-3">
                            <span className="font-medium text-sm text-gray-700">Attendance:</span>
                            <div className="flex space-x-2 mt-2">
                              {['Present', 'Absent', 'Late'].map(status => (
                                <button
                                  key={status}
                                  onClick={() => handleRecordAttendance(intern._id, status)}
                                  className={`p-2 rounded-full text-white transition-all duration-200 ${
                                    status === 'Present' ? 'bg-emerald-500 hover:bg-emerald-600' :
                                    status === 'Absent' ? 'bg-rose-500 hover:bg-rose-600' :
                                    'bg-amber-500 hover:bg-amber-600'
                                  }`}
                                  title={`Mark ${status}`}
                                >
                                  <FontAwesomeIcon icon={
                                    status === 'Present' ? faCheckCircle :
                                    status === 'Absent' ? faTimesCircle :
                                    faExclamationTriangle
                                  } />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="mt-3 flex space-x-3">
                            {[
                              { action: () => openViewInternModal(intern), icon: faEye, color: 'blue-600', hover: 'blue-800', title: 'View Details' },
                              { action: () => openEditInternForm(intern), icon: faPencilAlt, color: 'emerald-600', hover: 'emerald-800', title: 'Edit Intern' },
                              { action: () => handleDeleteIntern(intern._id), icon: faTrash, color: 'rose-600', hover: 'rose-800', title: 'Delete Intern' },
                              { action: () => openMessageModal(intern), icon: faClipboardList, color: 'purple-600', hover: 'purple-800', title: 'Send Message' },
                            ].map(({ action, icon, color, hover, title }, idx) => (
                              <button
                                key={idx}
                                onClick={action}
                                className={`text-${color} hover:text-${hover} transition-all duration-200`}
                                title={title}
                              >
                                <FontAwesomeIcon icon={icon} />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-600 text-sm">
                        {searchQuery ? 'No interns match your search.' : 'No interns found.'}
                      </div>
                    )}
                  </div>

                  {showPastInterns && (
                    <div className="mt-6 sm:mt-8">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Past Interns</h3>
                      {/* Desktop Past Interns Table */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {['Name', 'Email', 'Final Progress', 'Removed On', 'Projects'].map((header, index) => (
                                <th key={index} className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {pastInterns.length > 0 ? (
                              pastInterns.map((intern) => (
                                <tr key={intern._id} className="hover:bg-gray-50 transition-all duration-200">
                                  <td className="px-4 sm:px-6 py-4">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-8 sm:h-10 sm:w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                        {intern.name ? intern.name.charAt(0).toUpperCase() : 'S'}
                                      </div>
                                      <div className="ml-3 sm:ml-4">
                                        <div className="text-sm font-medium text-gray-900">{intern.name}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">{intern.email}</td>
                                  <td className="px-4 sm:px-6 py-4">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                      <div
                                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${intern.progress || 0}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs text-gray-500">{intern.progress || 0}%</span>
                                  </td>
                                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">
                                    {formatDate(intern.deletedAt)}
                                  </td>
                                  <td className="px-4 sm:px-6 py-4">
                                    {intern.deletedProjects && intern.deletedProjects.length > 0 ? (
                                      <ul className="list-disc pl-5 max-h-32 overflow-y-auto">
                                        {intern.deletedProjects.map((project, idx) => (
                                          <li key={idx} className="text-sm text-gray-600">
                                            {project.title}
                                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getStatusClass(project.status)}`}>
                                              {project.status}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <span className="text-gray-500 text-sm">No projects</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="px-4 sm:px-6 py-4 text-center text-gray-600 text-sm">
                                  No past interns found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {/* Mobile Past Interns Cards */}
                      <div className="sm:hidden space-y-4">
                        {pastInterns.length > 0 ? (
                          pastInterns.map((intern) => (
                            <div key={intern._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                              <div className="flex items-center mb-3">
                                <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                  {intern.name ? intern.name.charAt(0).toUpperCase() : 'S'}
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">{intern.name}</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                <div><span className="font-medium">Email:</span> {intern.email}</div>
                                <div><span className="font-medium">Progress:</span> {intern.progress || 0}%</div>
                                <div><span className="font-medium">Removed On:</span> {formatDate(intern.deletedAt)}</div>
                              </div>
                              <div className="mt-3">
                                <span className="font-medium text-sm text-gray-700">Projects:</span>
                                {intern.deletedProjects && intern.deletedProjects.length > 0 ? (
                                  <ul className="list-disc pl-5 mt-2 text-sm text-gray-600">
                                    {intern.deletedProjects.map((project, idx) => (
                                      <li key={idx}>
                                        {project.title}
                                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getStatusClass(project.status)}`}>
                                          {project.status}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-gray-500 text-sm mt-2">No projects</p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-600 text-sm">No past interns found.</div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'projects' && (
                <>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Project Management</h2>
                  {/* Desktop Projects Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Project Title', 'Status', 'Assigned To', 'Last Updated', 'Actions'].map((header, index) => (
                            <th key={index} className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {projects.length > 0 ? (
                          projects.map((project) => (
                            <tr key={project._id} className="hover:bg-gray-50 transition-all duration-200">
                              <td className="px-4 sm:px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">{project.title}</div>
                                <div className="text-xs text-gray-500">
                                  {project.description && project.description.length > 50
                                    ? `${formatTaskText(project.description.slice(0, 50))}...`
                                    : formatTaskText(project.description) || 'No description'}
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(project.status)}`}>
                                  {project.status}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                {project.assignedTo?.length > 0 ? (
                                  <ul className="list-disc pl-5">
                                    {project.assignedTo.map((student, index) => (
                                      <li key={index} className="text-sm text-gray-600">
                                        {typeof student === 'string'
                                          ? (interns.find(i => i._id === student)?.name || student)
                                          : student.name}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-sm text-gray-500">Not assigned</span>
                                )}
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">
                                {formatDate(project.lastModified || project.updatedAt)}
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-sm font-medium">
                                <button
                                  onClick={() => openProjectModal(project)}
                                  className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 text-sm"
                                >
                                  <FontAwesomeIcon icon={faClipboardList} className="mr-2" />
                                  Manage
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-4 sm:px-6 py-4 text-center text-gray-600 text-sm">
                              No projects found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile Projects Cards */}
                  <div className="sm:hidden space-y-4">
                    {projects.length > 0 ? (
                      projects.map((project) => (
                        <div key={project._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="text-sm font-medium text-gray-900 mb-2">{project.title}</div>
                          <div className="text-xs text-gray-500 mb-2">
                            {project.description && project.description.length > 50
                              ? `${formatTaskText(project.description.slice(0, 50))}...`
                              : formatTaskText(project.description) || 'No description'}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            <div><span className="font-medium">Status:</span> {project.status}</div>
                            <div><span className="font-medium">Last Updated:</span> {formatDate(project.lastModified || project.updatedAt)}</div>
                          </div>
                          <div className="mt-3">
                            <span className="font-medium text-sm text-gray-700">Assigned To:</span>
                            {project.assignedTo?.length > 0 ? (
                              <ul className="list-disc pl-5 mt-2 text-sm text-gray-600">
                                {project.assignedTo.map((student, index) => (
                                  <li key={index}>
                                    {typeof student === 'string'
                                      ? (interns.find(i => i._id === student)?.name || student)
                                      : student.name}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-500 text-sm mt-2">Not assigned</p>
                            )}
                          </div>
                          <div className="mt-3">
                            <button
                              onClick={() => openProjectModal(project)}
                              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 w-full text-sm"
                            >
                              <FontAwesomeIcon icon={faClipboardList} className="mr-2" />
                              Manage
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-600 text-sm">No projects found.</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>

        {/* Add/Edit Intern Modal */}
        {showAddInternForm && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl backdrop-blur-sm bg-opacity-95">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedIntern ? 'Edit Intern' : 'Add New Intern'}</h2>
                <button
                  onClick={() => {
                    setShowAddInternForm(false);
                    setSelectedIntern(null);
                    setNewIntern({
                      name: '',
                      email: '',
                      duration: 1,
                      tasks: [],
                      username: '',
                      password: ''
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-all duration-200"
                >
                  <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>
              </div>

              <form onSubmit={selectedIntern ? handleUpdateIntern : handleAddIntern}>
                {[
                  { label: 'Name', type: 'text', value: newIntern.name, onChange: (e) => setNewIntern({ ...newIntern, name: e.target.value }), required: true },
                  { label: 'Email', type: 'email', value: newIntern.email, onChange: (e) => setNewIntern({ ...newIntern, email: e.target.value }), required: true },
                  { label: 'Duration (months)', type: 'number', min: '1', value: newIntern.duration, onChange: (e) => setNewIntern({ ...newIntern, duration: parseInt(e.target.value) }), required: true },
                  { label: 'Tasks (comma separated)', type: 'textarea', value: newIntern.tasks, onChange: (e) => setNewIntern({ ...newIntern, tasks: e.target.value }) },
                  { label: 'Username', type: 'text', value: newIntern.username, onChange: (e) => setNewIntern({ ...newIntern, username: e.target.value }), required: true },
                ].map((field, index) => (
                  <div key={index} className="mb-4 sm:mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={field.value}
                        onChange={field.onChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                        rows="4"
                      />
                    ) : (
                      <input
                        type={field.type}
                        min={field.min}
                        value={field.value}
                        onChange={field.onChange}
                        required={field.required}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      />
                    )}
                  </div>
                ))}

                <div className="mb-4 sm:mb-5">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {selectedIntern ? 'New Password (optional)' : 'Password'}
                    </label>
                    {selectedIntern && (
                      <button
                        type="button"
                        onClick={() => setShowPasswordField(!showPasswordField)}
                        className="text-xs text-blue-600 hover:text-blue-800 transition-all duration-200"
                      >
                        {showPasswordField ? 'Hide Password' : 'Change Password'}
                      </button>
                    )}
                  </div>
                  {(!selectedIntern || showPasswordField) && (
                    <input
                      type="password"
                      value={newIntern.password}
                      onChange={(e) => setNewIntern({ ...newIntern, password: e.target.value })}
                      required={!selectedIntern}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    />
                  )}
                </div>

                <div className="mb-4 sm:mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resume (PDF)</label>
                  <input
                    type="file"
                    onChange={(e) => setInternFile(e.target.files[0])}
                    accept=".pdf"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddInternForm(false);
                      setSelectedIntern(null);
                    }}
                    className="bg-gray-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-700 transition-all duration-300 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 text-sm"
                  >
                    {selectedIntern ? 'Update Intern' : 'Add Intern'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Intern Modal */}
        {selectedIntern && viewInternModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl backdrop-blur-sm bg-opacity-95">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedIntern.name}</h2>
                <button
                  onClick={() => setViewInternModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-all duration-200"
                >
                  <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                  {[
                    { label: 'Email', value: selectedIntern.email },
                    { label: 'Username', value: selectedIntern.student?.username || selectedIntern.username },
                    { label: 'Department', value: selectedIntern.student?.department || 'N/A' },
                    { label: 'Domain', value: selectedIntern.student?.domain || 'N/A' },
                    { label: 'Week', value: selectedIntern.student?.week || 'N/A' },
                    { label: 'Program', value: selectedIntern.student?.program || 'N/A' },
                    { label: 'University', value: selectedIntern.student?.university || selectedIntern.university || 'N/A' },
                    { label: 'Contact Number', value: selectedIntern.student?.contactNumber || 'N/A' },
                    { label: 'Bio', value: selectedIntern.student?.bio || 'N/A' },
                    { label: 'Duration', value: `${selectedIntern.duration} months` },
                    { label: 'Last Active', value: formatDate(selectedIntern.lastActive) },
                  ].map((item, index) => (
                    <p key={index} className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">{item.label}:</span> {item.value}
                    </p>
                  ))}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Progress</h3>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${calculateProgress(selectedIntern)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Progress:</span> {calculateProgress(selectedIntern)}%
                  </p>
                </div>
              </div>

              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Assigned Tasks</h3>
                {selectedIntern.tasks && selectedIntern.tasks.length > 0 ? (
                  <ul className="list-disc pl-6 text-sm text-gray-600">
                    {Array.isArray(selectedIntern.tasks)
                      ? selectedIntern.tasks.map((task, index) => (
                          <li key={index} className="mb-2">{formatTaskText(task)}</li>
                        ))
                      : typeof selectedIntern.tasks === 'string'
                        ? (selectedIntern.tasks.startsWith('[') && selectedIntern.tasks.endsWith(']')
                          ? (() => {
                              try {
                                return JSON.parse(selectedIntern.tasks).map((task, index) => (
                                  <li key={index} className="mb-2">{formatTaskText(task)}</li>
                                ));
                              } catch (e) {
                                return selectedIntern.tasks
                                  .replace(/^\[|\]$/g, '')
                                  .split(',')
                                  .map((task, index) => (
                                    <li key={index} className="mb-2">{formatTaskText(task)}</li>
                                  ));
                              }
                            })()
                          : selectedIntern.tasks.split(',').map((task, index) => (
                              <li key={index} className="mb-2">{formatTaskText(task)}</li>
                            ))
                          )
                        : <li>Unable to display tasks</li>
                    }
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No tasks assigned</p>
                )}
              </div>

              {selectedIntern.assignedProjects && selectedIntern.assignedProjects.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Assigned Projects</h3>
                  <div className="space-y-4">
                    {selectedIntern.assignedProjects.map((project, index) => (
                      <div key={index} className="border border-gray-100 p-4 rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-900">{project.title}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(project.status)}`}>
                            {project.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{formatTaskText(project.description)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedIntern.attendance && selectedIntern.attendance.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Attendance</h3>
                  {/* Desktop Attendance Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Date', 'Status', 'Time In', 'Notes'].map((header, index) => (
                            <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedIntern.attendance.slice().reverse().slice(0, 5).map((record, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatDate(record.date)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(record.status)}`}>
                                {record.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{record.timeIn || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{record.notes || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile Attendance Cards */}
                  <div className="sm:hidden space-y-4">
                    {selectedIntern.attendance.slice().reverse().slice(0, 5).map((record, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <div><span className="font-medium">Date:</span> {formatDate(record.date)}</div>
                          <div><span className="font-medium">Status:</span> {record.status}</div>
                          <div><span className="font-medium">Time In:</span> {record.timeIn || 'N/A'}</div>
                          <div><span className="font-medium">Notes:</span> {record.notes || 'N/A'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedIntern.progressUpdates && selectedIntern.progressUpdates.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Progress Updates</h3>
                  <div className="space-y-4 max-h-60 overflow-y-auto">
                    {selectedIntern.progressUpdates.slice().reverse().map((update, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium text-gray-600">
                            {formatDate(update.date || update.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{update.content || update.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message Modal */}
        {selectedIntern && showMessageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl backdrop-blur-sm bg-opacity-95">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Send Message to {selectedIntern.name}</h2>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-all duration-200"
                >
                  <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>
              </div>

              <div className="mb-4 sm:mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  rows="5"
                  placeholder="Enter your message here..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="bg-gray-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-700 transition-all duration-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 text-sm"
                  disabled={!message.trim()}
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Project Modal */}
        {selectedProject && showProjectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl backdrop-blur-sm bg-opacity-95">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedProject.title}</h2>
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-all duration-200"
                >
                  <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>
              </div>

              <div className="mb-4 sm:mb-6">
                <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusClass(selectedProject.status)}`}>
                  Current Status: {selectedProject.status}
                </span>
              </div>

              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="bg-gray-50 p-4 rounded-lg text-gray-600 text-sm">{formatTaskText(selectedProject.description) || 'No description available.'}</p>
              </div>

              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Change Status</h3>
                <div className="flex flex-wrap gap-3">
                  {['In Progress', 'Completed', 'Incomplete'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleUpdateProjectStatus(selectedProject._id, status)}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium ${
                        selectedProject.status === status
                          ? `bg-${status === 'In Progress' ? 'blue' : status === 'Completed' ? 'emerald' : 'amber'}-100 text-${status === 'In Progress' ? 'blue' : status === 'Completed' ? 'emerald' : 'amber'}-800 border border-${status === 'In Progress' ? 'blue' : status === 'Completed' ? 'emerald' : 'amber'}-200`
                          : `bg-${status === 'In Progress' ? 'blue' : status === 'Completed' ? 'emerald' : 'amber'}-600 text-white hover:bg-${status === 'In Progress' ? 'blue' : status === 'Completed' ? 'emerald' : 'amber'}-700`
                      } transition-all duration-300`}
                      disabled={selectedProject.status === status}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Assigned Interns</h3>
                {selectedProject.assignedTo?.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {selectedProject.assignedTo.map((intern, index) => (
                      <li key={index} className="mb-2">
                        {typeof intern === 'string'
                          ? (interns.find(i => i._id === intern)?.name || intern)
                          : intern.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No interns assigned to this project.</p>
                )}
              </div>

              {selectedProject.feedback && selectedProject.feedback.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Feedback History</h3>
                  <div className="space-y-4 max-h-40 overflow-y-auto">
                    {selectedProject.feedback.slice().reverse().map((item, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-600">{formatTaskText(item.comment)}</p>
                        <div className="flex justify-between mt-2">
                          <span className="text-xs text-gray-500">From: {item.from}</span>
                          <span className="text-xs text-gray-500">{formatDate(item.date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedProject.tasks && selectedProject.tasks.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Tasks</h3>
                  <ul className="list-disc pl-6 text-sm text-gray-600">
                    {selectedProject.tasks.map((task, index) => (
                      <li key={index} className="mb-2">
                        {typeof task === 'string' ? formatTaskText(task) :
                          task.title ? formatTaskText(task.title) :
                            task.description ? formatTaskText(task.description) : 'Unnamed task'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Add Feedback</h3>
                <textarea
                  value={projectFeedback}
                  onChange={(e) => setProjectFeedback(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  rows="4"
                  placeholder="Enter feedback for the project..."
                />
                <div className="flex justify-end mt-4">
                  <button
                    onClick={async () => {
                      try {
                        if (!projectFeedback.trim()) return;

                        setLoading(true);
                        const token = localStorage.getItem('token');

                        await axiosInstance.put(
                          `/api/admin/projects/${selectedProject._id}`,
                          { feedback: projectFeedback },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );

                        const updatedProject = {
                          ...selectedProject,
                          feedback: [
                            ...(selectedProject.feedback || []),
                            {
                              comment: projectFeedback,
                              from: 'admin',
                              date: new Date()
                            }
                          ]
                        };

                        setSelectedProject(updatedProject);
                        setProjectFeedback('');
                        setProjects(prevProjects =>
                          prevProjects.map(p =>
                            p._id === selectedProject._id ? updatedProject : p
                          )
                        );

                        alert('Feedback added successfully!');
                      } catch (error) {
                        console.error('Error adding feedback:', error);
                        alert(`Failed to add feedback: ${error.response?.data?.error || error.message}`);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 text-sm"
                    disabled={!projectFeedback.trim()}
                  >
                    Add Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProtectedAdminDashboard() {
  return (
    <RouteGuard requireAdmin={true}>
      <Dashboard />
    </RouteGuard>
  );
}