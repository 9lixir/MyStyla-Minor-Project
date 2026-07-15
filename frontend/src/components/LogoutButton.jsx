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
        'inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-pink-200 hover:text-pink-600'
      }
    >
      <LogOut size={16} />
      Logout
    </button>
  );
}