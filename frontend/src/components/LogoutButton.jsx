import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

export function LogoutButton({ onNavigate, className }) {
  const handleLogout = () => {
    useAuthStore.getState().logout();
    onNavigate('login');
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={
        className ??
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition'
      }
      style={
        className
          ? undefined
          : {
              borderColor: 'var(--mystyla-border)',
              background: 'var(--mystyla-surface)',
              color: 'var(--mystyla-muted)',
            }
      }
      onMouseEnter={(e) => {
        if (className) return;
        e.currentTarget.style.borderColor = 'rgba(181,41,63,0.7)';
        e.currentTarget.style.color = 'var(--mystyla-primary)';
      }}
      onMouseLeave={(e) => {
        if (className) return;
        e.currentTarget.style.borderColor = 'var(--mystyla-border)';
        e.currentTarget.style.color = 'var(--mystyla-muted)';
      }}
    >
      <LogOut size={16} />
      Logout
    </button>
  );
}