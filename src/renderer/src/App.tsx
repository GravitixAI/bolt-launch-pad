import { useState } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginScreen } from './components/Auth/LoginScreen';
import { MainLayout } from './components/Layout/MainLayout';
import { BookmarksView } from './views/BookmarksView';
import { ExecutablesView } from './views/ExecutablesView';
import { ScriptsView } from './views/ScriptsView';
import { SettingsView } from './views/SettingsView';
import { ViewType } from './types';
import { Toaster } from 'sonner';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('bookmarks');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Temporarily bypass auth for local testing
  // TODO: Uncomment this when Azure AD is configured
  // if (!isAuthenticated) {
  //   return <LoginScreen />;
  // }

  const renderView = () => {
    switch (currentView) {
      case 'bookmarks':
        return <BookmarksView />;
      case 'executables':
        return <ExecutablesView />;
      case 'scripts':
        return <ScriptsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <BookmarksView />;
    }
  };

  return (
    <MainLayout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </MainLayout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
      <AuthProvider>
        <AppContent />
        <Toaster position="bottom-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
