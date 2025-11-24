import { useState } from 'react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';

export function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [deviceCode, setDeviceCode] = useState<string>('');

  // Listen for device code
  window.auth.onDeviceCode((response) => {
    setDeviceCode(response.message);
  });

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 rounded-lg border border-border bg-card">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Bolt Launch Pad</h1>
          <p className="text-muted-foreground">
            Sign in with your Azure AD account to continue
          </p>
        </div>

        {deviceCode && (
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm font-mono whitespace-pre-wrap">{deviceCode}</p>
          </div>
        )}

        <Button 
          className="w-full" 
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign in with Azure AD'}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Note: Azure AD must be configured in settings before first use
        </p>
      </div>
    </div>
  );
}

