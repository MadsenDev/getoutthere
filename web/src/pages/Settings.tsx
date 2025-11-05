import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { exportAnonId, importAnonId } from '../lib/storage';
import { register, login, logout, getCurrentUser, UserInfo, exportUserData } from '../lib/api';

export default function Settings() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Account section
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Recovery section
  const [showRecoveryId, setShowRecoveryId] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importId, setImportId] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err) {
      // User not authenticated or error - that's okay
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      const data = await exportUserData();
      
      // Create a downloadable JSON file
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `getoutthere-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-serif text-gray-900 dark:text-gray-100 mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Manage your account and data.</p>

        {/* Account Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-6 transition-colors">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Account</h2>
          
          {loading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
          ) : user?.email ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.email}</p>
              </div>
              <button
                onClick={async () => {
                  sessionStorage.setItem('isRestoring', 'true');
                  await logout();
                  setUser(null);
                  window.location.reload();
                }}
                className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Create an account to secure your progress with email and password. 
                Your existing progress will be linked to your new account.
              </p>

              {/* Register */}
              {showRegister ? (
                <div className="space-y-3 border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Create Account</h3>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => {
                      setRegisterEmail(e.target.value);
                      setAuthError(null);
                    }}
                    placeholder="Email"
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <input
                    type="password"
                    value={registerPassword}
                    onChange={(e) => {
                      setRegisterPassword(e.target.value);
                      setAuthError(null);
                    }}
                    placeholder="Password (min 8 characters)"
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  {authError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{authError}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={async () => {
                        if (!registerEmail || !registerPassword) {
                          setAuthError('Email and password are required');
                          return;
                        }
                        try {
                          setAuthLoading(true);
                          setAuthError(null);
                          await register(registerEmail, registerPassword);
                          await loadUser();
                          setShowRegister(false);
                          setRegisterEmail('');
                          setRegisterPassword('');
                          sessionStorage.setItem('isRestoring', 'true');
                          window.location.reload();
                        } catch (err: any) {
                          setAuthError(err.message || 'Registration failed');
                        } finally {
                          setAuthLoading(false);
                        }
                      }}
                      disabled={authLoading || !registerEmail || !registerPassword}
                      className="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {authLoading ? 'Creating...' : 'Create Account'}
                    </button>
                    <button
                      onClick={() => {
                        setShowRegister(false);
                        setRegisterEmail('');
                        setRegisterPassword('');
                        setAuthError(null);
                      }}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : showLogin ? (
                <div className="space-y-3 border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Login</h3>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setAuthError(null);
                    }}
                    placeholder="Email"
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setAuthError(null);
                    }}
                    placeholder="Password"
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  {authError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{authError}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={async () => {
                        if (!loginEmail || !loginPassword) {
                          setAuthError('Email and password are required');
                          return;
                        }
                        try {
                          setAuthLoading(true);
                          setAuthError(null);
                          await login(loginEmail, loginPassword);
                          await loadUser();
                          setShowLogin(false);
                          setLoginEmail('');
                          setLoginPassword('');
                          sessionStorage.setItem('isRestoring', 'true');
                          window.location.reload();
                        } catch (err: any) {
                          setAuthError(err.message || 'Login failed');
                        } finally {
                          setAuthLoading(false);
                        }
                      }}
                      disabled={authLoading || !loginEmail || !loginPassword}
                      className="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {authLoading ? 'Logging in...' : 'Login'}
                    </button>
                    <button
                      onClick={() => {
                        setShowLogin(false);
                        setLoginEmail('');
                        setLoginPassword('');
                        setAuthError(null);
                      }}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowRegister(true);
                      setShowLogin(false);
                    }}
                    className="text-sm bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 transition-colors"
                  >
                    Create Account
                  </button>
                  <button
                    onClick={() => {
                      setShowLogin(true);
                      setShowRegister(false);
                    }}
                    className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Login
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress ID Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-6 transition-colors">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Progress Recovery</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Your progress is stored anonymously. Save your Progress ID to recover your data if you clear your browser storage.
          </p>

          {/* Export ID */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Your Progress ID</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Copy this ID and store it somewhere safe. You'll need it to restore your progress.
            </p>
            {showRecoveryId ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-gray-50 dark:bg-gray-700 px-4 py-3 rounded border border-gray-200 dark:border-gray-600 font-mono text-gray-900 dark:text-gray-100 flex-1 break-all">
                    {exportAnonId()}
                  </code>
                  <button
                    onClick={() => {
                      const id = exportAnonId();
                      if (id) {
                        navigator.clipboard.writeText(id);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }
                    }}
                    className="bg-primary text-white px-4 py-3 rounded hover:bg-opacity-90 transition-colors whitespace-nowrap"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <button
                  onClick={() => setShowRecoveryId(false)}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
                >
                  Hide ID
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowRecoveryId(true)}
                className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Show Progress ID
              </button>
            )}
          </div>

          {/* Import ID */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Restore Progress</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              If you've saved your Progress ID, paste it here to restore your data.
            </p>
            {showImport ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={importId}
                  onChange={(e) => {
                    setImportId(e.target.value);
                    setImportError(null);
                    setImportSuccess(false);
                  }}
                  placeholder="Paste your Progress ID here..."
                  className="w-full bg-gray-50 dark:bg-gray-700 px-4 py-3 rounded border border-gray-200 dark:border-gray-600 font-mono text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {importError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{importError}</p>
                )}
                {importSuccess && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ID restored! Refreshing to load your progress...
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      if (!importId.trim()) {
                        setImportError('Please enter an ID');
                        return;
                      }
                      try {
                        setImporting(true);
                        setImportError(null);
                        setImportSuccess(false);
                        await importAnonId(importId.trim());
                        setImportSuccess(true);
                        // Reload page after a moment to fetch new data
                        setTimeout(() => {
                          sessionStorage.setItem('isRestoring', 'true');
                          window.location.reload();
                        }, 1500);
                      } catch (err: any) {
                        setImportError(err.message || 'Invalid ID format');
                      } finally {
                        setImporting(false);
                      }
                    }}
                    disabled={importing || !importId.trim()}
                    className="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importing ? 'Restoring...' : 'Restore ID'}
                  </button>
                  <button
                    onClick={() => {
                      setShowImport(false);
                      setImportId('');
                      setImportError(null);
                      setImportSuccess(false);
                    }}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowImport(true)}
                className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Restore from ID
              </button>
            )}
          </div>
        </div>

        {/* Data Export */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-6 transition-colors">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Export Your Data</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Download a copy of your progress, streaks, and journal entries as JSON.
          </p>
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? 'Exporting...' : 'Export My Data'}
          </button>
        </div>

        {/* Support Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-6 transition-colors">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Support</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            If you're enjoying Get Out There, consider supporting the project.
          </p>
          <a
            href="https://buymeacoffee.com/madsendev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M8 21h8" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3v2M16 3v2" />
            </svg>
            <span>Buy Me A Coffee</span>
          </a>
        </div>

        {/* Storage Info */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-colors">
          <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">About Your Data</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Your progress is stored locally in your browser using multiple storage methods to prevent data loss. 
            Your anonymous ID is used to sync your data with the server. No personal information is collected or stored.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

