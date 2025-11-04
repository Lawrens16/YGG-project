import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Home, PlusCircle, User, Award, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, disconnect } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/feed" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">Achievement Wallet</span>
            </Link>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link to={`/profile/${user.id}`}>
                    <Avatar src={user.avatar_url || undefined} alt={user.display_name || 'User'} />
                  </Link>
                  <Button variant="ghost" size="icon" onClick={disconnect}>
                    <LogOut className="w-5 h-5" />
                  </Button>
                </>
              ) : (
                <Link to="/">
                  <Button variant="secondary">Get Started</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50">
        <div className="grid grid-cols-6 gap-1">
          <NavLink to="/feed" icon={Home} label="Feed" isActive={isActive('/feed')} />
          <NavLink to="/upload" icon={PlusCircle} label="Upload" isActive={isActive('/upload')} />
          <NavLink to="/verify" icon={Settings} label="Verify" isActive={isActive('/verify')} />
          <NavLink to="/rewards" icon={Award} label="Rewards" isActive={isActive('/rewards')} />
          <NavLink
            to={user ? `/profile/${user.id}` : "/"}
            icon={User}
            label={user ? "Profile" : "Home"}
            isActive={user ? location.pathname.startsWith('/profile') : isActive('/')}
          />
          <NavLink to="/settings" icon={Settings} label="Settings" isActive={isActive('/settings')} />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200">
        <div className="p-4 space-y-2">
          <NavLink to="/feed" icon={Home} label="Feed" isActive={isActive('/feed')} />
          <NavLink to="/upload" icon={PlusCircle} label="Upload Achievement" isActive={isActive('/upload')} />
          <NavLink to="/verify" icon={Settings} label="Verify Achievements" isActive={isActive('/verify')} />
          <NavLink to="/rewards" icon={Award} label="Rewards & Points" isActive={isActive('/rewards')} />
          <NavLink to="/settings" icon={Settings} label="Settings" isActive={isActive('/settings')} />
        </div>
      </aside>

      <main className="lg:ml-64 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavLink({ to, icon: Icon, label, isActive }: { to: string; icon: any; label: string; isActive: boolean }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center py-3 px-4 space-y-1 transition-colors ${
        isActive
          ? 'text-blue-600 bg-blue-50'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}

