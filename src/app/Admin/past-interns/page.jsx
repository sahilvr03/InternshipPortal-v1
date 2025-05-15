"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import RouteGuard from '../../components/RouteGuard';
import Navbar from "../../components/navbar";
import Sidebar from "../../components/sidebar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHistory, faEye, faUserGraduate, faFileAlt,
  faCalendarCheck, faTimesCircle, faCheckCircle,
  faChartLine, faTasks, faCertificate,  faProjectDiagram
} from '@fortawesome/free-solid-svg-icons';

function PastInternsManagement() {
  const { user } = useAuth();
  const [pastInterns, setPastInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [viewInternModalOpen, setViewInternModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch past interns with filtering
  useEffect(() => {
    const fetchPastInterns = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get('https://backend-internship-portal.vercel.app/api/interns/past', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setPastInterns(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching past interns:', error);
        setError(error.response?.data?.error || 'Failed to load past interns');
      } finally {
        setLoading(false);
      }
    };

    fetchPastInterns();
  }, []);

  // Filter interns based on search term
  const filteredInterns = pastInterns.filter(intern => {
    const searchLower = searchTerm.toLowerCase();
    return (
      intern.name.toLowerCase().includes(searchLower) ||
      intern.email.toLowerCase().includes(searchLower) ||
      (intern.student?.name.toLowerCase().includes(searchLower)) ||
      (intern.deletedProjects?.some(p => 
        p.title.toLowerCase().includes(searchLower)
      ))
    );
  });

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Open intern details modal
  const openInternDetails = async (internId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://backend-internship-portal.vercel.app/api/interns/past/${internId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSelectedIntern(response.data);
      setViewInternModalOpen(true);
    } catch (error) {
      console.error('Error fetching intern details:', error);
      setError('Failed to load intern details');
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
            <h1 className="text-3xl font-bold text-gray-900">Past Interns</h1>
            <p className="mt-1 text-sm text-gray-600">
              View and manage interns who have completed their internship
            </p>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <h2 className="text-xl font-semibold mb-4 md:mb-0">
                    <FontAwesomeIcon icon={faHistory} className="mr-2 text-gray-600" />
                    Completed Internships
                  </h2>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search interns or projects..."
                        className="pl-10 pr-4 py-2 border rounded-lg w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <div className="absolute left-3 top-2.5 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center">
                      <span>Total: {filteredInterns.length}</span>
                    </div>
                  </div>
                </div>

                {filteredInterns.length === 0 ? (
                  <div className="text-center py-8">
                    <FontAwesomeIcon icon={faUserGraduate} className="text-gray-300 text-5xl mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No past interns found</h3>
                    <p className="text-gray-500 mt-1">
                      {searchTerm ? 'Try a different search term' : 'All current interns are active'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intern</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredInterns.map((intern) => (
                          <tr key={intern._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                  {intern.student?.profilePicture ? (
                                    <img 
                                      src={`https://backend-internship-portal.vercel.app/uploads/${intern.student.profilePicture}`} 
                                      alt={intern.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <FontAwesomeIcon icon={faUserGraduate} className="text-gray-500" />
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {intern.name}
                                    {intern.student?.username && (
                                      <span className="text-xs text-gray-500 ml-2">@{intern.student.username}</span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">{intern.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {intern.duration || 'N/A'} {intern.duration === 1 ? 'month' : 'months'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                  <div 
                                    className="bg-green-600 h-2.5 rounded-full" 
                                    style={{ width: `${intern.completionRate || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-medium">
                                  {intern.completionRate || 0}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(intern.endDate || intern.deletedAt)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {intern.deletedProjects?.slice(0, 3).map((project, idx) => (
                                  <span 
                                    key={idx} 
                                    className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(project.status)}`}
                                  >
                                    {project.title}
                                  </span>
                                ))}
                                {intern.deletedProjects?.length > 3 && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                                    +{intern.deletedProjects.length - 3} more
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => openInternDetails(intern._id)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                <FontAwesomeIcon icon={faEye} className="mr-1" />
                                View
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
          </div>
        </main>

        {/* Intern Details Modal */}
        {selectedIntern && viewInternModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedIntern.name}
                    </h2>
                    <p className="text-gray-600">{selectedIntern.email}</p>
                  </div>
                  <button
                    onClick={() => setViewInternModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FontAwesomeIcon icon={faTimesCircle} size="lg" />
                  </button>
                </div>

                {/* Intern Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FontAwesomeIcon icon={faChartLine} className="text-blue-500 mr-2" />
                      <h3 className="font-medium">Performance Summary</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Completion Rate</p>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                            <div 
                              className="bg-green-600 h-2.5 rounded-full" 
                              style={{ width: `${selectedIntern.completionRate || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {selectedIntern.completionRate || 0}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Projects Completed</p>
                        <p className="font-medium">
                          {selectedIntern.stats?.completedProjects || 0} of {selectedIntern.stats?.totalProjects || 0}
                        </p>
                      </div>
                      {selectedIntern.projectRating && (
                        <div>
                          <p className="text-sm text-gray-500">Performance Rating</p>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <FontAwesomeIcon 
                                key={i}
                                icon={faStar} 
                                className={`${i < selectedIntern.projectRating ? 'text-yellow-400' : 'text-gray-300'} text-sm`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FontAwesomeIcon icon={faCalendarCheck} className="text-green-500 mr-2" />
                      <h3 className="font-medium">Internship Period</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-medium">
                          {selectedIntern.duration || 'N/A'} {selectedIntern.duration === 1 ? 'month' : 'months'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="font-medium">
                          {formatDate(selectedIntern.joiningDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="font-medium">
                          {formatDate(selectedIntern.endDate || selectedIntern.deletedAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="flex items-center mb-2">
                      <FontAwesomeIcon icon={faTasks} className="text-purple-500 mr-2" />
                      <h3 className="font-medium">Attendance</h3>
                    </div>
                    {selectedIntern.attendance?.length > 0 ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-green-50 p-2 rounded text-center">
                            <p className="text-xs text-gray-600">Present</p>
                            <p className="font-medium text-green-600">
                              {selectedIntern.stats?.attendance?.present || 0}
                            </p>
                          </div>
                          <div className="bg-red-50 p-2 rounded text-center">
                            <p className="text-xs text-gray-600">Absent</p>
                            <p className="font-medium text-red-600">
                              {selectedIntern.stats?.attendance?.absent || 0}
                            </p>
                          </div>
                          <div className="bg-yellow-50 p-2 rounded text-center">
                            <p className="text-xs text-gray-600">Late</p>
                            <p className="font-medium text-yellow-600">
                              {selectedIntern.stats?.attendance?.late || 0}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Attendance Rate</p>
                          <p className="font-medium">
                            {selectedIntern.stats?.attendance?.total ? 
                              Math.round(
                                (selectedIntern.stats.attendance.present / 
                                selectedIntern.stats.attendance.total) * 100
                              ) : 0
                            }%
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No attendance records</p>
                    )}
                  </div>
                </div>

                {/* Projects Section */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <FontAwesomeIcon icon={faProjectDiagram} className="text-blue-500 mr-2" />
                    <h3 className="text-lg font-medium">Projects</h3>
                    <span className="ml-auto bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                      {selectedIntern.deletedProjects?.length || 0} projects
                    </span>
                  </div>

                  {selectedIntern.deletedProjects?.length > 0 ? (
                    <div className="space-y-4">
                      {selectedIntern.deletedProjects.map((project, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{project.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {project.description || 'No description available'}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(project.status)}`}>
                              {project.status}
                            </span>
                          </div>
                          
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Period</p>
                              <p className="text-sm">
                                {formatDate(project.startDate)} - {formatDate(project.endDate) || 'Ongoing'}
                              </p>
                            </div>
                            
                            {project.feedback?.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500">Last Feedback</p>
                                <p className="text-sm line-clamp-2">
                                  {project.feedback[project.feedback.length - 1].comment}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {project.attachments?.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-500 mb-1">Attachments</p>
                              <div className="flex flex-wrap gap-2">
                                {project.attachments.map((file, idx) => (
                                  <a 
                                    key={idx}
                                    href={`https://backend-internship-portal.vercel.app/uploads/${file.filePath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline flex items-center"
                                  >
                                    <FontAwesomeIcon icon={faFileAlt} className="mr-1" />
                                    {file.fileName}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <FontAwesomeIcon icon={faProjectDiagram} className="text-gray-300 text-3xl mb-2" />
                      <p className="text-gray-500">No projects assigned</p>
                    </div>
                  )}
                </div>

                {/* Tasks Section */}
                {selectedIntern.tasks?.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center mb-4">
                      <FontAwesomeIcon icon={faTasks} className="text-purple-500 mr-2" />
                      <h3 className="text-lg font-medium">Assigned Tasks</h3>
                    </div>
                    <ul className="list-disc pl-5 space-y-2">
                      {Array.isArray(selectedIntern.tasks) ? (
                        selectedIntern.tasks.map((task, index) => (
                          <li key={index} className="text-sm">
                            {task}
                          </li>
                        ))
                      ) : (
                        <li className="text-sm">{selectedIntern.tasks}</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Progress Updates */}
                {selectedIntern.progressUpdates?.length > 0 && (
                  <div>
                    <div className="flex items-center mb-4">
                      <FontAwesomeIcon icon={faChartLine} className="text-blue-500 mr-2" />
                      <h3 className="text-lg font-medium">Progress Updates</h3>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {[...selectedIntern.progressUpdates].reverse().map((update, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                          <div className="flex justify-between items-start">
                            <p className="text-sm">{update.content}</p>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {formatDate(update.timestamp || update.date)}
                            </span>
                          </div>
                          {update.feedback && (
                            <div className="mt-2 bg-gray-50 p-2 rounded">
                              <p className="text-xs font-medium text-gray-700">Admin Feedback:</p>
                              <p className="text-xs">{update.feedback}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProtectedPastInternsPage() {
  return (
    <RouteGuard requireAdmin={true}>
      <PastInternsManagement />
    </RouteGuard>
  );
}