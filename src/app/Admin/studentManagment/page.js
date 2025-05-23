// pages/StudentManagement.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import RouteGuard from '../../components/RouteGuard';
import Navbar from '../../components/navbar';
import Sidebar from '../../components/sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faTrash, faEye, faDownload,
  faCheckCircle, faTimesCircle, faExclamationTriangle,
  faSignOutAlt, faPlus
} from '@fortawesome/free-solid-svg-icons';

// Base URL from environment variable
const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:8000'; // Fallback URL if env variable is unset

function StudentManagement() {
  const { user, logout } = useAuth();
  const [students, setStudents] = useState([]);
  const [pastInterns, setPastInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewStudentModalOpen, setViewStudentModalOpen] = useState(false);
  const [showPastInterns, setShowPastInterns] = useState(false);

  useEffect(() => {
    const fetchStudentsData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
          return;
        }

        // Common headers for all Fetch requests
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        // Fetch current interns
        const internsResponse = await fetch(`${BASE_URL}/api/interns`, {
          method: 'GET',
          headers,
        });
        if (!internsResponse.ok) {
          throw new Error(`Failed to fetch interns: ${internsResponse.status} ${internsResponse.statusText}`);
        }
        const internsData = await internsResponse.json();

        // Fetch past interns
        const pastInternsResponse = await fetch(`${BASE_URL}/api/interns/past`, {
          method: 'GET',
          headers,
        });
        if (!pastInternsResponse.ok) {
          throw new Error(`Failed to fetch past interns: ${pastInternsResponse.status} ${pastInternsResponse.statusText}`);
        }
        const pastInternsData = await pastInternsResponse.json();

        // Fetch student details for each intern
        const internsWithStudentDetails = await Promise.all(
          internsData.map(async (intern) => {
            if (intern.student) {
              try {
                const studentResponse = await fetch(`${BASE_URL}/api/students/${intern.student}`, {
                  method: 'GET',
                  headers,
                });
                if (!studentResponse.ok) {
                  console.warn(`Failed to fetch student details for ID ${intern.student}: ${studentResponse.status}`);
                  return { ...intern, studentDetails: null };
                }
                const studentData = await studentResponse.json();
                return { ...intern, studentDetails: studentData };
              } catch (studentError) {
                console.error(`Error fetching student details for ID ${intern.student}:`, studentError);
                return { ...intern, studentDetails: null };
              }
            }
            return intern;
          })
        );

        setStudents(internsWithStudentDetails || []);
        setPastInterns(pastInternsData || []);
        setError(null);
      } catch (error) {
        console.error('Error fetching students data:', error);
        setError(error.message || 'Failed to load students data. Please check if the backend server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsData();
  }, []);

  const handleDeleteStudent = async (studentId) => {
    if (!confirm('Are you sure you want to delete this student? This will move their intern data to past interns.')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Find the intern associated with this student
      const intern = students.find((i) => i.student === studentId);
      if (!intern) {
        throw new Error('No intern found for this student');
      }

      // Delete the intern (moves to PastIntern)
      const deleteResponse = await fetch(`${BASE_URL}/api/interns/${intern._id}`, {
        method: 'DELETE',
        headers,
      });
      if (!deleteResponse.ok) {
        throw new Error(`Failed to delete intern: ${deleteResponse.status} ${deleteResponse.statusText}`);
      }

      // Refresh students and past interns
      const internsResponse = await fetch(`${BASE_URL}/api/interns`, {
        method: 'GET',
        headers,
      });
      if (!internsResponse.ok) {
        throw new Error(`Failed to fetch interns: ${internsResponse.status} ${internsResponse.statusText}`);
      }
      const internsData = await internsResponse.json();

      const pastInternsResponse = await fetch(`${BASE_URL}/api/interns/past`, {
        method: 'GET',
        headers,
      });
      if (!pastInternsResponse.ok) {
        throw new Error(`Failed to fetch past interns: ${pastInternsResponse.status} ${pastInternsResponse.statusText}`);
      }
      const pastInternsData = await pastInternsResponse.json();

      // Update students with student details
      const internsWithStudentDetails = await Promise.all(
        internsData.map(async (intern) => {
          if (intern.student) {
            try {
              const studentResponse = await fetch(`${BASE_URL}/api/students/${intern.student}`, {
                method: 'GET',
                headers,
              });
              if (!studentResponse.ok) {
                console.warn(`Failed to fetch student details for ID ${intern.student}: ${studentResponse.status}`);
                return { ...intern, studentDetails: null };
              }
              const studentData = await studentResponse.json();
              return { ...intern, studentDetails: studentData };
            } catch (studentError) {
              console.error(`Error fetching student details for ID ${intern.student}:`, studentError);
              return { ...intern, studentDetails: null };
            }
          }
          return intern;
        })
      );

      setStudents(internsWithStudentDetails || []);
      setPastInterns(pastInternsData || []);
      alert('Student moved to past interns successfully!');
    } catch (error) {
      console.error('Error deleting student:', error);
      alert(`Failed to delete student: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (student) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch full intern details
      const internResponse = await fetch(`${BASE_URL}/api/interns/${student._id}`, {
        method: 'GET',
        headers,
      });
      if (!internResponse.ok) {
        throw new Error(`Failed to fetch intern details: ${internResponse.status} ${internResponse.statusText}`);
      }
      const internData = await internResponse.json();

      // Fetch student details if not already available
      let studentDetails = student.studentDetails;
      if (!studentDetails && internData.student) {
        const studentResponse = await fetch(`${BASE_URL}/api/students/${internData.student}`, {
          method: 'GET',
          headers,
        });
        if (!studentResponse.ok) {
          console.warn(`Failed to fetch student details for ID ${internData.student}: ${studentResponse.status}`);
          studentDetails = null;
        } else {
          studentDetails = await studentResponse.json();
        }
      }

      // Construct the report content
      const reportContent = `
Student Report: ${studentDetails?.name || internData.name}
==================================================
Basic Information
--------------------------------------------------
Name: ${studentDetails?.name || internData.name}
Email: ${studentDetails?.email || internData.email}
Username: ${studentDetails?.username || 'N/A'}
Role: ${studentDetails?.role || 'student'}
Join Date: ${formatDate(studentDetails?.joinDate || internData.joiningDate)}
Contact Number: ${studentDetails?.contactNumber || 'N/A'}
Program: ${studentDetails?.program || 'N/A'}
University: ${studentDetails?.university || 'N/A'}
Graduation Year: ${studentDetails?.graduationYear || 'N/A'}
Last Active: ${formatDate(studentDetails?.lastActive)}
Bio: ${studentDetails?.bio || 'N/A'}

Internship Details
--------------------------------------------------
Joining Date: ${formatDate(internData.joiningDate)}
End Date: ${formatDate(internData.endDate) || 'N/A'}
Duration: ${internData.duration || 'N/A'} months
Progress: ${internData.progress || 0}%
Status: ${internData.status || 'Active'}
Project Rating: ${internData.projectRating || 0}

Tasks
--------------------------------------------------
${internData.tasks?.length > 0 ? internData.tasks.map((task, idx) => `${idx + 1}. ${formatTaskText(task)}`).join('\n') : 'No tasks assigned'}

Assigned Projects
--------------------------------------------------
${studentDetails?.assignedProjects?.length > 0 ? studentDetails.assignedProjects.map((project, idx) => `${idx + 1}. ${project.title} (Status: ${project.status})\n   Description: ${formatTaskText(project.description)}\n   Start Date: ${formatDate(project.startDate)}\n   End Date: ${formatDate(project.endDate)}\n   Last Modified: ${formatDate(project.lastModified)}`).join('\n') : 'No projects assigned'}

Attendance Records
--------------------------------------------------
${internData.attendance?.length > 0 ? internData.attendance.map((record, idx) => `${idx + 1}. Date: ${formatDate(record.date)}, Status: ${record.status}, Time In: ${record.timeIn || 'N/A'}, Time Out: ${record.timeOut || 'N/A'}, Notes: ${record.notes || 'N/A'}`).join('\n') : 'No attendance records'}

Progress Updates
--------------------------------------------------
${internData.dailyProgress?.length > 0 ? internData.dailyProgress.map((update, idx) => `${idx + 1}. Date: ${formatDate(update.timestamp)}, Content: ${update.content}${update.feedback ? `\n   Feedback: ${update.feedback}` : ''}`).join('\n') : 'No progress updates'}

Notification Settings
--------------------------------------------------
Email Notifications: ${studentDetails?.notificationSettings?.emailNotifications ? 'Enabled' : 'Disabled'}
Attendance Alerts: ${studentDetails?.notificationSettings?.attendanceAlerts ? 'Enabled' : 'Disabled'}
Project Updates: ${studentDetails?.notificationSettings?.projectUpdates ? 'Enabled' : 'Disabled'}
System Alerts: ${studentDetails?.notificationSettings?.systemAlerts ? 'Enabled' : 'Disabled'}

Security Settings
--------------------------------------------------
Two-Factor Authentication: ${studentDetails?.securitySettings?.twoFactorAuth ? 'Enabled' : 'Disabled'}
Require Password Reset: ${studentDetails?.securitySettings?.requirePasswordReset ? 'Yes' : 'No'}
Session Timeout: ${studentDetails?.securitySettings?.sessionTimeout} minutes
==================================================
Generated on: ${new Date().toLocaleString()}
      `;

      // Create and download the text file
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Student_Report_${studentDetails?.name || internData.name}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert(`Failed to generate report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openViewStudentModal = async (student) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch full intern details
      const internResponse = await fetch(`${BASE_URL}/api/interns/${student._id}`, {
        method: 'GET',
        headers,
      });
      if (!internResponse.ok) {
        throw new Error(`Failed to fetch intern details: ${internResponse.status} ${internResponse.statusText}`);
      }
      const internData = await internResponse.json();

      // Fetch student details
      let studentDetails = student.studentDetails;
      if (!studentDetails && internData.student) {
        const studentResponse = await fetch(`${BASE_URL}/api/students/${internData.student}`, {
          method: 'GET',
          headers,
        });
        if (!studentResponse.ok) {
          console.warn(`Failed to fetch student details for ID ${internData.student}: ${studentResponse.status}`);
          studentDetails = null;
        } else {
          studentDetails = await studentResponse.json();
        }
      }

      setSelectedStudent({ ...internData, studentDetails });
      setViewStudentModalOpen(true);
    } catch (error) {
      console.error('Error fetching student details:', error);
      alert(`Failed to load student details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTaskText = (text) => {
    if (!text) return 'N/A';
    const textStr = typeof text === 'string' ? text : String(text);
    return textStr
      .replace(/^\[|\]$|^"|"$|^'|'$/g, '')
      .replace(/\\"/g, '"')
      .trim();
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Present':
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'Absent':
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800';
      case 'Late':
      case 'Under Review':
      case 'In Progress':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
            <button
              onClick={logout}
              className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-all duration-300 flex items-center"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
              Logout
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm backdrop-blur-sm bg-opacity-80">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Student Management</h2>
                <button
                  onClick={() => setShowPastInterns(!showPastInterns)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center"
                >
                  {showPastInterns ? 'Hide Past Interns' : 'Show Past Interns'}
                </button>
              </div>

              <div className="overflow-x-auto">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Students</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.length > 0 ? (
                      students.map((student) => (
                        <tr key={student._id} className="hover:bg-gray-50 transition-all duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                {(student.studentDetails?.name || student.name)?.charAt(0).toUpperCase() || 'S'}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{student.studentDetails?.name || student.name}</div>
                                <div className="text-xs text-gray-500">{student.duration} months</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.studentDetails?.email || student.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.studentDetails?.program || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${student.progress || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">{student.progress || 0}%</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(student.studentDetails?.lastActive)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-3">
                              <button
                                onClick={() => openViewStudentModal(student)}
                                className="text-blue-600 hover:text-blue-800 transition-all duration-200"
                                title="View Details"
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student.student)}
                                className="text-rose-600 hover:text-rose-800 transition-all duration-200"
                                title="Delete Student"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                              <button
                                onClick={() => handleDownloadReport(student)}
                                className="text-green-600 hover:text-green-800 transition-all duration-200"
                                title="Download Report"
                              >
                                <FontAwesomeIcon icon={faDownload} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No students found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {showPastInterns && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Past Interns</h3>
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
                          <tr key={intern._id} className="hover:bg-gray-50 transition-all duration-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                  {intern.name ? intern.name.charAt(0).toUpperCase() : 'S'}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{intern.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{intern.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                  style={{ width: `${intern.progress || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500">{intern.progress || 0}%</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(intern.deletedAt)}
                            </td>
                            <td className="px-6 py-4">
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
            </div>
          </div>

          {/* View Student Modal */}
          {selectedStudent && viewStudentModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl backdrop-blur-sm bg-opacity-95">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedStudent.studentDetails?.name || selectedStudent.name}</h2>
                  <button
                    onClick={() => setViewStudentModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 transition-all duration-200"
                  >
                    <FontAwesomeIcon icon={faTimesCircle} size="lg" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                    <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Email:</span> {selectedStudent.studentDetails?.email || selectedStudent.email}</p>
                    <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Username:</span> {selectedStudent.studentDetails?.username || 'N/A'}</p>
                    <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Role:</span> {selectedStudent.studentDetails?.role || 'student'}</p>
                    <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Join Date:</span> {formatDate(selectedStudent.studentDetails?.joinDate || selectedStudent.joiningDate)}</p>
                    <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Contact Number:</span> {selectedStudent.studentDetails?.contactNumber || 'N/A'}</p>
                    <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Program:</span> {selectedStudent.studentDetails?.program || 'N/A'}</p>
                    <p className="text-sm text-gray-600 mb-2"><span className="font-medium">University:</span> {selectedStudent.studentDetails?.university || 'N/A'}</p>
                    <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Graduation Year:</span> {selectedStudent.studentDetails?.graduationYear || 'N/A'}</p>
                    <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Last Active:</span> {formatDate(selectedStudent.studentDetails?.lastActive)}</p>
                    <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Last Login:</span> {formatDate(selectedStudent.studentDetails?.lastLogin)}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Internship Details</h3>
                    <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Joining Date:</span> {formatDate(selectedStudent.joiningDate)}</p>
                    <p className="text-sm text-gray-600 mb-2"><span className="font-medium">End Date:</span> {formatDate(selectedStudent.endDate)}</p>
                    <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Duration:</span> {selectedStudent.duration || 'N/A'} months</p>
                    <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Progress:</span> {selectedStudent.progress || 0}%</p>
                    <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Project Rating:</span> {selectedStudent.projectRating || 0}</p>
                    <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Status:</span> {selectedStudent.status || 'Active'}</p>
                    <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-3">Bio</h3>
                    <p className="text-sm text-gray-600">{selectedStudent.studentDetails?.bio || 'No bio available'}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tasks</h3>
                  {selectedStudent.tasks && selectedStudent.tasks.length > 0 ? (
                    <ul className="list-disc pl-6 text-sm text-gray-600">
                      {selectedStudent.tasks.map((task, index) => (
                        <li key={index} className="mb-2">{formatTaskText(task)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">No tasks assigned</p>
                  )}
                </div>

                {selectedStudent.studentDetails?.assignedProjects && selectedStudent.studentDetails.assignedProjects.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Assigned Projects</h3>
                    <div className="space-y-4">
                      {selectedStudent.studentDetails.assignedProjects.map((project, index) => (
                        <div key={index} className="border border-gray-100 p-4 rounded-lg bg-gray-50">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-gray-900">{project.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(project.status)}`}>
                              {project.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Description:</span> {formatTaskText(project.description)}</p>
                          <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Start Date:</span> {formatDate(project.startDate)}</p>
                          <p className="text-sm text-gray-600 mb-2"><span className="font-medium">End Date:</span> {formatDate(project.endDate)}</p>
                          <p className="text-sm text-gray-600 mb-2"><span className="font-medium">Last Modified:</span> {formatDate(project.lastModified)}</p>
                          {project.tasks && project.tasks.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">Tasks:</p>
                              <ul className="list-disc pl-6 text-sm text-gray-600">
                                {project.tasks.map((task, idx) => (
                                  <li key={idx} className="mb-1">
                                    {task.description} (Due: {formatDate(task.dueDate)}, {task.isComplete ? 'Completed' : 'Pending'})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {project.feedback && project.feedback.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-600 mt-2 mb-1">Feedback:</p>
                              <ul className="list-disc pl-6 text-sm text-gray-600">
                                {project.feedback.map((fb, idx) => (
                                  <li key={idx} className="mb-1">
                                    {fb.comment} (From: {fb.from}, Date: {formatDate(fb.date)})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStudent.attendance && selectedStudent.attendance.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Attendance</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time In</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Out</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedStudent.attendance.slice().reverse().slice(0, 5).map((record, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm text-gray-900">{formatDate(record.date)}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(record.status)}`}>{record.status}</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{record.timeIn || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{record.timeOut || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{record.notes || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedStudent.dailyProgress && selectedStudent.dailyProgress.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Progress Updates</h3>
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {selectedStudent.dailyProgress.slice().reverse().map((update, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium text-gray-600">{formatDate(update.timestamp)}</span>
                            {update.hasAdminFeedback && (
                              <span className="text-xs font-medium text-green-600">Feedback Received</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{update.content}</p>
                          {update.feedback && (
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Feedback:</span> {update.feedback} (Date: {formatDate(update.feedbackDate)})
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStudent.studentDetails?.notificationSettings && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Notification Settings</h3>
                    <ul className="list-disc pl-6 text-sm text-gray-600">
                      <li>Email Notifications: {selectedStudent.studentDetails.notificationSettings.emailNotifications ? 'Enabled' : 'Disabled'}</li>
                      <li>Attendance Alerts: {selectedStudent.studentDetails.notificationSettings.attendanceAlerts ? 'Enabled' : 'Disabled'}</li>
                      <li>Project Updates: {selectedStudent.studentDetails.notificationSettings.projectUpdates ? 'Enabled' : 'Disabled'}</li>
                      <li>System Alerts: {selectedStudent.studentDetails.notificationSettings.systemAlerts ? 'Enabled' : 'Disabled'}</li>
                    </ul>
                  </div>
                )}

                {selectedStudent.studentDetails?.securitySettings && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Security Settings</h3>
                    <ul className="list-disc pl-6 text-sm text-gray-600">
                      <li>Two-Factor Authentication: {selectedStudent.studentDetails.securitySettings.twoFactorAuth ? 'Enabled' : 'Disabled'}</li>
                      <li>Require Password Reset: {selectedStudent.studentDetails.securitySettings.requirePasswordReset ? 'Yes' : 'No'}</li>
                      <li>Session Timeout: {selectedStudent.studentDetails.securitySettings.sessionTimeout} minutes</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProtectedStudentManagement() {
  return (
    <RouteGuard requireAdmin={true}>
      <StudentManagement />
    </RouteGuard>
  );
}