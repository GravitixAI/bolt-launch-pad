import { PublicClientApplication, AccountInfo, AuthenticationResult } from '@azure/msal-node';
import { BrowserWindow } from 'electron';
import { dbOperations } from './db-operations';

// MSAL Configuration
interface AzureADConfig {
  clientId: string;
  authority: string;
  redirectUri: string;
}

let msalInstance: PublicClientApplication | null = null;
let currentAccount: AccountInfo | null = null;

/**
 * Initialize Azure AD authentication
 * This should be called with the config provided by the user
 */
export async function initializeAuth(config: AzureADConfig): Promise<void> {
  try {
    msalInstance = new PublicClientApplication({
      auth: {
        clientId: config.clientId,
        authority: config.authority,
        redirectUri: config.redirectUri,
      },
      cache: {
        cacheLocation: 'fileCache', // Use file-based cache for Electron
      },
    });

    // Save config to settings
    dbOperations.setSetting('azure_client_id', config.clientId);
    dbOperations.setSetting('azure_authority', config.authority);
    dbOperations.setSetting('azure_redirect_uri', config.redirectUri);

    console.log('✅ Azure AD authentication initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Azure AD:', error);
    throw error;
  }
}

/**
 * Get Azure AD config from settings
 */
export function getAuthConfigFromSettings(): AzureADConfig | null {
  try {
    const clientId = dbOperations.getSetting('azure_client_id');
    const authority = dbOperations.getSetting('azure_authority');
    const redirectUri = dbOperations.getSetting('azure_redirect_uri');

    if (!clientId || !authority || !redirectUri) {
      return null;
    }

    return {
      clientId: clientId.value,
      authority: authority.value,
      redirectUri: redirectUri.value,
    };
  } catch (error) {
    console.error('Error getting auth config:', error);
    return null;
  }
}

/**
 * Login with Azure AD - Interactive flow
 */
export async function login(mainWindow: BrowserWindow): Promise<AuthenticationResult> {
  if (!msalInstance) {
    throw new Error('Auth not initialized. Please configure Azure AD first.');
  }

  try {
    const scopes = ['user.read', 'openid', 'profile', 'email'];

    // Use device code flow for Electron (more reliable than interactive flow)
    const response = await msalInstance.acquireTokenByDeviceCode({
      deviceCodeCallback: (response) => {
        console.log('Device code:', response.message);
        // Send device code to renderer for display
        mainWindow.webContents.send('auth:device-code', response);
      },
      scopes,
    });

    currentAccount = response.account;
    
    // Store tokens securely
    dbOperations.setSetting('azure_access_token', response.accessToken);
    dbOperations.setSetting('current_user_email', response.account?.username || '');
    
    console.log('✅ Login successful:', response.account?.username);
    return response;
  } catch (error) {
    console.error('❌ Login failed:', error);
    throw error;
  }
}

/**
 * Login silently (refresh token)
 */
export async function loginSilent(): Promise<AuthenticationResult | null> {
  if (!msalInstance) {
    return null;
  }

  try {
    const accounts = await msalInstance.getAllAccounts();
    
    if (accounts.length === 0) {
      return null;
    }

    const account = accounts[0];
    const scopes = ['user.read'];

    const response = await msalInstance.acquireTokenSilent({
      account,
      scopes,
    });

    currentAccount = response.account;
    dbOperations.setSetting('azure_access_token', response.accessToken);
    
    return response;
  } catch (error) {
    console.error('Silent login failed:', error);
    return null;
  }
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  if (!msalInstance || !currentAccount) {
    return;
  }

  try {
    await msalInstance.getTokenCache().removeAccount(currentAccount);
    currentAccount = null;
    
    // Clear stored tokens
    dbOperations.deleteSetting('azure_access_token');
    dbOperations.deleteSetting('current_user_email');
    
    console.log('✅ Logout successful');
  } catch (error) {
    console.error('❌ Logout failed:', error);
    throw error;
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): AccountInfo | null {
  return currentAccount;
}

/**
 * Get current user email
 */
export function getCurrentUserEmail(): string | null {
  const setting = dbOperations.getSetting('current_user_email');
  return setting?.value || currentAccount?.username || null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return currentAccount !== null || dbOperations.getSetting('azure_access_token') !== undefined;
}

/**
 * Get access token
 */
export function getAccessToken(): string | null {
  const setting = dbOperations.getSetting('azure_access_token');
  return setting?.value || null;
}

/**
 * Initialize from stored session
 */
export async function restoreSession(): Promise<boolean> {
  try {
    const config = getAuthConfigFromSettings();
    if (!config) {
      return false;
    }

    await initializeAuth(config);
    
    const result = await loginSilent();
    return result !== null;
  } catch (error) {
    console.error('Failed to restore session:', error);
    return false;
  }
}

