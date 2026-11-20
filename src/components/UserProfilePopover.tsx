import React, { useState } from 'react';
import { LogOut, User as UserIcon, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UserProfilePopoverProps {
  onOpenSummary?: () => void;
}

export const UserProfilePopover: React.FC<UserProfilePopoverProps> = ({
  onOpenSummary,
}) => {
  const { user, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!user) return null;

  const avatarUrl = profile?.avatar_url;
  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User';
  const email = profile?.email || user.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(false);
    await signOut();
  };

  return (
    <div
      className="relative inline-block z-30"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Profile Photo Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-9 h-9 rounded-full border-2 border-amber-300 bg-white shadow-sm overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-orange-300 transition-all cursor-pointer focus:outline-none"
        aria-label="사용자 프로필"
        aria-expanded={isOpen}
      >
        {avatarUrl && !imgError ? (
          <img
            src={avatarUrl}
            alt={displayName}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : initial ? (
          <span className="w-full h-full bg-gradient-to-tr from-orange-400 to-amber-400 text-white font-fun font-bold text-sm flex items-center justify-center">
            {initial}
          </span>
        ) : (
          <UserIcon className="w-4 h-4 text-amber-700" />
        )}
      </button>

      {/* Hover Popover Below Profile Photo */}
      <div
        className={`absolute right-0 top-full pt-2 w-52 transition-all duration-150 ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-1 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-2xl shadow-xl border-2 border-amber-200 p-2.5 text-left">
          <div className="px-2 py-1.5 border-b border-amber-100 mb-1.5">
            <p className="text-xs font-extrabold text-slate-800 truncate">
              {displayName}
            </p>
            {email && (
              <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                {email}
              </p>
            )}
          </div>

          {onOpenSummary && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSummary();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer mb-1"
            >
              <BarChart3 className="w-3.5 h-3.5 text-orange-500" />
              <span>학습 활동 요약</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
