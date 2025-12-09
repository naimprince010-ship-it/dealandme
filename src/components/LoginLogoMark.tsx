export default function LoginLogoMark({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg p-4 ${className}`}>
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* D shape outline */}
        <path
          d="M16 8C16 8 16 56 16 56C16 56 32 56 32 56C46 56 56 46 56 32C56 18 46 8 32 8C32 8 16 8 16 8Z"
          stroke="#2D5A4A"
          strokeWidth="3"
          fill="none"
        />
        
        {/* Fork handle */}
        <line
          x1="28"
          y1="20"
          x2="28"
          y2="44"
          stroke="#2D5A4A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        
        {/* Fork prongs */}
        <line
          x1="24"
          y1="20"
          x2="24"
          y2="28"
          stroke="#2D5A4A"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="28"
          y1="20"
          x2="28"
          y2="28"
          stroke="#2D5A4A"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="32"
          y1="20"
          x2="32"
          y2="28"
          stroke="#2D5A4A"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Checkmark */}
        <path
          d="M34 32L38 38L48 26"
          stroke="#5BA88B"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
