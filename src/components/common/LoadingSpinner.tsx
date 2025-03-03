import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-5 h-5 border-2',
    medium: 'w-10 h-10 border-4',
    large: 'w-16 h-16 border-[6px]',
  };

  return (
    <div className="flex justify-center items-center min-h-[200px] w-full">
      <div 
        className={`${sizeClasses[size]} rounded-full border-solid border-gray-200 border-t-blue-500 animate-spin`}
      />
    </div>
  );
};

export default LoadingSpinner; 