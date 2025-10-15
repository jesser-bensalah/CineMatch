import React from 'react';
import { IonSpinner } from '@ionic/react';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  message?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'large', 
  message = 'Chargement...',
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <IonSpinner 
        name="crescent" 
        className={size === 'large' ? 'w-12 h-12 text-blue-600' : 'w-6 h-6 text-blue-600'} 
      />
      {message && (
        <p className="mt-4 text-gray-600 text-sm font-medium">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;