"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faTrash,
  faPencilAlt,
  faEye,
  faCheckCircle,
  faExclamationTriangle,
  faGraduationCap,
  faProjectDiagram,
  faClipboardList,
  faSignOutAlt,
  faPlus,
  faAngleDown,
  faAngleUp,
  faCalendarAlt,
  faTasks,
  faChartLine,
  faComments,
  faFilter,
  faQrcode,
  faSun,
  faMoon,
} from "@fortawesome/free-solid-svg-icons";
import { BrowserQRCodeReader } from "@zxing/library";

function InternDashboard() {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progressUpdate, setProgressUpdate] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [apiHealth, setApiHealth] = useState("unknown");
  const [activeTab, setActiveTab] = useState("projects");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState("prompt");
  const [showPopup, setShowPopup] = useState({ visible: false, message: "", isSuccess: true });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const videoRef = useRef(null);
  const codeReader = useRef(null);
  const maxProgressLength = 500;

  const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_URL || "http://192.168.8.113:8000",
  });

  // Check if running in a secure context
  const isSecureContext =
    typeof window !== "undefined" &&
    (window.isSecureContext ||
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "192.168.8.113");
  const isFileProtocol = typeof window !== "undefined" && window.location.protocol === "file:";

  // Initialize dark mode based on system preference
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(prefersDark);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    if (isFileProtocol) {
      setScannerError("Cannot access camera when running from file://. Please serve the app via http://192.168.8.113:3000 or https.");
      setShowPopup({
        visible: true,
        message: "Please run the app through a web server (e.g., npm run dev).",
        isSuccess: false,
      });
    }
  }, []);

  const unreadFeedbackCount =
    studentData?.projectFeedback?.filter((feedback) => !feedback.isRead).length || 0;

  // Check API health
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        await axiosInstance.get("/health");
        setApiHealth("online");
      } catch (err) {
        setApiHealth("offline");
      }
    };
    checkApiHealth();
  }, []);

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!user || !user.id) {
          setError("User not authenticated. Please log in.");
          return;
        }
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication token missing. Please log in.");
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axiosInstance.get(`/api/student/profile/${user.id}`, { headers });
        const studentData = response.data;
        setStudentData(studentData);
        if (studentData.assignedProjects?.length > 0) {
          setSelectedProjectId(studentData.assignedProjects[0]._id);
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          router.push("/login");
        }
        setError(err.response?.data?.error || "Error fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [user, router]);

  // Check if camera API is available
  const isCameraApiAvailable = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  // Handle camera permission request
  const requestCameraPermission = async () => {
    try {
      if (!isSecureContext) {
        throw new Error("Camera access requires a secure context (HTTPS or localhost).");
      }
      if (!isCameraApiAvailable()) {
        throw new Error("Camera API is not supported in this browser or environment.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission("granted");
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      console.error("Camera permission error:", err.name, err.message);
      let errorMessage = "Camera access denied. Please enable camera permissions in your browser settings.";
      if (err.name === "NotAllowedError") {
        errorMessage = "Camera access was denied. Please allow camera access in your browser settings.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found. Please ensure a camera is connected and available.";
      } else if (err.name === "SecurityError" || err.message.includes("secure context")) {
        errorMessage = "Camera access requires a secure connection (HTTPS or localhost). Please use ngrok or serve via HTTPS.";
      } else if (err.message.includes("Camera API is not supported")) {
        errorMessage = "This browser does not support the camera API. Please use a modern browser like Chrome or Firefox.";
      }
      setCameraPermission("denied");
      setScannerError(errorMessage);
      setShowPopup({ visible: true, message: errorMessage, isSuccess: false });
      return false;
    }
  };

  // Initialize and manage QR code scanner
  useEffect(() => {
    if (showScanner && cameraPermission === "granted") {
      if (!isCameraApiAvailable()) {
        setScannerError("Camera API is not supported in this browser or environment.");
        setShowPopup({ visible: true, message: "Camera API is not supported.", isSuccess: false });
        setShowScanner(false);
        return;
      }
      codeReader.current = new BrowserQRCodeReader();
      codeReader.current
        .decodeFromVideoDevice(null, videoRef.current, async (result, err) => {
          if (result) {
            await handleScan(result.getText());
          }
          if (err && err.name !== "NotFoundException") {
            console.error("QR scanning error:", err.name, err.message);
            setScannerError("Error scanning QR code. Please try again.");
            setShowPopup({ visible: true, message: "Error scanning QR code.", isSuccess: false });
          }
        })
        .catch((err) => {
          console.error("Camera initialization error:", err.name, err.message);
          setScannerError("Unable to access camera. Please ensure camera permissions are granted.");
          setShowPopup({ visible: true, message: "Unable to access camera.", isSuccess: false });
        });
    }

    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
        codeReader.current = null;
      }
    };
  }, [showScanner, cameraPermission]);

  // Toggle QR scanner
  const handleToggleScanner = async () => {
    if (!showScanner) {
      setScannerError(null);
      if (isFileProtocol || !isSecureContext) {
        setScannerError(
          "Camera access is not available when running from file:// or an insecure context. Please serve the app via http://192.168.8.113:3000 with ngrok HTTPS."
        );
        setShowPopup({
          visible: true,
          message: "Please use ngrok for HTTPS or serve via a secure context.",
          isSuccess: false,
        });
        return;
      }
      const hasPermission = await requestCameraPermission();
      if (hasPermission) {
        setShowScanner(true);
      }
    } else {
      setShowScanner(false);
      setCameraPermission("prompt");
      if (codeReader.current) {
        codeReader.current.reset();
        codeReader.current = null;
      }
    }
  };

  // Handle QR code scan
  const handleScan = async (qrData) => {
    try {
      setScannerError(null);
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token missing");
      }

      const response = await axiosInstance.post(
        `/api/interns/${user.id}/attendance/qr`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedResponse = await axiosInstance.get(`/api/student/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStudentData(updatedResponse.data);
      setShowScanner(false);
      setShowPopup({
        visible: true,
        message: response.data.message || "Attendance marked successfully!",
        isSuccess: true,
      });
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to mark attendance. Please try again.";
      setScannerError(errorMessage);
      setShowPopup({
        visible: true,
        message: errorMessage,
        isSuccess: false,
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Submit progress update
  const submitProgressUpdate = async (e) => {
    e.preventDefault();
    if (!studentData || !progressUpdate.trim() || !selectedProjectId) {
      setError("Please select a project and enter a progress update.");
      setShowPopup({
        visible: true,
        message: "Please select a project and enter a progress update.",
        isSuccess: false,
      });
      return;
    }
    if (progressUpdate.length > maxProgressLength) {
      setError(`Progress update must be ${maxProgressLength} characters or less.`);
      setShowPopup({
        visible: true,
        message: `Progress update must be ${maxProgressLength} characters or less.`,
        isSuccess: false,
      });
      return;
    }
    try {
      const token = localStorage.getItem("token");
      setLoading(true);
      await axiosInstance.post(
        `/api/student/progress/${selectedProjectId}`,
        { content: progressUpdate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const response = await axiosInstance.get(`/api/student/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudentData(response.data);
      setProgressUpdate("");
      setSelectedProjectId(response.data.assignedProjects?.length > 0 ? response.data.assignedProjects[0]._id : "");
      setError(null);
      setShowPopup({
        visible: true,
        message: "Progress update submitted successfully!",
        isSuccess: true,
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit progress update.");
      setShowPopup({
        visible: true,
        message: err.response?.data?.error || "Failed to submit progress update.",
        isSuccess: false,
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate project progress
  const getProjectProgress = (project) => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    const completedTasks = project.tasks.filter((task) => task.completed).length;
    return Math.round((completedTasks / project.tasks.length) * 100);
  };

  // Filter attendance records
  const filteredAttendance =
    studentData?.attendance?.filter((record) => {
      if (attendanceFilter === "all") return true;
      return record.status === attendanceFilter;
    }) || [];

  // Close popup
  const closePopup = () => {
    setShowPopup({ visible: false, message: "", isSuccess: true });
  };

  // Mark feedback as read
  const markFeedbackAsRead = async (projectId, feedbackId) => {
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.put(
        `/api/student/feedback/${feedbackId}/read`,
        { projectId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const response = await axiosInstance.get(`/api/student/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudentData(response.data);
    } catch (err) {
      console.error("Error marking feedback as read:", err);
    }
  };

  // Loading state
  if (loading && !studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-base text-gray-600 dark:text-gray-300 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-w-md w-full transition-colors duration-300">
          <div className="text-red-500 dark:text-red-400 mb-4 flex justify-center">
            <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 text-center">Error Loading Dashboard</h3>
          <p className="text-base text-gray-600 dark:text-gray-300 mb-4 text-center">{error}</p>
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-500 dark:bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 dark:hover:bg-indigo-700 transition duration-200 text-base"
            >
              Try Again
            </button>
          </div>
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 text-sm">
            <h4 className="font-medium mb-1">Debug Information:</h4>
            <p>
              API Status: <span className={apiHealth === "online" ? "text-green-500" : "text-red-500"}>{apiHealth}</span>
            </p>
            <p>User Role: {user ? user.role || "Not specified" : "Not logged in"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-inter transition-colors duration-300 ${isDarkMode ? "dark bg-gray-900" : "bg-gray-100"}`}>
      {/* Popup Modal */}
      {showPopup.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-lg transition-transform transform duration-300 scale-100">
            <div className="flex items-center mb-4">
              <FontAwesomeIcon
                icon={showPopup.isSuccess ? faCheckCircle : faExclamationTriangle}
                className={showPopup.isSuccess ? "text-green-500 dark:text-green-400 mr-2" : "text-red-500 dark:text-red-400 mr-2"}
                size="lg"
              />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {showPopup.isSuccess ? "Success" : "Error"}
              </h3>
            </div>
            <p className="text-base text-gray-700 dark:text-gray-300 mb-4">{showPopup.message}</p>
            <div className="flex justify-end">
              <button
                onClick={closePopup}
                className="bg-indigo-500 dark:bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 dark:hover:bg-indigo-700 transition duration-200 text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <FontAwesomeIcon icon={faGraduationCap} className="mr-2 text-indigo-500 dark:text-indigo-400 w-6 h-6" />
              NCAI Internship Portal
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Student Dashboard</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center sm:text-right">
              <p className="font-medium text-gray-800 dark:text-gray-100 text-base">{studentData?.name || "Student"}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{studentData?.email || ""}</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200"
              aria-label="Toggle dark mode"
            >
              <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} className="w-5 h-5" />
            </button>
            <button
              onClick={logout}
              className="bg-red-500 dark:bg-red-600 text-white px-6 py-2 mx-4 rounded-lg hover:bg-indigo-600 dark:hover:bg-indigo-700 flex items-center transition duration-200 text-base"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="mr-2 w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-2xl shadow-lg text-white p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Welcome back, {studentData?.name?.split(" ")[0] || "Student"}!
              </h2>
              <p className="text-sm opacity-90">
                {studentData?.assignedProjects?.length > 0
                  ? `You have ${studentData.assignedProjects.length} active project(s)`
                  : "You currently have no assigned projects"}
              </p>
              <p className="text-sm mt-1">
                Attendance Status:{" "}
                {studentData?.attendance?.length > 0
                  ? `${studentData.attendance[studentData.attendance.length - 1].status} on ${formatDate(
                      studentData.attendance[studentData.attendance.length - 1].date
                    )}`
                  : "No attendance recorded yet"}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 bg-opacity-20 dark:bg-opacity-10 p-3 rounded-full self-center sm:self-start">
              <FontAwesomeIcon icon={faUser} size="lg" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          {["projects", "progress", "feedback", ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 rounded-t-lg ${
                activeTab === tab
                  ? "bg-indigo-500 text-white"
                  : "text-gray-00 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <FontAwesomeIcon
                icon={
                  tab === "projects" ? faTasks : tab === "progress" ? faChartLine : tab === "feedback" ? faComments : faCalendarAlt
                }
                className="mr-2 w-4 h-4"
              />
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "feedback" && unreadFeedbackCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{unreadFeedbackCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl overflow-hidden transition-colors duration-300">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-indigo-500 dark:text-indigo-400 w-5 h-5" />
                  Attendance Records
                </h3>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Filter:</label>
                  <select
                    value={attendanceFilter}
                    onChange={(e) => setAttendanceFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                  </select>
                </div>
              </div>
              <div className="mb-6">
                <button
                  onClick={handleToggleScanner}
                  className="bg-indigo-500 dark:bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-600 dark:hover:bg-indigo-700 transition duration-200 text-sm w-full sm:w-auto justify-center"
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faQrcode} className="mr-2 w-4 h-4" />
                  {showScanner ? "Hide QR Scanner" : "Scan QR Code"}
                </button>
                {showScanner && (
                  <div className="mt-4">
                    <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-700">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Position your QR code within the frame below:</p>
                      <video ref={videoRef} className="w-full max-w-md h-auto rounded-lg" />
                      {scannerError && <p className="text-red-500 dark:text-red-400 text-sm mt-2">{scannerError}</p>}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Ensure good lighting and hold the QR code steady.</p>
                    </div>
                  </div>
                )}
              </div>
              {filteredAttendance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time In</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time Out</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredAttendance.map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDate(record.date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.status}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.timeIn || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.timeOut || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{record.notes || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No attendance records found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl overflow-hidden transition-colors duration-300">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <FontAwesomeIcon icon={faProjectDiagram} className="mr-2 text-indigo-500 dark:text-indigo-400 w-5 h-5" />
                Assigned Projects
              </h3>
              {studentData?.assignedProjects?.length > 0 ? (
                <div className="space-y-4">
                  {studentData.assignedProjects.map((project) => (
                    <div
                      key={project._id}
                      className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:shadow-md transition duration-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{project.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{project.description}</p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            project.status === "Completed"
                              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300"
                              : project.status === "In Progress"
                              ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300"
                              : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300"
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 dark:text-gray-400 gap-2 sm:gap-4">
                          <span className="flex items-center">
                            <FontAwesomeIcon icon={faCalendarAlt} className="mr-1 w-4 h-4" />
                            Start Date: {formatDate(project.startDate)}
                          </span>
                          {project.endDate && (
                            <span className="flex items-center">
                              <FontAwesomeIcon icon={faCalendarAlt} className="mr-1 w-4 h-4" />
                              End Date: {formatDate(project.endDate)}
                            </span>
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="text-sm text-gray-700 dark:text-gray-300">Progress: {getProjectProgress(project)}%</div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div
                              className="bg-indigo-500 dark:bg-indigo-400 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${getProjectProgress(project)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      {project.tasks && project.tasks.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tasks</h5>
                          <ul className="space-y-2">
                            {project.tasks.map((task, index) => (
                              <li key={index} className="flex items-start">
                                <span
                                  className={`inline-block w-5 h-5 rounded-full mt-1 mr-2 flex-shrink-0 ${
                                    task.completed
                                      ? "bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700"
                                      : "bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                                  }`}
                                >
                                  {task.completed && (
                                    <FontAwesomeIcon
                                      icon={faCheckCircle}
                                      className="text-green-500 dark:text-green-400 w-4 h-4 relative -left-[2px] -top-[2px]"
                                    />
                                  )}
                                </span>
                                <span
                                  className={`text-sm ${
                                    task.completed ? "text-gray-500 dark:text-gray-400 line-through" : "text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {task.title || task}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                    <FontAwesomeIcon icon={faProjectDiagram} className="text-gray-400 dark:text-gray-500 text-xl" />
                  </div>
                  <h4 className="text-gray-700 dark:text-gray-100 font-semibold text-base">No projects assigned</h4>
                  <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Your supervisor will assign projects to you soon</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === "progress" && (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl overflow-hidden transition-colors duration-300">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <FontAwesomeIcon icon={faChartLine} className="mr-2 text-indigo-500 dark:text-indigo-400 w-5 h-5" />
                  Progress Updates
                </h3>
                {studentData?.assignedProjects?.length > 0 && (
                  <button
                    onClick={() => document.getElementById("progress-form").scrollIntoView({ behavior: "smooth" })}
                    className="bg-indigo-500 dark:bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-600 dark:hover:bg-indigo-700 transition duration-200 text-sm"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2 w-4 h-4" />
                    New Update
                  </button>
                )}
              </div>
              {studentData?.progressUpdates?.length > 0 ? (
                <div className="space-y-4">
                  {studentData.progressUpdates.map((update, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:shadow-sm transition duration-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {formatDate(update.date || update.timestamp)}
                        </span>
                        {update.hasAdminFeedback && (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full flex items-center">
                            <FontAwesomeIcon icon={faComments} className="mr-1 w-4 h-4" />
                            Feedback Received
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{update.content || update.text}</p>
                      {update.feedback && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center text-indigo-500 dark:text-indigo-400 mb-1">
                            <FontAwesomeIcon icon={faComments} className="mr-2 w-4 h-4" />
                            <span className="text-sm font-semibold">Supervisor Feedback</span>
                          </div>
                          <div className="bg-indigo-50 dark:bg-indigo-900 p-3 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                            {update.feedback}
                          </div>
                          {update.feedbackDate && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                              Provided on {formatDate(update.feedbackDate)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                    <FontAwesomeIcon icon={faClipboardList} className="text-gray-400 dark:text-gray-500 text-xl" />
                  </div>
                  <h4 className="text-gray-700 dark:text-gray-100 font-semibold text-base">No progress updates yet</h4>
                  <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Submit your first progress update below</p>
                </div>
              )}
              {studentData?.assignedProjects?.length > 0 && (
                <form id="progress-form" onSubmit={submitProgressUpdate} className="mt-8 border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                    <FontAwesomeIcon icon={faPencilAlt} className="mr-2 text-indigo-500 dark:text-indigo-400 w-5 h-5" />
                    Submit New Progress Update
                  </h4>
                  <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">Select Project</label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      required
                    >
                      <option value="">Select a project</option>
                      {studentData.assignedProjects.map((project) => (
                        <option key={project._id} value={project._id}>
                          {project.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <textarea
                      value={progressUpdate}
                      onChange={(e) => setProgressUpdate(e.target.value)}
                      placeholder="What did you accomplish today? What challenges did you face? What are your next steps?"
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none h-32 text-sm"
                      required
                    ></textarea>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {progressUpdate.length}/{maxProgressLength} characters
                    </p>
                    {error && <div className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</div>}
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-indigo-500 dark:bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-600 dark:hover:bg-indigo-700 transition duration-200 text-sm"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faCheckCircle} className="mr-2 w-4 h-4" />
                          Submit Update
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === "feedback" && (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl overflow-hidden transition-colors duration-300">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <FontAwesomeIcon icon={faComments} className="mr-2 text-indigo-500 dark:text-indigo-400 w-5 h-5" />
                Feedback from Supervisors
              </h3>
              {studentData?.projectFeedback?.length > 0 || studentData?.assignedProjects?.some((p) => p.feedback?.length > 0) ? (
                <div className="space-y-4">
                  {studentData?.assignedProjects?.map(
                    (project) =>
                      project.feedback?.length > 0 && (
                        <div key={project._id} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                          <div className="flex items-center mb-3">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{project.title}</h4>
                            <span className="ml-auto text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 px-2 py-1 rounded-full">
                              Project Feedback
                            </span>
                          </div>
                          <div className="space-y-3">
                            {project.feedback.map((feedback, idx) => (
                              <div key={idx} className="bg-indigo-50 dark:bg-indigo-900 p-3 rounded-lg text-sm">
                                <p className="text-gray-700 dark:text-gray-300">{feedback.comment || feedback.content}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(feedback.date)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                  )}
                  {studentData?.projectFeedback?.map((feedback, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:shadow-sm transition duration-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {feedback.projectId
                            ? `Feedback on ${
                                studentData.assignedProjects?.find((p) => p._id === feedback.projectId)?.title || "Project"
                              }`
                            : "General Feedback"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(feedback.date)}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{feedback.content}</p>
                      {!feedback.isRead && (
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => markFeedbackAsRead(feedback.projectId, feedback._id)}
                            className="text-xs bg-indigo-500 dark:bg-indigo-600 text-white px-2 py-1 rounded-lg hover:bg-indigo-600 dark:hover:bg-indigo-700 transition duration-200"
                          >
                            Mark as Read
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                    <FontAwesomeIcon icon={faComments} className="text-gray-400 dark:text-gray-500 text-xl" />
                  </div>
                  <h4 className="text-gray-700 dark:text-gray-100 font-semibold text-base">No feedback yet</h4>
                  <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Your supervisors will provide feedback on your work</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        body {
          font-family: 'Inter', sans-serif;
        }

        @media (max-width: 640px) {
          table {
            display: block;
          }
          thead {
            display: none;
          }
          tbody tr {
            display: flex;
            flex-direction: column;
            border-bottom: 1px solid #e5e7eb;
            padding: 1rem 0;
          }
          td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 1rem;
          }
          td::before {
            content: attr(data-label);
            font-weight: 600;
            color: #4b5563;
          }
        }
        video {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
  );
}

export default function ProtectedInternDashboard() {
  return (
    <ProtectedRoute>
      <InternDashboard />
    </ProtectedRoute>
  );
}