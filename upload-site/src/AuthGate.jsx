import { useState } from 'react';

function AuthGate({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem('voting-auth') === 'true'
  );
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Password from environment variable
  const CORRECT_PASSWORD = import.meta.env.VITE_UPLOAD_PASSWORD || 'DefaultPassword123';

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem('voting-auth', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  if (isAuthenticated) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-green-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-3xl p-10 border-4 border-red-400 shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Access Restricted
          </h1>
          <p className="text-gray-300">
            Enter password to access voting system
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white text-lg font-semibold mb-3">
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter access password"
              className="w-full bg-white/20 backdrop-blur-sm border-2 border-purple-400 rounded-xl px-6 py-4 text-white text-lg placeholder-gray-300 focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-400/50 transition-all"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border-2 border-red-400 rounded-xl p-4 text-red-300 text-center">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 text-white text-xl font-bold py-5 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition-all duration-300"
          >
            Unlock Access →
          </button>
        </form>

        <div className="mt-6 text-center text-gray-400 text-sm">
          🔐 Authorized personnel only
        </div>
      </div>
    </div>
  );
}

export default AuthGate;