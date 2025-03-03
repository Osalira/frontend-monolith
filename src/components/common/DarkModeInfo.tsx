import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const DarkModeInfo: React.FC = () => {
  const { darkMode } = useTheme();
  
  return (
    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
        Theme Information
      </h3>
      <p className="text-gray-600 dark:text-gray-300">
        Your current theme is: <span className="font-semibold">{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
      </p>
      <p className="text-gray-600 dark:text-gray-300 mt-2">
        You can toggle the theme using the {darkMode ? 'sun' : 'moon'} icon in the navigation bar.
      </p>
      <div className="mt-4 flex space-x-4">
        <div className="p-3 bg-white dark:bg-gray-800 rounded shadow-sm">
          <p className="text-gray-800 dark:text-white text-sm">Light text on dark background</p>
        </div>
        <div className="p-3 bg-gray-800 dark:bg-white rounded shadow-sm">
          <p className="text-white dark:text-gray-800 text-sm">Dark text on light background</p>
        </div>
      </div>
    </div>
  );
};

export default DarkModeInfo; 