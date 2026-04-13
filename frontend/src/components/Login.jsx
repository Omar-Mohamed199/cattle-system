import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(username, password)) {
      navigate('/');
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--primary-color)' }}>تسجيل الدخول</h2>
        {error && <div style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>اسم المستخدم</label>
            <div style={{position: 'relative'}}>
              <User size={20} style={{position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)'}} />
              <input 
                type="text" 
                className="input-control" 
                style={{paddingRight: '2.5rem', width: '100%'}} 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                required autoFocus
              />
            </div>
          </div>
          
          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label>كلمة المرور</label>
            <div style={{position: 'relative'}}>
              <Lock size={20} style={{position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)'}} />
              <input 
                type="password" 
                className="input-control" 
                style={{paddingRight: '2.5rem', width: '100%'}} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>دخول</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
