// pages/StudentManagement.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import RouteGuard from '../../components/RouteGuard';
import Navbar from '../../components/navbar';
import Sidebar from '../../components/sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:8000';

function StudentManagement() {
  const { user, logout } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;

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

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        const response = await fetch(`${BASE_URL}/api/interns`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch students data: ${response.status}`);
        }

        const studentsData = await response.json();
        setStudents(studentsData || []);
        setError(null);
      } catch (error) {
        console.error('Error fetching students data:', error);
        setError(error.message || 'Failed to load students data.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsData();
  }, []);

  // Memoized filtered and sorted records to avoid re-calculation on every render
  const allFilteredRecords = useMemo(() => {
    // Flatten all attendance records from all students into a single array
    const flatRecords = students.flatMap(student =>
      (student.attendance || []).map(record => ({
        ...record,
        studentName: student.name,
        studentEmail: student.email,
        studentId: student._id,
      }))
    );

    // Apply filters
    const filtered = flatRecords.filter(record => {
      const recordDate = new Date(record.date);
      const matchesSearch =
        record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesYear = filterYear ? recordDate.getFullYear().toString() === filterYear : true;
      const matchesMonth = filterMonth ? (recordDate.getMonth() + 1).toString().padStart(2, '0') === filterMonth : true;
      const matchesDay = filterDay ? recordDate.getDate().toString().padStart(2, '0') === filterDay : true;
      const matchesDate = filterDate ? record.date.startsWith(filterDate) : true;

      return matchesSearch && matchesYear && matchesMonth && matchesDay && matchesDate;
    });

    // Backend se data already sorted hai, but we can re-sort to be safe.
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  }, [students, searchTerm, filterYear, filterMonth, filterDay, filterDate]);


  // Pagination Logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = allFilteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(allFilteredRecords.length / recordsPerPage);


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Present': return 'bg-emerald-100 text-emerald-800';
      case 'Absent': return 'bg-rose-100 text-rose-800';
      case 'Late': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Unique options for filter dropdowns
  const allYears = useMemo(() => [...new Set(allFilteredRecords.map(r => new Date(r.date).getFullYear().toString()))].sort(), [allFilteredRecords]);
  const allMonths = useMemo(() => [...new Set(allFilteredRecords.map(r => (new Date(r.date).getMonth() + 1).toString().padStart(2, '0')))].sort(), [allFilteredRecords]);
  const allDays = useMemo(() => [...new Set(allFilteredRecords.map(r => new Date(r.date).getDate().toString().padStart(2, '0')))].sort(), [allFilteredRecords]);

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
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Student Attendance</h1>
                <div className="bg-white rounded-xl shadow-md">
                    <div className="p-6">
                    {/* Search and Filter Section */}
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-2 relative">
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => {setFilterDate(e.target.value); setCurrentPage(1);}}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="grid grid-cols-3 gap-2">
                        <select value={filterYear} onChange={(e) => {setFilterYear(e.target.value); setCurrentPage(1);}} className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Year</option>
                            {allYears.map((year) => <option key={year} value={year}>{year}</option>)}
                        </select>
                        <select value={filterMonth} onChange={(e) => {setFilterMonth(e.target.value); setCurrentPage(1);}} className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Month</option>
                            {allMonths.map((month) => <option key={month} value={month}>{new Date(0, parseInt(month) - 1).toLocaleString('en-US', { month: 'short' })}</option>)}
                        </select>
                        <select value={filterDay} onChange={(e) => {setFilterDay(e.target.value); setCurrentPage(1);}} className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Day</option>
                            {allDays.map((day) => <option key={day} value={day}>{day}</option>)}
                        </select>
                        </div>
                    </div>

                    {/* Attendance Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time In</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Out</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentRecords.length > 0 ? (
                            currentRecords.map((record, index) => (
                                <tr key={`${record.studentId}-${record.date}-${index}`} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{record.studentName}</div>
                                    <div className="text-sm text-gray-500">{record.studentEmail}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{formatDate(record.date)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(record.status)}`}>
                                    {record.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{record.timeIn || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{record.timeOut || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{record.notes || 'N/A'}</td>
                                </tr>
                            ))
                            ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                No attendance records found for the selected filters.
                                </td>
                            </tr>
                            )}
                        </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 flex justify-between items-center border-t border-gray-200">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-700">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}
                    </div>
                </div>
            </div>
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