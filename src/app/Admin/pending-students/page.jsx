"use client";

import { useEffect, useState } from "react";
import PendingStudentCard from "../../components/PendingStudentCard";
import {
  fetchPendingStudents,
  acceptStudent,
  rejectStudent,
} from "../../lib/api";
import Sidebar from "../../components/sidebar";

export default function PendingStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) return;

    fetchPendingStudents(token)
      .then(setStudents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async (id) => {
    setLoadingId(id);
    try {
      await acceptStudent(id, token);
      setStudents((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    setLoadingId(id);
    try {
      await rejectStudent(id, token);
      setStudents((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  // Filter and search functionality
  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.program?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === "all") return matchesSearch;
    if (filter === "domestic") return matchesSearch && student.country === "Domestic";
    if (filter === "international") return matchesSearch && student.country !== "Domestic";
    
    return matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Pending Student Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Review and manage student registration requests
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, email, university..."
                  className="w-full px-4 py-2 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg
                  className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex gap-2">
              <select
                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Students</option>
                <option value="domestic">Domestic</option>
                <option value="international">International</option>
              </select>
              <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg">
                <span className="font-semibold">{filteredStudents.length}</span> requests
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
              No pending requests
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? "No students match your search" : "All requests have been processed"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header for desktop */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400">
              <div className="col-span-4">Student Information</div>
              <div className="col-span-2">Program</div>
              <div className="col-span-3">University</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Student Cards */}
            <div className="space-y-3">
              {filteredStudents.map((student) => (
                <PendingStudentCard
                  key={student._id}
                  student={student}
                  loading={loadingId === student._id}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  isExpanded={expandedCard === student._id}
                  onToggleExpand={() => toggleExpand(student._id)}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}