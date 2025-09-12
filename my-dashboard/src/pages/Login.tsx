import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import '../index.css';

const Login: React.FC = () => {
  const { login, token } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (token) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const ok = await login(username, password);
    setLoading(false);
    if (ok) navigate('/dashboard'); else setError('Ongeldige inloggegevens');
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-header">
          <img className="login-brand" src="/guuscode-logo-dark.png" alt="GuusCode" />
          <span className="login-sep" aria-hidden="true"></span>
          <div className="login-title">
            <h2>Inloggen</h2>
            <p className="login-sub">Toegang tot het dashboard</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <label>Gebruikersnaam
            <input value={username} onChange={e=>setUsername(e.target.value)} required placeholder="Gebruikersnaam" />
          </label>
          <label>Wachtwoord
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Wachtwoord" />
          </label>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>{loading ? 'Inloggen...' : 'Inloggen'}</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
