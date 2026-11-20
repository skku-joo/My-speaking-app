import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { AuthLoginCard } from './AuthLoginCard';

interface AuthPageProps {
  onBackToHome: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBackToHome }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100/70 flex flex-col justify-between p-4 sm:p-6 md:p-8 max-w-lg mx-auto select-none">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>메인으로</span>
        </button>
      </div>

      <div className="my-auto py-6 flex items-center justify-center">
        <AuthLoginCard />
      </div>

      <div className="h-4" />
    </div>
  );
};
