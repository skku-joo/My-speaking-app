import React from 'react';

export type CharacterMood = 'happy' | 'talking' | 'listening' | 'cheering' | 'thinking';

interface CharacterAvatarProps {
  mood?: CharacterMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  name?: string;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  mood = 'happy',
  size = 'md',
  className = '',
  name = 'Tobi',
}) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
      {/* Glow / Halo when listening or cheering */}
      {mood === 'listening' && (
        <span className="absolute inset-0 rounded-full bg-amber-400 opacity-40 animate-ping" />
      )}
      {mood === 'cheering' && (
        <span className="absolute -inset-1 rounded-full bg-emerald-400 opacity-40 animate-pulse" />
      )}

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md transition-transform duration-300 transform hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle / head */}
        <circle cx="50" cy="50" r="46" fill="#FEEBC8" stroke="#F6AD55" strokeWidth="4" />

        {/* Hair / Cap */}
        <path
          d="M 18 42 C 18 20, 82 20, 82 42 C 78 30, 65 24, 50 24 C 35 24, 22 30, 18 42 Z"
          fill="#4A5568"
        />
        {/* Cute small bear/buddy ears */}
        <circle cx="22" cy="22" r="12" fill="#F6AD55" />
        <circle cx="22" cy="22" r="7" fill="#FED7AA" />
        <circle cx="78" cy="22" r="12" fill="#F6AD55" />
        <circle cx="78" cy="22" r="7" fill="#FED7AA" />

        {/* Cheeks */}
        <ellipse cx="28" cy="58" rx="6" ry="3.5" fill="#FCA5A5" opacity="0.8" />
        <ellipse cx="72" cy="58" rx="6" ry="3.5" fill="#FCA5A5" opacity="0.8" />

        {/* Eyes based on mood */}
        {mood === 'happy' || mood === 'cheering' ? (
          <>
            {/* Happy curved eyes ^^ */}
            <path
              d="M 32 48 Q 38 42 44 48"
              stroke="#2D3748"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 56 48 Q 62 42 68 48"
              stroke="#2D3748"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          </>
        ) : mood === 'listening' ? (
          <>
            {/* Wide attentive eyes with sparkle */}
            <circle cx="38" cy="48" r="5" fill="#2D3748" />
            <circle cx="36" cy="46" r="1.8" fill="#FFFFFF" />
            <circle cx="62" cy="48" r="5" fill="#2D3748" />
            <circle cx="60" cy="46" r="1.8" fill="#FFFFFF" />
          </>
        ) : mood === 'thinking' ? (
          <>
            {/* Thinking looking slightly up */}
            <circle cx="38" cy="45" r="4.5" fill="#2D3748" />
            <circle cx="62" cy="45" r="4.5" fill="#2D3748" />
            <path d="M 30 38 Q 38 34 46 38" stroke="#4A5568" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 54 35 Q 62 39 70 38" stroke="#4A5568" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Standard friendly eyes */}
            <circle cx="38" cy="48" r="4.5" fill="#2D3748" />
            <circle cx="36" cy="46" r="1.5" fill="#FFFFFF" />
            <circle cx="62" cy="48" r="4.5" fill="#2D3748" />
            <circle cx="60" cy="46" r="1.5" fill="#FFFFFF" />
          </>
        )}

        {/* Mouth based on mood */}
        {mood === 'talking' ? (
          <path
            d="M 42 60 Q 50 72 58 60 Z"
            fill="#E53E3E"
            stroke="#2D3748"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        ) : mood === 'cheering' ? (
          <path
            d="M 38 58 Q 50 74 62 58 Z"
            fill="#E53E3E"
            stroke="#2D3748"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        ) : mood === 'listening' ? (
          <ellipse cx="50" cy="62" rx="3" ry="4" fill="#2D3748" />
        ) : mood === 'thinking' ? (
          <path
            d="M 44 64 Q 50 61 56 64"
            stroke="#2D3748"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <path
            d="M 42 60 Q 50 67 58 60"
            stroke="#2D3748"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>
      {name && (
        <span className="sr-only">{name}</span>
      )}
    </div>
  );
};
