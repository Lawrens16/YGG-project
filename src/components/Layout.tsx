import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Home, User, Award, LogOut, Calendar, Shield, Users, Search, X, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef } from 'react';
import { searchUsers } from '@/lib/api';
import type { UserProfile } from '@/types';
import { InstallPrompt } from './InstallPrompt';
import { OfflineIndicator } from './OfflineIndicator';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, disconnect } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Handle search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsers(searchQuery, 5);
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserSelect = (userId: string) => {
    setSearchQuery('');
    setShowResults(false);
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <OfflineIndicator />
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0 group">
              <div className="relative">
                <img 
                  src="/spotme.svg" 
                  alt="SpotMe" 
                  className="w-8 h-8 transition-transform duration-200 group-hover:scale-110"
                />
              </div>
              <span className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">SpotMe</span>
            </Link>
            
            {/* Search Bar */}
            <div ref={searchRef} className="hidden md:flex flex-1 max-w-md relative">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setShowResults(true)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowResults(false);
                      inputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                  {isSearching ? (
                    <div className="p-4 text-center text-muted-foreground">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-1">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleUserSelect(result.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
                        >
                          <Avatar
                            src={result.avatar_url || undefined}
                            alt={result.display_name || 'User'}
                            className="h-10 w-10"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">
                              {result.display_name || 'Anonymous User'}
                            </div>
                            {result.school_name && (
                              <div className="text-sm text-muted-foreground truncate">
                                {result.school_name}
                                {result.course_name && ` • ${result.course_name}`}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">No users found</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4 flex-shrink-0">
              <Button variant="ghost" size="icon" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
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
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border shadow-soft lg:hidden z-50">
        <div className="grid grid-cols-5 gap-1 p-1">
          <NavLink to="/feed" icon={Home} label="Feed" isActive={isActive('/feed')} />
          <NavLink to="/events" icon={Calendar} label="Events" isActive={isActive('/events') || location.pathname.startsWith('/events/')} />
          <NavLink
            to={user ? `/profile/${user.id}` : "/"}
            icon={User}
            label={user ? "Profile" : "Home"}
            isActive={user ? location.pathname.startsWith('/profile') : isActive('/')}
          />
          {user?.is_organizer && (
            <NavLink to="/organizer" icon={Users} label="Organizer" isActive={isActive('/organizer')} />
          )}
          {user?.is_admin && (
            <NavLink to="/admin" icon={Shield} label="Admin" isActive={isActive('/admin')} />
          )}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 bg-card/95 backdrop-blur-lg border-r border-border shadow-soft">
        <div className="p-4 space-y-1">
          <NavLink to="/feed" icon={Home} label="Feed" isActive={isActive('/feed')} />
          <NavLink to="/events" icon={Calendar} label="Events" isActive={isActive('/events') || location.pathname.startsWith('/events/')} />
          {user?.is_organizer && (
            <NavLink to="/organizer" icon={Users} label="Organizer Dashboard" isActive={isActive('/organizer')} />
          )}
          {user?.is_admin && (
            <NavLink to="/admin" icon={Shield} label="Admin Panel" isActive={isActive('/admin')} />
          )}
          <NavLink to="/milestones" icon={Award} label="Milestones" isActive={isActive('/milestones')} />
        </div>
      </aside>

      <main className="lg:ml-64 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>
      <InstallPrompt />
    </div>
  );
}

function NavLink({ to, icon: Icon, label, isActive }: { to: string; icon: any; label: string; isActive: boolean }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center py-3 px-4 space-y-1 rounded-xl transition-all duration-200 ${
        isActive
          ? 'text-primary bg-primary/10 shadow-sm dark:bg-primary/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      }`}
    >
      <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'text-primary scale-110' : 'group-hover:scale-105'}`} />
      <span className={`text-xs font-semibold ${isActive ? 'text-primary' : ''}`}>{label}</span>
    </Link>
  );
}

