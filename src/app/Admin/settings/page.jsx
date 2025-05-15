'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import RouteGuard from '../../components/RouteGuard';
import Navbar from "../../components/navbar";
import Sidebar from "../../components/sidebar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCog, faUser, faKey, faEnvelope, faSave, 
  faExclamationTriangle, faCheckCircle, faBell, faLock
} from '@fortawesome/free-solid-svg-icons';

function SettingsPage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('account');
  
  const [accountSettings, setAccountSettings] = useState({
    name: '',
    email: '',
    username: ''
  });
  
  const [passwordSettings, setPasswordSettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    attendanceAlerts: true,
    projectUpdates: true,
    systemAlerts: true
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    requirePasswordReset: false,
    sessionTimeout: 30
  });

  // Load user data
  useEffect(() => {
    if (user) {
      setAccountSettings({
        name: user.name || '',
        email: user.email || '',
        username: user.username || ''
      });
    }
  }, [user]);

  // Handle account settings update
  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }
      
      // Make API call to update account info
      await axios.put(
        'http://localhost:5000/api/admin/profile', 
        accountSettings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccessMessage('Account settings updated successfully');
    } catch (error) {
      console.error('Error updating account settings:', error);
      setError(error.response?.data?.message || 'Failed to update account settings');
    } finally {
      setLoading(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Check if passwords match
    if (passwordSettings.newPassword !== passwordSettings.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }
      
      // Make API call to change password
      await axios.put(
        'http://localhost:5000/api/admin/password', 
        {
          currentPassword: passwordSettings.currentPassword,
          newPassword: passwordSettings.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Reset password fields
      setPasswordSettings({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setSuccessMessage('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Handle notification settings update
  const handleNotificationUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage('');
      
      // In a real app, you would update notification settings via API
      // For now, we'll just simulate success
      console.log('Notification settings updated:', notificationSettings);
      
      setSuccessMessage('Notification settings updated successfully');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      setError('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  // Handle security settings update
  const handleSecurityUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage('');
      
      // In a real app, you would update security settings via API
      // For now, we'll just simulate success
      console.log('Security settings updated:', securitySettings);
      
      setSuccessMessage('Security settings updated successfully');
    } catch (error) {
      console.error('Error updating security settings:', error);
      setError('Failed to update security settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg">
              <div className="p-6">
                {/* Settings Tabs */}
                <div className="border-b border-gray-200 mb-6">
                  <div className="flex space-x-8">
                    <button
                      className={`pb-4 px-1 ${
                        activeTab === 'account'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('account')}
                    >
                      <FontAwesomeIcon icon={faUser} className="mr-2" />
                      Account
                    </button>
                    <button
                      className={`pb-4 px-1 ${
                        activeTab === 'password'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('password')}
                    >
                      <FontAwesomeIcon icon={faKey} className="mr-2" />
                      Password
                    </button>
                    {/* <button
                      className={`pb-4 px-1 ${
                        activeTab === 'notifications'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('notifications')}
                    >
                      <FontAwesomeIcon icon={faBell} className="mr-2" />
                      Notifications
                    </button> */}
                    {/* <button
                      className={`pb-4 px-1 ${
                        activeTab === 'security'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('security')}
                    >
                      <FontAwesomeIcon icon={faLock} className="mr-2" />
                      Security
                    </button> */}
                  </div>
                </div>

                {/* Error and Success Messages */}
                {error && (
                  <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                {successMessage && (
                  <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                      <span>{successMessage}</span>
                    </div>
                  </div>
                )}

                {/* Account Settings */}
                {activeTab === 'account' && (
                  <form onSubmit={handleAccountUpdate}>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Update your account details and contact information.
                        </p>
                      </div>

                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Name
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={accountSettings.name}
                            onChange={(e) => setAccountSettings({ ...accountSettings, name: e.target.value })}
                            className="pl-10 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="Your Name"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
                          </div>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={accountSettings.email}
                            onChange={(e) => setAccountSettings({ ...accountSettings, email: e.target.value })}
                            className="pl-10 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                          Username
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="username"
                            id="username"
                            value={accountSettings.username}
                            onChange={(e) => setAccountSettings({ ...accountSettings, username: e.target.value })}
                            className="pl-10 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="username"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          disabled={loading}
                        >
                          {loading ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving...
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <FontAwesomeIcon icon={faSave} className="mr-2" />
                              Save Changes
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Password Settings */}
                {activeTab === 'password' && (
                  <form onSubmit={handlePasswordUpdate}>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Password</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Update your password to ensure account security.
                        </p>
                      </div>

                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                          Current Password
                        </label>
                        <div className="mt-1">
                          <input
                            type="password"
                            name="currentPassword"
                            id="currentPassword"
                            value={passwordSettings.currentPassword}
                            onChange={(e) => setPasswordSettings({ ...passwordSettings, currentPassword: e.target.value })}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                          New Password
                        </label>
                        <div className="mt-1">
                          <input
                            type="password"
                            name="newPassword"
                            id="newPassword"
                            value={passwordSettings.newPassword}
                            onChange={(e) => setPasswordSettings({ ...passwordSettings, newPassword: e.target.value })}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                            minLength="8"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Password must be at least 8 characters long and include a mix of letters, numbers, and symbols.
                        </p>
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                          Confirm New Password
                        </label>
                        <div className="mt-1">
                          <input
                            type="password"
                            name="confirmPassword"
                            id="confirmPassword"
                            value={passwordSettings.confirmPassword}
                            onChange={(e) => setPasswordSettings({ ...passwordSettings, confirmPassword: e.target.value })}
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          disabled={loading}
                        >
                          {loading ? 'Updating...' : 'Change Password'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Notification Settings */}
                {/* {activeTab === 'notifications' && (
                  <form onSubmit={handleNotificationUpdate}>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Configure how and when you want to receive notifications.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="emailNotifications"
                              name="emailNotifications"
                              type="checkbox"
                              checked={notificationSettings.emailNotifications}
                              onChange={(e) => setNotificationSettings({
                                ...notificationSettings,
                                emailNotifications: e.target.checked
                              })}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="emailNotifications" className="font-medium text-gray-700">
                              Email Notifications
                            </label>
                            <p className="text-gray-500">
                              Receive email updates about system activities.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="attendanceAlerts"
                              name="attendanceAlerts"
                              type="checkbox"
                              checked={notificationSettings.attendanceAlerts}
                              onChange={(e) => setNotificationSettings({
                                ...notificationSettings,
                                attendanceAlerts: e.target.checked
                              })}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="attendanceAlerts" className="font-medium text-gray-700">
                              Attendance Alerts
                            </label>
                            <p className="text-gray-500">
                              Get notified about intern attendance updates.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="projectUpdates"
                              name="projectUpdates"
                              type="checkbox"
                              checked={notificationSettings.projectUpdates}
                              onChange={(e) => setNotificationSettings({
                                ...notificationSettings,
                                projectUpdates: e.target.checked
                              })}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="projectUpdates" className="font-medium text-gray-700">
                              Project Updates
                            </label>
                            <p className="text-gray-500">
                              Receive notifications when project status changes.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="systemAlerts"
                              name="systemAlerts"
                              type="checkbox"
                              checked={notificationSettings.systemAlerts}
                              onChange={(e) => setNotificationSettings({
                                ...notificationSettings,
                                systemAlerts: e.target.checked
                              })}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="systemAlerts" className="font-medium text-gray-700">
                              System Alerts
                            </label>
                            <p className="text-gray-500">
                              Get important system alerts and announcements.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : 'Save Preferences'}
                        </button>
                      </div>
                    </div>
                  </form>
                )} */}

                {/* Security Settings */}
                {/* {activeTab === 'security' && (
                  <form onSubmit={handleSecurityUpdate}>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Configure security options for your account.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="twoFactorAuth"
                              name="twoFactorAuth"
                              type="checkbox"
                              checked={securitySettings.twoFactorAuth}
                              onChange={(e) => setSecuritySettings({
                                ...securitySettings,
                                twoFactorAuth: e.target.checked
                              })}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="twoFactorAuth" className="font-medium text-gray-700">
                              Two-Factor Authentication
                            </label>
                            <p className="text-gray-500">
                              Enable two-factor authentication for additional security.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="requirePasswordReset"
                              name="requirePasswordReset"
                              type="checkbox"
                              checked={securitySettings.requirePasswordReset}
                              onChange={(e) => setSecuritySettings({
                                ...securitySettings,
                                requirePasswordReset: e.target.checked
                              })}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="requirePasswordReset" className="font-medium text-gray-700">
                              Require Password Reset
                            </label>
                            <p className="text-gray-500">
                              Force interns to reset their password on next login.
                            </p>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700">
                            Session Timeout (minutes)
                          </label>
                          <div className="mt-1">
                            <input
                              type="number"
                              name="sessionTimeout"
                              id="sessionTimeout"
                              min="5"
                              max="120"
                              value={securitySettings.sessionTimeout}
                              onChange={(e) => setSecuritySettings({
                                ...securitySettings,
                                sessionTimeout: parseInt(e.target.value) || 30
                              })}
                              className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Time in minutes before an inactive session is automatically logged out.
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : 'Save Security Settings'}
                        </button>
                      </div>
                    </div>
                  </form>
                )} */}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ProtectedSettingsPage() {
  return (
    <RouteGuard requireAdmin={true}>
      <SettingsPage />
    </RouteGuard>
  );
}