export default function LoginBackgroundPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top left - Cloche/Food cover */}
      <svg
        className="absolute top-8 left-4 w-24 h-24 opacity-20"
        viewBox="0 0 100 100"
        fill="none"
        stroke="#2D5A4A"
        strokeWidth="1.5"
      >
        <ellipse cx="50" cy="75" rx="40" ry="8" />
        <path d="M10 75 Q10 35 50 25 Q90 35 90 75" />
        <circle cx="50" cy="20" r="5" />
      </svg>

      {/* Top right - Cloche */}
      <svg
        className="absolute top-16 right-8 w-20 h-20 opacity-15"
        viewBox="0 0 100 100"
        fill="none"
        stroke="#5BA88B"
        strokeWidth="1.5"
      >
        <ellipse cx="50" cy="75" rx="40" ry="8" />
        <path d="M10 75 Q10 35 50 25 Q90 35 90 75" />
        <circle cx="50" cy="20" r="5" />
      </svg>

      {/* Middle right - Fork */}
      <svg
        className="absolute top-1/3 right-4 w-16 h-32 opacity-20"
        viewBox="0 0 40 100"
        fill="none"
        stroke="#2D5A4A"
        strokeWidth="1.5"
      >
        <line x1="20" y1="30" x2="20" y2="95" strokeLinecap="round" />
        <line x1="10" y1="5" x2="10" y2="35" strokeLinecap="round" />
        <line x1="20" y1="5" x2="20" y2="35" strokeLinecap="round" />
        <line x1="30" y1="5" x2="30" y2="35" strokeLinecap="round" />
        <path d="M10 35 Q20 45 30 35" />
      </svg>

      {/* Bottom left - Spoon */}
      <svg
        className="absolute bottom-32 left-8 w-12 h-28 opacity-20"
        viewBox="0 0 40 100"
        fill="none"
        stroke="#5BA88B"
        strokeWidth="1.5"
      >
        <line x1="20" y1="40" x2="20" y2="95" strokeLinecap="round" />
        <ellipse cx="20" cy="20" rx="15" ry="20" />
      </svg>

      {/* Bottom center - Fork and Spoon crossed */}
      <svg
        className="absolute bottom-8 left-1/4 w-20 h-20 opacity-15"
        viewBox="0 0 100 100"
        fill="none"
        stroke="#2D5A4A"
        strokeWidth="1.5"
      >
        {/* Fork */}
        <line x1="30" y1="90" x2="45" y2="30" strokeLinecap="round" />
        <line x1="35" y1="10" x2="40" y2="35" strokeLinecap="round" />
        <line x1="45" y1="10" x2="45" y2="35" strokeLinecap="round" />
        <line x1="55" y1="10" x2="50" y2="35" strokeLinecap="round" />
        {/* Spoon */}
        <line x1="70" y1="90" x2="55" y2="40" strokeLinecap="round" />
        <ellipse cx="55" cy="25" rx="10" ry="15" />
      </svg>

      {/* Bottom right - Wine glass */}
      <svg
        className="absolute bottom-16 right-12 w-16 h-24 opacity-20"
        viewBox="0 0 60 100"
        fill="none"
        stroke="#5BA88B"
        strokeWidth="1.5"
      >
        <path d="M15 5 L15 35 Q15 50 30 55 Q45 50 45 35 L45 5" />
        <line x1="30" y1="55" x2="30" y2="85" strokeLinecap="round" />
        <line x1="15" y1="90" x2="45" y2="90" strokeLinecap="round" />
      </svg>

      {/* Top center - Small plate */}
      <svg
        className="absolute top-4 left-1/3 w-16 h-8 opacity-10"
        viewBox="0 0 100 40"
        fill="none"
        stroke="#2D5A4A"
        strokeWidth="1.5"
      >
        <ellipse cx="50" cy="20" rx="45" ry="15" />
        <ellipse cx="50" cy="20" rx="30" ry="10" />
      </svg>
    </div>
  );
}
