'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faGraduationCap,
  faProjectDiagram,
  faHistory,
  faSignOutAlt,
  faCog,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [activeItem, setActiveItem] = useState('dashboard');

  useEffect(() => {
    // Set active item based on pathname
    if (pathname.includes('interns')) {
      setActiveItem('interns');
    } else if (pathname.includes('projects')) {
      setActiveItem('projects');
    } else if (pathname.includes('past-interns')) {
      setActiveItem('past-interns');
    } else if (pathname.includes('activities')) {
      setActiveItem('activities');
    } else if (pathname.includes('settings')) {
      setActiveItem('settings');
    } else {
      setActiveItem('dashboard');
    }
  }, [pathname]);

  const handleLogout = (e) => {
    e.preventDefault();
    console.log('Logging out...');
    logout();
  };

  const sidebarItems = user?.role === 'student' ? [
    { name: 'progress-updates', label: 'Progress Updates', icon: faChartLine, link: '/pages/student/progress-updates' },
    // Add other student links here
  ] : [
    { name: 'dashboard', label: 'Dashboard', icon: faChartLine, link: '/Admin/dashboard' },
    { name: 'interns', label: 'Cerification', icon: faGraduationCap, link: '/Admin/certification' },
    { name: 'projects', label: 'Projects', icon: faProjectDiagram, link: '/Admin/projects' },
    { name: 'past-interns', label: 'Past Interns', icon: faHistory, link: '/Admin/past-interns' },
    { name: 'activities', label: 'Recent Activities', icon: faHistory, link: '/Admin/activities' },
    { name: 'settings', label: 'Settings', icon: faCog, link: '/Admin/settings' },
  ];

  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen flex flex-col">
      <div className="p-4 bg-gray-800">
        <h1 className="text-xl font-bold">NCAI Admin Portal</h1>
      </div>
      <nav className="flex-1 mt-6">
        <ul>
          {sidebarItems.map((item) => (
            <li key={item.name} className="mb-2">
              <Link 
                href={item.link}
                className={`flex items-center px-4 py-3 text-white hover:bg-gray-700 transition-colors ${
                  activeItem === item.name ? 'bg-blue-600' : ''
                }`}
                onClick={() => setActiveItem(item.name)}
              >
                <FontAwesomeIcon icon={item.icon} className="mr-3" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 text-white hover:bg-red-600 transition-colors rounded"
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}