/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          // Custom colors for the trading app
          profit: '#38a169',  // Green for positive values
          loss: '#e53e3e',    // Red for negative values
          neutral: '#3182ce', // Blue for neutral values
          
          // Custom background colors
          'bg-light': '#f7fafc',
          'bg-dark': '#1a202c',
          
          // Custom trading chart colors
          'chart-line': '#4299e1',
          'chart-grid': '#e2e8f0',
          'chart-area': 'rgba(66, 153, 225, 0.2)',
          
          // Dark mode equivalents
          'dark-profit': '#48bb78',
          'dark-loss': '#f56565',
          'dark-neutral': '#63b3ed',
          'dark-chart-line': '#90cdf4',
          'dark-chart-grid': '#2d3748',
          'dark-chart-area': 'rgba(144, 205, 244, 0.2)',
        },
      },
    },
    plugins: [],
  };
  