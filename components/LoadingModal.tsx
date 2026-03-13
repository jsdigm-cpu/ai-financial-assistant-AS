import React from 'react';

interface Props {
  isOpen: boolean;
  message: string;
}

const LoadingModal: React.FC<Props> = ({ isOpen, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full mx-4">
        <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <h3 className="text-xl font-bold text-text-primary mb-2 text-center">{message}</h3>
        <p className="text-sm text-text-muted text-center">잠시만 기다려주세요...</p>
      </div>
    </div>
  );
};

export default LoadingModal;
