const ICONS = {
  top: (
    <path d="M8 4l4-2 4 2 4 4-3 3-1-1v11H8V10l-1 1-3-3z" />
  ),
  bottom: (
    <path d="M7 3h10l1 18h-4l-1-10-1 10H8L7 3z" />
  ),
  shoes: (
    <path d="M4 16c0-2 2-3 4-4l6-3c1-.5 2-.5 3 0l3 2c1 .5 2 1.5 2 3v2H4v-0z" />
  ),
  belt: (
    <path d="M3 11h6v-1a2 2 0 012-2h2a2 2 0 012 2v1h6v2h-6v1a2 2 0 01-2 2h-2a2 2 0 01-2-2v-1H3v-2z" />
  ),
  watch: (
    <>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 9v3l2 1" />
      <path d="M10 3h4M10 21h4" />
    </>
  ),
  jewelry: (
    <path d="M12 3a7 7 0 00-2 13.7V19a2 2 0 004 0v-2.3A7 7 0 0012 3z" />
  ),
  default: <circle cx="12" cy="12" r="8" />,
};

function CategoryIcon({ category, className = "w-8 h-8" }) {
  const path = ICONS[category] || ICONS.default;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {path}
    </svg>
  );
}

export default CategoryIcon;