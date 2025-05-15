"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import RouteGuard from '../../components/RouteGuard';
import Navbar from "../../components/navbar";
import Sidebar from "../../components/sidebar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardList, faEdit, faTrash, faPlus, faCheckCircle, faTimesCircle, 
  faExclamationTriangle, faProjectDiagram
} from '@fortawesome/free-solid-svg-icons';

function ProjectsManagement() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectFeedback, setProjectFeedback] = useState('');
  const [showAddProjectForm, setShowAddProjectForm] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    status: 'Not Started',
    assignedTo: []
  });

  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Request failed');
    }
    
    return await response.json();
  };

  const fetchProjects = async () => {
    try {
      const data = await fetchWithAuth('https://backend-internship-portal.vercel.app/api/admin/projects');
      setProjects(data);
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchInterns = async () => {
    try {
      const data = await fetchWithAuth('https://backend-internship-portal.vercel.app/api/interns');
      setInterns(data);
    } catch (error) {
      console.error('Error fetching interns:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchProjects(), fetchInterns()]);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Not Started': return 'bg-gray-100 text-gray-800';
      case 'Incomplete': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetchWithAuth('https://backend-internship-portal.vercel.app/api/admin/projects', {
        method: 'POST',
        body: JSON.stringify(newProject)
      });
      
      setProjects([...projects, response.project]);
      setShowAddProjectForm(false);
      setNewProject({
        title: '',
        description: '',
        status: 'Not Started',
        assignedTo: []
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      setLoading(true);
      await fetchWithAuth(`https://backend-internship-portal.vercel.app/api/admin/projects/${projectId}`, {
        method: 'DELETE'
      });
      
      setProjects(projects.filter(p => p._id !== projectId));
      if (selectedProject?._id === projectId) {
        setShowProjectModal(false);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProjectStatus = async (projectId, newStatus) => {
    try {
      setLoading(true);
      await fetchWithAuth(`https://backend-internship-portal.vercel.app/api/admin/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      
      setProjects(projects.map(p => 
        p._id === projectId ? { ...p, status: newStatus } : p
      ));
      
      if (selectedProject?._id === projectId) {
        setSelectedProject({ ...selectedProject, status: newStatus });
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeedback = async () => {
    try {
      if (!projectFeedback.trim()) return;
      
      setLoading(true);
      await fetchWithAuth(`https://backend-internship-portal.vercel.app/api/admin/projects/${selectedProject._id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          feedback: projectFeedback 
        })
      });
      
      const updatedFeedback = [
        ...(selectedProject.feedback || []),
        {
          comment: projectFeedback,
          from: 'admin',
          date: new Date()
        }
      ];
      
      setSelectedProject({ 
        ...selectedProject, 
        feedback: updatedFeedback 
      });
      
      setProjects(projects.map(p => 
        p._id === selectedProject._id ? 
        { ...p, feedback: updatedFeedback } : p
      ));
      
      setProjectFeedback('');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
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
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Projects</h2>
                  <button
                    onClick={() => setShowAddProjectForm(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Add New Project
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projects.map((project) => (
                        <tr key={project._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{project.title}</div>
                            <div className="text-xs text-gray-500">
                              {project.description?.slice(0, 50)}...
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
                                {project.assignedTo.map((intern, index) => (
                                  <li key={index} className="text-sm text-gray-500">
                                    {typeof intern === 'string'
                                      ? (interns.find(i => i._id === intern)?.name || intern)
                                      : intern.name}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-sm text-gray-500">Not assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(project.lastModified)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedProject(project);
                                  setShowProjectModal(true);
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                              >
                                <FontAwesomeIcon icon={faClipboardList} className="mr-1" />
                                Manage
                              </button>
                              <button
                                onClick={() => handleDeleteProject(project._id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                              >
                                <FontAwesomeIcon icon={faTrash} className="mr-1" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Add Project Modal */}
        {showAddProjectForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add New Project</h2>
                <button
                  onClick={() => setShowAddProjectForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon icon={faTimesCircle} size="lg" />
                </button>
              </div>

              <form onSubmit={handleAddProject}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={newProject.title}
                    onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Status
                  </label>
                  <select
                    value={newProject.status}
                    onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Incomplete">Incomplete</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Assign to Interns
                  </label>
                  <select
                    multiple
                    value={newProject.assignedTo}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setNewProject({...newProject, assignedTo: selected});
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    size="4"
                  >
                    {interns.map(intern => (
                      <option key={intern._id} value={intern._id}>
                        {intern.name} ({intern.email})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddProjectForm(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg mr-2 hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    Add Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Project Details Modal */}
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
                  Status: {selectedProject.status}
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="bg-gray-50 p-4 rounded">{selectedProject.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Change Status</h3>
                <div className="flex space-x-2">
                  {['In Progress', 'Completed', 'Incomplete'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateProjectStatus(selectedProject._id, status)}
                      className={`px-3 py-2 rounded text-sm font-medium ${
                        selectedProject.status === status
                          ? `bg-${status === 'In Progress' ? 'blue' : status === 'Completed' ? 'green' : 'yellow'}-100 text-${status === 'In Progress' ? 'blue' : status === 'Completed' ? 'green' : 'yellow'}-800 border border-${status === 'In Progress' ? 'blue' : status === 'Completed' ? 'green' : 'yellow'}-800`
                          : `bg-${status === 'In Progress' ? 'blue' : status === 'Completed' ? 'green' : 'yellow'}-500 text-white hover:bg-${status === 'In Progress' ? 'blue' : status === 'Completed' ? 'green' : 'yellow'}-600`
                      }`}
                      disabled={selectedProject.status === status}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Assigned Interns</h3>
                {selectedProject.assignedTo?.length > 0 ? (
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
                  <p className="text-gray-500">No interns assigned</p>
                )}
              </div>

              {selectedProject.feedback?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Feedback</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedProject.feedback.map((item, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded border">
                        <p className="text-sm">{item.comment}</p>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500">From: {item.from}</span>
                          <span className="text-xs text-gray-500">{formatDate(item.date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Add Feedback</h3>
                <textarea
                  value={projectFeedback}
                  onChange={(e) => setProjectFeedback(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter your feedback..."
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleAddFeedback}
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

export default function ProtectedProjectsPage() {
  return (
    <RouteGuard requireAdmin={true}>
      <ProjectsManagement />
    </RouteGuard>
  );
}