import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export function SettingsView() {
  const [env, setEnv] = useState<'dev' | 'prod'>('dev');
  const [mysqlConnected, setMysqlConnected] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const envSetting = await window.database.getSetting('mysql_env');
      if (envSetting) {
        setEnv(envSetting.value as 'dev' | 'prod');
      }
      const connected = await window.mysql.isConnected();
      setMysqlConnected(connected);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await window.mysql.testConnection();
      if (result) {
        toast.success('MySQL connection successful');
        setMysqlConnected(true);
      } else {
        toast.error('MySQL connection failed');
        setMysqlConnected(false);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error('Connection test failed');
    }
  };

  const handleSwitchEnv = async (newEnv: 'dev' | 'prod') => {
    try {
      await window.mysql.switchEnvironment(newEnv);
      setEnv(newEnv);
      await window.database.setSetting('mysql_env', newEnv);
      toast.success(`Switched to ${newEnv} environment`);
      loadSettings();
    } catch (error) {
      console.error('Failed to switch environment:', error);
      toast.error('Failed to switch environment. Please configure connection details first.');
    }
  };

  const handleManualSync = async () => {
    try {
      toast.info('Starting manual sync...');
      const result = await window.sync.manual();
      if (result?.success) {
        toast.success(`Sync completed: ${result.itemsSynced} items synced`);
      } else {
        toast.warning(`Sync completed with ${result?.errors?.length || 0} errors`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Sync failed');
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h2 className="text-3xl font-bold">Settings</h2>

        {/* MySQL Configuration */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">MySQL Connection</h3>
          <div className="p-4 rounded-lg border border-border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Connection Status</p>
                <p className="text-sm text-muted-foreground">
                  {mysqlConnected ? 'Connected' : 'Not connected'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${mysqlConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleTestConnection} variant="outline">
                Test Connection
              </Button>
              <Button onClick={() => toast.info('Connection configuration dialog - coming soon')} variant="outline">
                Configure Connection
              </Button>
            </div>
          </div>
        </section>

        {/* Environment Selection */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">Environment</h3>
          <div className="p-4 rounded-lg border border-border bg-card space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={() => handleSwitchEnv('dev')}
                variant={env === 'dev' ? 'default' : 'outline'}
              >
                Development
              </Button>
              <Button
                onClick={() => handleSwitchEnv('prod')}
                variant={env === 'prod' ? 'default' : 'outline'}
              >
                Production
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Current environment: <span className="font-medium">{env}</span>
            </p>
          </div>
        </section>

        {/* Sync Configuration */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">Synchronization</h3>
          <div className="p-4 rounded-lg border border-border bg-card space-y-4">
            <p className="text-sm text-muted-foreground">
              Sync team-level items with the MySQL database
            </p>
            <Button onClick={handleManualSync}>
              Manual Sync Now
            </Button>
          </div>
        </section>

        {/* Azure AD Configuration */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">Azure AD Authentication</h3>
          <div className="p-4 rounded-lg border border-border bg-card space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure Azure AD for team authentication
            </p>
            <Button onClick={() => toast.info('Azure AD configuration dialog - coming soon')} variant="outline">
              Configure Azure AD
            </Button>
          </div>
        </section>

        {/* Database Info */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">Database Information</h3>
          <div className="p-4 rounded-lg border border-border bg-card space-y-2">
            <Button 
              onClick={async () => {
                const path = await window.database.getDatabasePath();
                toast.info(`Database location: ${path}`);
              }}
              variant="outline"
              size="sm"
            >
              Show Database Location
            </Button>
            <Button 
              onClick={async () => {
                const stats = await window.database.getStats();
                toast.info(`Stats: ${JSON.stringify(stats)}`);
              }}
              variant="outline"
              size="sm"
            >
              Show Statistics
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

