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
        'inline-flex items-center gap-2 rounded-full border border-[#2A3374] bg-[#151A4D]/90 px-4 py-2 text-sm font-bold text-[#B9C0E8] transition hover:border-[#FF6FB5]/80 hover:text-[#FF6FB5]'
      }
    >
      <LogOut size={16} />
      Logout
    </button>
  );
}