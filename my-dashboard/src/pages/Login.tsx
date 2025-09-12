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
    <div className="info-section" style={{ background: 'transparent' }}>
      <form className="modal-content" onSubmit={handleSubmit} style={{ maxWidth: 420 }}>
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>Inloggen</h2>
        <label>Gebruikersnaam
          <input value={username} onChange={e=>setUsername(e.target.value)} required />
        </label>
        <label>Wachtwoord
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </label>
        {error && <div style={{ color: '#d32f2f', marginBottom: 10 }}>{error}</div>}
        <div style={{ display:'flex', gap: 8, justifyContent:'flex-end' }}>
          <button type="submit" className="btn primary" disabled={loading}>{loading ? 'Inloggen...' : 'Inloggen'}</button>
        </div>
      </form>
    </div>
  );
};

export default Login;
