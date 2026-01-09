'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGraduationCap,
  faProjectDiagram,
  faHistory,
  faSignOutAlt,
  faCog,
  faChartLine,
  faBars,
  faTimes,
  faPaperPlane,

  faClipboardList
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [activeItem, setActiveItem] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (pathname.includes('interns')) setActiveItem('interns');
    else if (pathname.includes('projects')) setActiveItem('projects');
    else if (pathname.includes('past-interns')) setActiveItem('past-interns');
    else if (pathname.includes('activities')) setActiveItem('activities');
    else if (pathname.includes('settings')) setActiveItem('settings');
    else if (pathname.includes('Data')) setActiveItem('Data');
    else setActiveItem('dashboard');
  }, [pathname]);

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
  };

  const sidebarItems = user?.role === 'student'
    ? [
        { name: 'progress-updates', label: 'Progress Updates', icon: faChartLine, link: '/pages/student/progress-updates' },
      ]
    : [
        { name: 'dashboard', label: 'Dashboard', icon: faChartLine, link: '/Admin/dashboard' },
        { name: 'interns', label: 'Certification', icon: faGraduationCap, link: '/Admin/certification' },
        { name: 'projects', label: 'Projects', icon: faProjectDiagram, link: '/Admin/projects' },
        { name: 'past-interns', label: 'Past Interns', icon: faHistory, link: '/Admin/past-interns' },
        { name: 'activities', label: 'Recent Activities', icon: faClipboardList, link: '/Admin/activities' },
        { name: 'Attendance', label: 'Attendance', icon: faCog, link: '/Admin/studentManagment' },
         { name: 'Requests', label: 'Requests', icon: faPaperPlane, link: '/Admin/pending-students' },
      ];

  return (
    <>
      {/* Hamburger Button (visible on mobile) */}
      <div className="flex md:hidden p-4 bg-blue-900 text-white justify-between items-center sticky top-0 z-50">
        <h1 className="text-lg sm:text-xl font-bold">NCAI Admin</h1>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2">
          <FontAwesomeIcon icon={faBars} size="lg" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col bg-gradient-to-b from-gray-900 to-blue-800 text-white w-56 lg:w-64 min-h-screen font-sans shadow-xl">
        <div className="p-4 lg:p-6">
          <h1 className="text-xl lg:text-2xl font-bold tracking-wide">NCAI Admin</h1>
          <p className="text-xs lg:text-sm text-gray-300">Portal Dashboard</p>
        </div>
        <nav className="flex-1 mt-2 lg:mt-4 space-y-1 px-2">
          {sidebarItems.map((item) => (
            <motion.div
              key={item.name}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={item.link}
                className={`group flex items-center px-3 lg:px-4 py-2 lg:py-3 text-sm lg:text-base rounded-md transition-all duration-200 ${
                  activeItem === item.name
                    ? 'bg-white text-blue-900 font-semibold shadow-md'
                    : 'hover:bg-blue-600 hover:bg-opacity-30'
                }`}
                onClick={() => setActiveItem(item.name)}
              >
                <FontAwesomeIcon icon={item.icon} className="mr-2 lg:mr-3 text-base lg:text-lg" />
                <span>{item.label}</span>
              </Link>
            </motion.div>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-600">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-3 lg:px-4 py-2 lg:py-3 text-sm lg:text-base bg-red-600 hover:bg-red-700 rounded-md shadow-md transition-colors"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2 lg:mr-3" />
            <span>Logout</span>
          </motion.button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="fixed top-0 left-0 z-50 w-64 h-full bg-gradient-to-b from-indigo-900 to-blue-700 text-white flex flex-col shadow-lg"
            >
              <div className="p-4 flex justify-between items-center">
                <h2 className="text-lg font-bold">NCAI Admin</h2>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2">
                  <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>
              </div>
              <nav className="flex-1 mt-4 space-y-1 px-2">
                {sidebarItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.link}
                    className={`flex items-center px-4 py-3 text-sm rounded-md transition-all ${
                      activeItem === item.name
                        ? 'bg-white text-blue-900 font-semibold shadow-md'
                        : 'hover:bg-blue-600 hover:bg-opacity-30'
                    }`}
                    onClick={() => {
                      setActiveItem(item.name);
                      setIsSidebarOpen(false);
                    }}
                  >
                    <FontAwesomeIcon icon={item.icon} className="mr-3 text-base" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
              <div className="p-4 border-t border-blue-600">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-3 text-sm bg-red-600 hover:bg-red-700 rounded-md shadow-md transition-colors"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="mr-3" />
                  <span>Logout</span>
                </motion.button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}