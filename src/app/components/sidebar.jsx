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
        { name: 'activities', label: 'Recent Activities', icon: faHistory, link: '/Admin/activities' },
        { name: 'Data', label: 'Data', icon: faCog, link: '/Admin/studentManagment' },
      ];

  return (
    <>
      {/* Hamburger Button (visible only on small screens) */}
      <div className="md:hidden p-4 flex justify-between items-center bg-blue-900 text-white">
        <h1 className="text-xl font-bold">NCAI Admin</h1>
        <button onClick={() => setIsSidebarOpen(true)}>
          <FontAwesomeIcon icon={faBars} size="lg" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col bg-gradient-to-b from-gray-900 to-blue-800 text-white w-64 min-h-screen font-sans shadow-xl">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-wide">NCAI Admin</h1>
          <p className="text-sm text-gray-300">Portal Dashboard</p>
        </div>
        <nav className="flex-1 mt-4 space-y-1 px-2">
          {sidebarItems.map((item) => (
            <motion.div
              key={item.name}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={item.link}
                className={`group flex items-center px-4 py-3 rounded-md transition-all duration-200 ${
                  activeItem === item.name
                    ? 'bg-white text-blue-900 font-semibold shadow-md'
                    : 'hover:bg-blue-600 hover:bg-opacity-30'
                }`}
                onClick={() => setActiveItem(item.name)}
              >
                <FontAwesomeIcon icon={item.icon} className="mr-3 text-lg" />
                <span>{item.label}</span>
              </Link>
            </motion.div>
          ))}
        </nav>
        <div className="p-4 mt-auto border-t border-blue-600">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-3 text-white bg-red-600 hover:bg-red-700 transition-colors rounded-md shadow-md"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-3" />
            <span>Logout</span>
          </motion.button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed top-0 left-0 z-50 w-64 h-full bg-gradient-to-b from-indigo-900 to-blue-700 text-white flex flex-col shadow-lg"
          >
            <div className="p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">NCAI Admin</h2>
              <button onClick={() => setIsSidebarOpen(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <nav className="flex-1 mt-4 space-y-1 px-2">
              {sidebarItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.link}
                  className={`flex items-center px-4 py-3 rounded-md transition-all ${
                    activeItem === item.name
                      ? 'bg-white text-blue-900 font-semibold shadow-md'
                      : 'hover:bg-blue-600 hover:bg-opacity-30'
                  }`}
                  onClick={() => {
                    setActiveItem(item.name);
                    setIsSidebarOpen(false);
                  }}
                >
                  <FontAwesomeIcon icon={item.icon} className="mr-3 text-lg" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="p-4 mt-auto border-t border-blue-600">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-3 text-white bg-red-600 hover:bg-red-700 transition-colors rounded-md shadow-md"
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="mr-3" />
                <span>Logout</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
