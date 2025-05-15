
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import RouteGuard from '../../components/RouteGuard';
import Navbar from "../../components/navbar";
import Sidebar from "../../components/sidebar";
import dynamic from "next/dynamic";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faTrash, faPencilAlt, faEye,
  faCheckCircle, faTimesCircle, faExclamationTriangle,
  faGraduationCap, faProjectDiagram, faClipboardList,
  faSignOutAlt, faPlus, faAngleDown, faAngleUp
} from '@fortawesome/free-solid-svg-icons';

// Dynamically import ApexCharts with SSR disabled
const ApexCharts = dynamic(() => import("apexcharts"), { ssr: false });

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
  const [attendanceStatus, setAttendanceStatus] = useState('Present');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [viewInternModalOpen, setViewInternModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectFeedback, setProjectFeedback] = useState('');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize chart
  useEffect(() => {
    setIsMounted(true);

    if (typeof window !== "undefined" && !loading && stats.students > 0) {
      const initializeChart = async () => {
        const ApexCharts = (await import("apexcharts")).default;

        const options = {
          chart: {
            type: "bar",
            height: 350,
          },
          series: [{
            name: "Internships",
            data: [stats.activeInterns, stats.completedProjects, projects.length, pastInterns.length],
          }],
          xaxis: {
            categories: ["Active Interns", "Completed Projects", "Total Projects", "Past Interns"],
          },
          fill: {
            type: 'gradient',
            gradient: {
              shade: 'dark',
              type: "horizontal",
              shadeIntensity: 0.5,
              gradientToColors: undefined,
              inverseColors: true,
              opacityFrom: 1,
              opacityTo: 1,
              stops: [0, 50, 100],
              colorStops: []
            }
          }
        };

        // Clear previous chart if exists
        const chartElement = document.querySelector("#chart");
        if (chartElement) chartElement.innerHTML = "";

        const chart = new ApexCharts(document.querySelector("#chart"), options);
        chart.render();
      };

      initializeChart();
    }

    return () => {
      const chartElement = document.querySelector("#chart");
      if (chartElement) chartElement.innerHTML = "";
    };
  }, [loading, stats, projects.length, pastInterns.length]);

  // Fetch dashboard data
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

        // Get interns data
        const internsResponse = await axios.get('https://backend-internship-portal.vercel.app/api/interns', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Get projects
        const projectsResponse = await axios.get('https://backend-internship-portal.vercel.app/api/admin/projects', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Set the interns data
        setInterns(internsResponse.data || []);
        setProjects(projectsResponse.data || []);

        // Try to get past interns
        try {
          const pastInternsResponse = await axios.get('https://backend-internship-portal.vercel.app/api/interns/past', {
            headers: { Authorization: `Bearer ${token}` }
          });

          console.log("Past interns data:", pastInternsResponse.data);
          setPastInterns(pastInternsResponse.data || []);
        } catch (err) {
          console.error('Error fetching past interns:', err);
          setPastInterns([]);
        }

        // Calculate stats
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

  // All your existing functions for handling interns and projects
  const handleUpdateProjectStatus = async (projectId, newStatus) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication token not found');
        return;
      }

      // Get current date/time for the feedback message
      const now = new Date();
      const formattedDate = now.toLocaleString();

      // Use the correct API endpoint with the project ID
      const response = await axios.put(
        `https://backend-internship-portal.vercel.app/api/admin/projects/${projectId}`,
        {
          status: newStatus,
          feedback: `Project status updated to ${newStatus} at ${formattedDate}`
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update the project in the local state
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

      // If the project is currently selected in the modal, update that too
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

  // Handle adding a new intern
  const handleAddIntern = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Format the tasks correctly
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

      // Create form data for file upload
      const formData = new FormData();
      formData.append('name', newIntern.name);
      formData.append('email', newIntern.email);
      formData.append('username', newIntern.username);

      // Use provided password or generate random one
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
      // Add intern to database using the correct endpoint
      await axios.post('https://backend-internship-portal.vercel.app/api/interns', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Refresh interns list
      const response = await axios.get('https://backend-internship-portal.vercel.app/api/interns', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setInterns(response.data);

      // Update stats
      setStats(prev => ({
        ...prev,
        students: response.data.length,
        activeInterns: response.data.length
      }));

      // Reset form
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

  // Handle updating an intern
  const handleUpdateIntern = async (e) => {
    e.preventDefault();

    if (!selectedIntern) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Format the tasks if entered as comma-separated
      const formattedTasks = Array.isArray(newIntern.tasks)
        ? newIntern.tasks
        : newIntern.tasks.split(',').map(task => task.trim());

      // Create form data for file upload
      const formData = new FormData();
      formData.append('name', newIntern.name);
      formData.append('email', newIntern.email);
      formData.append('duration', newIntern.duration);
      formData.append('tasks', JSON.stringify(formattedTasks));

      if (internFile) {
        formData.append('resume', internFile);
      }

      // Update intern in database using correct endpoint
      await axios.put(`https://backend-internship-portal.vercel.app/api/interns/${selectedIntern._id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // If username or password is provided, update credentials
      if (newIntern.username || newIntern.password) {
        const credentialsData = {};
        if (newIntern.username) credentialsData.username = newIntern.username;
        if (newIntern.password) credentialsData.password = newIntern.password;

        await axios.put(
          `https://backend-internship-portal.vercel.app/api/interns/${selectedIntern._id}/credentials`,
          credentialsData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Refresh interns list
      const response = await axios.get('https://backend-internship-portal.vercel.app/api/interns', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setInterns(response.data);

      // Reset form
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
    if (!confirm('Are you sure you want to delete this intern?')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Delete intern using the correct endpoint
      const deleteResponse = await axios.delete(`https://backend-internship-portal.vercel.app/api/interns/${internId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Delete response:", deleteResponse.data);

      // Refresh interns list
      const response = await axios.get('https://backend-internship-portal.vercel.app/api/interns', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setInterns(response.data);

      // Update stats
      setStats(prev => ({
        ...prev,
        students: response.data.length,
        activeInterns: response.data.length
      }));

      // Explicitly fetch past interns to update the list
      const pastResponse = await axios.get('https://backend-internship-portal.vercel.app/api/interns/past', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Past interns after deletion:", pastResponse.data);
      setPastInterns(pastResponse.data || []);

      alert('Intern moved to past interns successfully!');
    } catch (error) {
      console.error('Error deleting intern:', error);
      alert(`Failed to delete intern: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle sending a message to an intern
  const handleSendMessage = async () => {
    if (!selectedIntern || !message.trim()) {
      alert('Please select an intern and enter a message');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Add a progress update with the message
      await axios.post(
        `https://backend-internship-portal.vercel.app/api/interns/${selectedIntern._id}/progress`,
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

  // Handle recording attendance for an intern
  const handleRecordAttendance = async (internId, status) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Get the current date and time
      const now = new Date();
      const timeIn = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      await axios.post(
        `https://backend-internship-portal.vercel.app/api/interns/${internId}/attendance`,
        {
          date: now.toISOString(),
          status,
          timeIn,
          notes: `Marked by admin: ${user?.name || 'Admin'}`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh intern data
      const response = await axios.get('https://backend-internship-portal.vercel.app/api/interns', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setInterns(response.data);

      alert(`Attendance for ${interns.find(intern => intern._id === internId)?.name || 'intern'} marked as ${status}`);

      if (selectedIntern && selectedIntern._id === internId) {
        // Update the selected intern if they were the one marked
        const updatedIntern = response.data.find(i => i._id === internId);
        if (updatedIntern) {
          setSelectedIntern(updatedIntern);
        }
      }

    } catch (error) {
      console.error('Error recording attendance:', error);
      alert(`Failed to record attendance: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Open edit intern form
  const openEditInternForm = (intern) => {
    setSelectedIntern(intern);

    // Properly format tasks for editing
    let tasksForForm = '';
    if (Array.isArray(intern.tasks)) {
      // Join array items but remove any quotes
      tasksForForm = intern.tasks
        .map(task => typeof task === 'string' ? task.replace(/['"]+/g, '') : task)
        .join(', ');
    } else if (typeof intern.tasks === 'string') {
      // If it's already a string, just clean it up
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

  // Open add intern form
  const openAddInternForm = () => {
    // Generate a random username and password
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

  // Open attendance modal for specific intern
  const openAttendanceModal = (intern) => {
    setSelectedIntern(intern);
    setAttendanceStatus('Present');
    setShowAttendanceModal(true);
  };

  // Open message modal for specific intern
  const openMessageModal = (intern) => {
    setSelectedIntern(intern);
    setShowMessageModal(true);
  };

  // Open view intern modal
  const openViewInternModal = (intern) => {
    setSelectedIntern(intern);
    setViewInternModalOpen(true);
  };

  // Open project modal
  const openProjectModal = (project) => {
    setSelectedProject(project);
    setProjectFeedback('');
    setShowProjectModal(true);
  };

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate progress for an intern
  const calculateProgress = (intern) => {
    if (!intern) return 0;

    // If there are progress updates, use those
    if (intern.progressUpdates && intern.progressUpdates.length > 0) {
      return Math.min(Math.round((intern.progressUpdates.length / 10) * 100), 100);
    }

    // Check projects status
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

  // Get status class
  const getStatusClass = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      case 'Late':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Not Started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
              Logout
            </button>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">

            {/* Quick Stats Cards - Styled like the previous dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-lg font-semibold text-gray-700">
                  Total Internships
                </h2>
                <p className="text-3xl font-bold text-indigo-600">{stats.students}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-lg font-semibold text-gray-700">
                  Active Interns
                </h2>
                <p className="text-3xl font-bold text-green-600">{stats.activeInterns}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-lg font-semibold text-gray-700">
                  Completed Projects
                </h2>
                <p className="text-3xl font-bold text-red-600">{stats.completedProjects}</p>
              </div>
            </div>

            {/* Chart Section - From previous dashboard */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Internship Progress
              </h2>
              {isMounted && <div id="chart"></div>}
            </div>

            {/* Tabs for Interns and Projects */}
            <div className="bg-white shadow rounded-lg">
              <div className="border-b">
                <nav className="flex">
                  <button
                    className={`px-4 py-3 font-medium ${activeTab === 'interns' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                    onClick={() => setActiveTab('interns')}
                  >
                    <FontAwesomeIcon icon={faGraduationCap} className="mr-2" />
                    Current Interns
                  </button>
                  <button
                    className={`px-4 py-3 font-medium ${activeTab === 'projects' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                    onClick={() => setActiveTab('projects')}
                  >
                    <FontAwesomeIcon icon={faProjectDiagram} className="mr-2" />
                    Projects
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'interns' && (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Intern Management</h2>
                      <div className="space-x-2">
                        <button
                          onClick={openAddInternForm}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        >
                          <FontAwesomeIcon icon={faPlus} className="mr-2" />
                          Add New Intern
                        </button>
                        <button
                          onClick={() => setShowPastInterns(!showPastInterns)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
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
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <h3 className="text-lg font-medium mb-2">Current Interns</h3>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {interns.length > 0 ? (
                            interns.map((intern) => (
                              <tr key={intern._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                      {intern.name ? intern.name.charAt(0).toUpperCase() : 'S'}
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{intern.name}</div>
                                      <div className="text-sm text-gray-500">{intern.username}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{intern.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                      className="bg-blue-600 h-2.5 rounded-full"
                                      style={{ width: `${calculateProgress(intern)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-500">{calculateProgress(intern)}%</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(intern.lastActive)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={() => handleRecordAttendance(intern._id, 'Present')}
                                      className="p-1 rounded bg-green-500 text-white hover:bg-green-600"
                                      title="Mark Present"
                                    >
                                      <FontAwesomeIcon icon={faCheckCircle} />
                                    </button>
                                    <button
                                      onClick={() => handleRecordAttendance(intern._id, 'Absent')}
                                      className="p-1 rounded bg-red-500 text-white hover:bg-red-600"
                                      title="Mark Absent"
                                    >
                                      <FontAwesomeIcon icon={faTimesCircle} />
                                    </button>
                                    <button
                                      onClick={() => handleRecordAttendance(intern._id, 'Late')}
                                      className="p-1 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                                      title="Mark Late"
                                    >
                                      <FontAwesomeIcon icon={faExclamationTriangle} />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => openViewInternModal(intern)}
                                      className="text-blue-600 hover:text-blue-900"
                                      title="View Details"
                                    >
                                      <FontAwesomeIcon icon={faEye} />
                                    </button>
                                    <button
                                      onClick={() => openEditInternForm(intern)}
                                      className="text-green-600 hover:text-green-900"
                                      title="Edit Intern"
                                    >
                                      <FontAwesomeIcon icon={faPencilAlt} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteIntern(intern._id)}
                                      className="text-red-600 hover:text-red-900"
                                      title="Delete Intern"
                                    >
                                      <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                    <button
                                      onClick={() => openMessageModal(intern)}
                                      className="text-purple-600 hover:text-purple-900"
                                      title="Send Message"
                                    >
                                      <FontAwesomeIcon icon={faClipboardList} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No interns found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {showPastInterns && (
                      <div className="mt-8">
                        <h3 className="text-lg font-medium mb-2">Past Interns</h3>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Progress</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Removed On</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {pastInterns.length > 0 ? (
                              pastInterns.map((intern) => (
                                <tr key={intern._id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                        {intern.name ? intern.name.charAt(0).toUpperCase() : 'S'}
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{intern.name}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{intern.email}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                      <div
                                        className="bg-blue-600 h-2.5 rounded-full"
                                        style={{ width: `${intern.progress || 0}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs text-gray-500">{intern.progress || 0}%</span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(intern.deletedAt)}
                                  </td>
                                  <td className="px-6 py-4">
                                    {intern.deletedProjects && intern.deletedProjects.length > 0 ? (
                                      <ul className="list-disc pl-5 max-h-32 overflow-y-auto">
                                        {intern.deletedProjects.map((project, idx) => (
                                          <li key={idx} className="text-sm">
                                            {project.title}
                                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${project.status === "Completed" ? "bg-green-100 text-green-800" :
                                                project.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                                                  "bg-yellow-100 text-yellow-800"
                                              }`}>
                                              {project.status}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <span className="text-gray-500">No projects</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No past interns found.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'projects' && (
                  <>
                    <h2 className="text-xl font-semibold mb-4">Project Management</h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {projects.length > 0 ? (
                            projects.map((project) => (
                              <tr key={project._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{project.title}</div>
                                  <div className="text-xs text-gray-500">
                                    {project.description && project.description.length > 50
                                      ? `${formatTaskText(project.description.slice(0, 50))}...`
                                      : formatTaskText(project.description) || 'No description'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(project.status)}`}>
                                    {project.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {project.assignedTo?.length > 0 ? (
                                    <ul className="list-disc pl-5">
                                      {project.assignedTo.map((student, index) => (
                                        <li key={index} className="text-sm text-gray-500">
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(project.lastModified || project.updatedAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => openProjectModal(project)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                                  >
                                    <FontAwesomeIcon icon={faClipboardList} className="mr-1" />
                                    Manage
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No projects found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Additional Content Section - From previous dashboard */}
            {/* <div className="mt-6 bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold text-gray-700">
                Recent Activities
              </h2>
              <div className="text-gray-600 mt-2 max-h-48 overflow-y-auto">
                {projects.length > 0 && projects.slice(0, 5).map((project, index) => (
                  <div key={index} className="border-b border-gray-100 py-2 last:border-b-0">
                    <p className="mb-1">
                      <span className="font-medium">{project.title}</span> -
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getStatusClass(project.status)}`}>
                        {project.status}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">Last updated: {formatDate(project.lastModified || project.updatedAt)}</p>
                  </div>
                ))}
                {projects.length === 0 && (
                  <p>No recent activities found.</p>
                )}
              </div>
            </div> */}
          </div>
        </main>

        {/* Add Intern Form Modal */}
        {showAddInternForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{selectedIntern ? 'Edit Intern' : 'Add New Intern'}</h2>
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
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimesCircle} size="lg" />
                </button>
              </div>

              <form onSubmit={selectedIntern ? handleUpdateIntern : handleAddIntern}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newIntern.name}
                    onChange={(e) => setNewIntern({ ...newIntern, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newIntern.email}
                    onChange={(e) => setNewIntern({ ...newIntern, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Duration (months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newIntern.duration}
                    onChange={(e) => setNewIntern({ ...newIntern, duration: parseInt(e.target.value) })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Tasks (comma separated)
                  </label>
                  <textarea
                    value={newIntern.tasks}
                    onChange={(e) => setNewIntern({ ...newIntern, tasks: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={newIntern.username}
                    onChange={(e) => setNewIntern({ ...newIntern, username: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      {selectedIntern ? "New Password (leave blank to keep current)" : "Password"}
                    </label>
                    {selectedIntern && (
                      <button
                        type="button"
                        onClick={() => setShowPasswordField(!showPasswordField)}
                        className="text-xs text-blue-500"
                      >
                        {showPasswordField ? "Hide Password Field" : "Change Password"}
                      </button>
                    )}
                  </div>
                  {(!selectedIntern || showPasswordField) && (
                    <input
                      type="password"
                      value={newIntern.password}
                      onChange={(e) => setNewIntern({ ...newIntern, password: e.target.value })}
                      required={!selectedIntern}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Resume (PDF)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setInternFile(e.target.files[0])}
                    accept=".pdf"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddInternForm(false);
                      setSelectedIntern(null);
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg mr-2 hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{selectedIntern.name}</h2>
                <button
                  onClick={() => setViewInternModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimesCircle} size="lg" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-md font-medium mb-2">Basic Information</h3>
                  <p><span className="font-medium">Email:</span> {selectedIntern.email}</p>
                  <p><span className="font-medium">Username:</span> {selectedIntern.username}</p>
                  <p><span className="font-medium">Duration:</span> {selectedIntern.duration} months</p>
                  <p><span className="font-medium">Last Active:</span> {formatDate(selectedIntern.lastActive)}</p>
                </div>

                <div>
                  <h3 className="text-md font-medium mb-2">Progress</h3>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${calculateProgress(selectedIntern)}%` }}
                    ></div>
                  </div>
                  <p><span className="font-medium">Progress:</span> {calculateProgress(selectedIntern)}%</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-md font-medium mb-2">Assigned Tasks</h3>
                {selectedIntern.tasks && selectedIntern.tasks.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {Array.isArray(selectedIntern.tasks)
                      ? selectedIntern.tasks.map((task, index) => (
                        <li key={index} className="mb-1">{formatTaskText(task)}</li>
                      ))
                      : typeof selectedIntern.tasks === 'string'
                        ? (selectedIntern.tasks.startsWith('[') && selectedIntern.tasks.endsWith(']')
                          ? (() => {
                            try {
                              return JSON.parse(selectedIntern.tasks).map((task, index) => (
                                <li key={index} className="mb-1">{formatTaskText(task)}</li>
                              ));
                            } catch (e) {
                              // If parsing fails, split by comma
                              return selectedIntern.tasks
                                .replace(/^\[|\]$/g, '') // Remove brackets if present
                                .split(',')
                                .map((task, index) => (
                                  <li key={index} className="mb-1">{formatTaskText(task)}</li>
                                ));
                            }
                          })()
                          : // Otherwise, split by comma
                          selectedIntern.tasks.split(',').map((task, index) => (
                            <li key={index} className="mb-1">{formatTaskText(task)}</li>
                          ))
                        )
                        : <li>Unable to display tasks</li>
                    }
                  </ul>
                ) : (
                  <p className="text-gray-500">No tasks assigned</p>
                )}
              </div>

              {selectedIntern.assignedProjects && selectedIntern.assignedProjects.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-2">Assigned Projects</h3>
                  <div className="space-y-2">
                    {selectedIntern.assignedProjects.map((project, index) => (
                      <div key={index} className="border p-3 rounded">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{project.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(project.status)}`}>
                            {project.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{formatTaskText(project.description)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedIntern.attendance && selectedIntern.attendance.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-2">Recent Attendance</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time In</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedIntern.attendance.slice().reverse().slice(0, 5).map((record, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {formatDate(record.date)}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${getStatusClass(record.status)}`}
                              >
                                {record.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {record.timeIn || 'N/A'}
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

              {selectedIntern.progressUpdates && selectedIntern.progressUpdates.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-2">Progress Updates</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedIntern.progressUpdates.slice().reverse().map((update, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded border">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-gray-600">
                            {formatDate(update.date || update.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm">{update.content || update.text}</p>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Send Message to {selectedIntern.name}</h2>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimesCircle} size="lg" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows="5"
                  placeholder="Enter your message here..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg mr-2 hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{selectedProject.title}</h2>
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimesCircle} size="lg" />
                </button>
              </div>

              <div className="mb-4">
                <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-md ${getStatusClass(selectedProject.status)}`}>
                  Current Status: {selectedProject.status}
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="bg-gray-50 p-4 rounded">{formatTaskText(selectedProject.description) || 'No description available.'}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Change Status</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUpdateProjectStatus(selectedProject._id, 'In Progress')}
                    className={`px-3 py-2 rounded text-sm font-medium ${selectedProject.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-800 border border-blue-800'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    disabled={selectedProject.status === 'In Progress'}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleUpdateProjectStatus(selectedProject._id, 'Completed')}
                    className={`px-3 py-2 rounded text-sm font-medium ${selectedProject.status === 'Completed'
                        ? 'bg-green-100 text-green-800 border border-green-800'
                        : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    disabled={selectedProject.status === 'Completed'}
                  >
                    Completed
                  </button>
                  <button
                    onClick={() => handleUpdateProjectStatus(selectedProject._id, 'Incomplete')}
                    className={`px-3 py-2 rounded text-sm font-medium ${selectedProject.status === 'Incomplete'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-800'
                        : 'bg-yellow-500 text-white hover:bg-yellow-600'
                      }`}
                    disabled={selectedProject.status === 'Incomplete'}
                  >
                    Incomplete
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Assigned Interns</h3>
                {selectedProject.assignedTo && selectedProject.assignedTo.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {selectedProject.assignedTo.map((intern, index) => (
                      <li key={index} className="mb-1">
                        {typeof intern === 'string'
                          ? (interns.find(i => i._id === intern)?.name || intern)
                          : intern.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No interns assigned to this project.</p>
                )}
              </div>

              {selectedProject.feedback && selectedProject.feedback.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Feedback History</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedProject.feedback.slice().reverse().map((item, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded border">
                        <p className="text-sm">{formatTaskText(item.comment)}</p>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500">From: {item.from}</span>
                          <span className="text-xs text-gray-500">{formatDate(item.date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedProject.tasks && selectedProject.tasks.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Project Tasks</h3>
                  <ul className="list-disc pl-5">
                    {selectedProject.tasks.map((task, index) => (
                      <li key={index} className="mb-1">
                        {typeof task === 'string' ? formatTaskText(task) :
                          task.title ? formatTaskText(task.title) :
                            task.description ? formatTaskText(task.description) : 'Unnamed task'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Add Feedback</h3>
                <textarea
                  value={projectFeedback}
                  onChange={(e) => setProjectFeedback(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter feedback for the project..."
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={async () => {
                      try {
                        if (!projectFeedback.trim()) return;

                        setLoading(true);
                        const token = localStorage.getItem('token');

                        await axios.put(
                          `https://backend-internship-portal.vercel.app/api/admin/projects/${selectedProject._id}`,
                          { feedback: projectFeedback },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );

                        // Update local state
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

                        // Update in projects array
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
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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