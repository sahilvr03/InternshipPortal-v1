// src/components/PendingStudents.js
"use client" // This directive is important for Next.js App Router to mark this as a client component

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api'; // Define your API base URL here

const PendingStudents = () => {
    // State for managing pending students data
    const [pendingStudents, setPendingStudents] = useState([]);
    // State for loading indicator
    const [loading, setLoading] = useState(true);
    // State for general error messages (e.g., failed to fetch)
    const [error, setError] = useState(null);
    // State for success/error messages after actions (accept/reject)
    const [message, setMessage] = useState(null);
    // State for message type (e.g., 'success', 'error')
    const [messageType, setMessageType] = useState('');
    // State for controlling the visibility of the accept confirmation modal
    const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
    // State for controlling the visibility of the reject confirmation modal
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);
    // State for controlling the visibility of the student details modal
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    // State to store the ID of the student selected for confirmation or details
    const [studentToConfirmId, setStudentToConfirmId] = useState(null);
    // State to store the name of the student selected for confirmation (for display in modal)
    const [studentToConfirmName, setStudentToConfirmName] = useState('');
    // State to store all details of the student currently being viewed in the details modal
    const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);

    // Function to display a temporary message (success or error)
    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        // Clear message after 5 seconds
        setTimeout(() => {
            setMessage(null);
            setMessageType('');
        }, 5000);
    };

    // Function to fetch pending student data from the backend
    const fetchPendingStudents = useCallback(async () => {
        setLoading(true);
        setError(null); // Clear previous errors
        setMessage(null); // Clear previous action messages
        setMessageType('');

        try {
            const token = localStorage.getItem('token'); // Get auth token from localStorage
            if (!token) {
                // Handle case where token is missing, e.g., redirect to login
                setError('Authentication token missing. Please log in as an admin.');
                setLoading(false);
                // In a real app, you'd likely redirect here: router.push('/login');
                return;
            }
            const response = await axios.get(`${API_BASE_URL}/admin/pending-students`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPendingStudents(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching pending students:", err);
            // Extract error message from response, or use a generic one
            setError(err.response?.data?.error || 'Failed to fetch pending students. Please try again.');
            setLoading(false);
        }
    }, []); // Empty dependency array means this function is created once

    // Effect hook to fetch pending students on component mount or when fetchPendingStudents changes
    useEffect(() => {
        fetchPendingStudents();
    }, [fetchPendingStudents]); // Depend on fetchPendingStudents to re-run it

    // Handler for initiating the accept confirmation flow
    const handleAcceptClick = (id, name) => {
        setStudentToConfirmId(id);
        setStudentToConfirmName(name);
        setShowAcceptConfirm(true);
    };

    // Handler for initiating the reject confirmation flow
    const handleRejectClick = (id, name) => {
        setStudentToConfirmId(id);
        setStudentToConfirmName(name);
        setShowRejectConfirm(true);
    };

    // Handler for displaying all details of a student
    const handleViewDetails = (student) => {
        setSelectedStudentDetails(student);
        setShowDetailsModal(true);
    };

    // Handler for confirming and performing the accept action
    const handleAcceptConfirm = async () => {
        setShowAcceptConfirm(false); // Close modal
        if (!studentToConfirmId) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_BASE_URL}/admin/pending-students/${studentToConfirmId}/accept`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Optimistically update the UI by filtering out the accepted student
            setPendingStudents(prevStudents => prevStudents.filter(student => student._id !== studentToConfirmId));
            showMessage(response.data.message || 'Student approved successfully!', 'success');
        } catch (err) {
            console.error("Error accepting student:", err);
            showMessage(err.response?.data?.error || 'Failed to accept student. Please try again.', 'error');
        } finally {
            setStudentToConfirmId(null); // Clear selected student
            setStudentToConfirmName('');
        }
    };

    // Handler for confirming and performing the reject action
    const handleRejectConfirm = async () => {
        setShowRejectConfirm(false); // Close modal
        if (!studentToConfirmId) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_BASE_URL}/admin/pending-students/${studentToConfirmId}/reject`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Optimistically update the UI by filtering out the rejected student
            setPendingStudents(prevStudents => prevStudents.filter(student => student._id !== studentToConfirmId));
            showMessage(response.data.message || 'Student rejected successfully!', 'success');
        } catch (err) {
            console.error("Error rejecting student:", err);
            showMessage(err.response?.data?.error || 'Failed to reject student. Please try again.', 'error');
        } finally {
            setStudentToConfirmId(null); // Clear selected student
            setStudentToConfirmName('');
        }
    };

    // Handler for cancelling any confirmation modal or details modal
    const handleCancelConfirm = () => {
        setShowAcceptConfirm(false);
        setShowRejectConfirm(false);
        setShowDetailsModal(false);
        setStudentToConfirmId(null);
        setStudentToConfirmName('');
        setSelectedStudentDetails(null);
    };

    // Render loading state
    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <div className="text-xl text-gray-700">Loading pending student requests...</div>
        </div>
    );

    // Render error state for initial fetch
    if (error) return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative shadow-md" role="alert">
                <strong className="font-bold">Error! </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto p-4 bg-gray-50 min-h-screen rounded-lg shadow-lg my-8">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Pending Student Requests</h1>

            {/* Message Display Area */}
            {message && (
                <div
                    className={`p-4 mb-4 rounded-xl text-white font-medium shadow-md flex items-center justify-between animate-fade-in
                        ${messageType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
                    role="alert"
                >
                    <span>{message}</span>
                    <button
                        onClick={() => setMessage(null)}
                        className="ml-4 text-white hover:text-gray-200 font-bold text-lg"
                        aria-label="Close message"
                    >
                        &times;
                    </button>
                </div>
            )}

            {pendingStudents.length === 0 ? (
                <p className="text-center text-gray-600 text-lg mt-10 p-6 border border-dashed border-gray-300 rounded-xl bg-white shadow-sm">
                    No pending student requests at this time.
                </p>
            ) : (
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {pendingStudents.map(student => (
                        <div key={student._id} className="bg-white border border-gray-200 p-6 rounded-xl shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 ease-in-out">
                            <h2 className="text-2xl font-semibold mb-3 text-gray-900 leading-tight">{student.name}</h2>
                            <p className="text-gray-700 text-base mb-1"><strong className="font-medium text-gray-800">Email:</strong> {student.email}</p>
                            <p className="text-gray-700 text-base"><strong className="font-medium text-gray-800">Username:</strong> {student.username}</p>
                            
                            <div className="mt-6 flex flex-wrap gap-3 justify-end items-center">
                                <button
                                    onClick={() => handleViewDetails(student)}
                                    className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-200 transform hover:scale-105"
                                >
                                    View Details
                                </button>
                                <button
                                    onClick={() => handleAcceptClick(student._id, student.name)}
                                    className="bg-green-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-200 transform hover:scale-105"
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={() => handleRejectClick(student._id, student.name)}
                                    className="bg-red-600 text-white px-5 py-2 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition ease-in-out duration-200 transform hover:scale-105"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Accept Confirmation Modal */}
            {showAcceptConfirm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4 animate-fade-in">
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center transform scale-100 ease-out duration-300 animate-slide-up">
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">Confirm Acceptance</h3>
                        <p className="mb-6 text-gray-700">Are you sure you want to <span className="font-extrabold text-green-700">ACCEPT</span> the registration for <span className="font-semibold text-gray-900">{studentToConfirmName}</span>?</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={handleAcceptConfirm}
                                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 shadow-md transition-colors transform hover:scale-105"
                            >
                                Yes, Accept
                            </button>
                            <button
                                onClick={handleCancelConfirm}
                                className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-400 shadow-md transition-colors transform hover:scale-105"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Confirmation Modal */}
            {showRejectConfirm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4 animate-fade-in">
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center transform scale-100 ease-out duration-300 animate-slide-up">
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">Confirm Rejection</h3>
                        <p className="mb-6 text-gray-700">Are you sure you want to <span className="font-extrabold text-red-700">REJECT</span> the registration for <span className="font-semibold text-gray-900">{studentToConfirmName}</span>? This action cannot be undone.</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={handleRejectConfirm}
                                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 shadow-md transition-colors transform hover:scale-105"
                            >
                                Yes, Reject
                            </button>
                            <button
                                onClick={handleCancelConfirm}
                                className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-400 shadow-md transition-colors transform hover:scale-105"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Details Modal */}
            {showDetailsModal && selectedStudentDetails && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4 animate-fade-in">
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full transform scale-100 ease-out duration-300 animate-slide-up relative">
                        <button
                            onClick={handleCancelConfirm}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-3xl font-bold p-1 rounded-full hover:bg-gray-100"
                            aria-label="Close"
                        >
                            &times;
                        </button>
                        <h3 className="text-2xl font-bold mb-6 text-gray-800 text-center">Student Details: <span className="text-blue-700">{selectedStudentDetails.name}</span></h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-gray-700 text-lg">
                            <p><strong className="font-semibold text-gray-900">Name:</strong> {selectedStudentDetails.name}</p>
                            <p><strong className="font-semibold text-gray-900">Email:</strong> {selectedStudentDetails.email}</p>
                            <p><strong className="font-semibold text-gray-900">Username:</strong> {selectedStudentDetails.username}</p>
                            {selectedStudentDetails.contactNumber && <p><strong className="font-semibold text-gray-900">Contact:</strong> {selectedStudentDetails.contactNumber}</p>}
                            {selectedStudentDetails.program && <p><strong className="font-semibold text-gray-900">Program:</strong> {selectedStudentDetails.program}</p>}
                            {selectedStudentDetails.university && <p><strong className="font-semibold text-gray-900">University:</strong> {selectedStudentDetails.university}</p>}
                            {selectedStudentDetails.graduationYear && <p><strong className="font-semibold text-gray-900">Graduation Year:</strong> {selectedStudentDetails.graduationYear}</p>}
                            <div className="md:col-span-2">
                                {selectedStudentDetails.bio && <p><strong className="font-semibold text-gray-900">Bio:</strong> {selectedStudentDetails.bio}</p>}
                            </div>
                            <div className="md:col-span-2 text-sm text-gray-500 mt-4 border-t pt-4 border-gray-200">
                                <p><strong>Request Date:</strong> {new Date(selectedStudentDetails.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="mt-8 text-center">
                            <button
                                onClick={handleCancelConfirm}
                                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 shadow-md transition-colors transform hover:scale-105"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingStudents;