'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import Navbar from "../../../components/navbar";
import Sidebar from "../../../components/sidebar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, faSpinner, faCheck, 
  faExclamationTriangle, faHistory 
} from '@fortawesome/free-solid-svg-icons';

export default function ProgressUpdates() {
  const { user } = useAuth();
  const [progressUpdate, setProgressUpdate] = useState('');
  const [previousUpdates, setPreviousUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch previous progress updates
  useEffect(() => {
    const fetchPreviousUpdates = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/progress-updates', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPreviousUpdates(response.data);
      } catch (error) {
        console.error('Error fetching progress updates:', error);
        setError('Failed to load your previous progress updates');
      } finally {
        setLoading(false);
      }
    };

    fetchPreviousUpdates();
  }, []);

  // Submit progress update
  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    
    if (!progressUpdate.trim()) {
      setError('Please enter your progress update');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(false);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/progress-updates',
        { content: progressUpdate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Add new update to the list
      setPreviousUpdates([response.data, ...previousUpdates]);
      
      // Clear the form
      setProgressUpdate('');
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting progress update:', error);
      setError(error.response?.data?.message || 'Failed to submit progress update');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Progress Updates</h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
              {/* Submit new progress update form */}
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Submit Progress Update</h2>
                
                {/* Error message */}
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Success message */}
                {success && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FontAwesomeIcon icon={faCheck} className="text-green-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">Progress update submitted successfully!</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSubmitUpdate}>
                  <div className="mb-4">
                    <label htmlFor="progressUpdate" className="block text-sm font-medium text-gray-700 mb-2">
                      What progress have you made recently?
                    </label>
                    <textarea
                      id="progressUpdate"
                      rows="4"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                      placeholder="Describe your recent work, challenges faced, and progress made..."
                      value={progressUpdate}
                      onChange={(e) => setProgressUpdate(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                          Submit Update
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
              
              {/* Previous updates section */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Previous Updates</h2>
                  <div className="flex items-center text-sm text-gray-500">
                    <FontAwesomeIcon icon={faHistory} className="mr-1" />
                    <span>History</span>
                  </div>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-6">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-500 text-xl" />
                  </div>
                ) : previousUpdates.length > 0 ? (
                  <div className="space-y-4">
                    {previousUpdates.map((update, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <p className="text-gray-800">{update.content}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">
                            {formatDate(update.date || update.timestamp || update.createdAt)}
                          </span>
                          {update.feedback && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                              Feedback received
                            </span>
                          )}
                        </div>
                        {update.feedback && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-sm text-gray-800">
                              <span className="font-medium">Admin feedback:</span> {update.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 py-4 text-center">No previous updates found.</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}