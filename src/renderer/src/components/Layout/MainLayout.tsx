import { useState } from 'react';
import { Bookmark, Terminal, FileCode, Settings, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ViewType } from '../../types';
import { ThemeToggle } from '../ThemeToggle';
import { Button } from '../ui/button';

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function MainLayout({ children, currentView, onViewChange }: MainLayoutProps) {
  const { userEmail, logout } = useAuth();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await window.sync.manual();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { id: 'scripts' as ViewType, icon: FileCode, label: 'Scripts' },
    { id: 'executables' as ViewType, icon: Terminal, label: 'Executables' },
    { id: 'bookmarks' as ViewType, icon: Bookmark, label: 'Bookmarks' },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">BOLT Launch Pad</h1>
          <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer
                  ${isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-start"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-start"
            onClick={() => onViewChange('settings')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

