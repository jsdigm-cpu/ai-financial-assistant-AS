import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  isOpen: boolean;
  mainText?: string;
  message?: string;
  progressMessages?: string[];
  estimatedDuration?: number;
}

const LoadingModal: React.FC<Props> = ({ isOpen, mainText, message, progressMessages, estimatedDuration }) => {
  if (!isOpen) return null;

  const displayMessage = mainText || message || "처리 중...";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-md w-full mx-4"
      >
        <div className="relative mb-8">
          <div className="w-20 h-20 border-4 border-brand-primary/20 rounded-full"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-text-primary mb-2 text-center">{displayMessage}</h3>
        <p className="text-text-muted text-center mb-6">데이터를 안전하게 처리하고 있습니다.</p>
        
        {progressMessages && progressMessages.length > 0 && (
          <div className="w-full space-y-3 mb-6 bg-surface-subtle p-4 rounded-xl border border-border-color">
            {progressMessages.map((msg, idx) => (
              <div key={idx} className="flex items-center text-sm font-medium text-text-primary">
                <div className="w-2 h-2 bg-brand-primary rounded-full mr-3 shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                {msg}
              </div>
            ))}
          </div>
        )}

        {estimatedDuration && (
          <div className="flex items-center gap-2 text-xs font-bold text-brand-accent bg-blue-50 px-3 py-1.5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            예상 소요 시간: 약 {Math.round(estimatedDuration / 1000)}초
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default LoadingModal;
