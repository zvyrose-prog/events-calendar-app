import { useState } from 'react';

export default function LoginModal({ onLoginSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    // כאן אפשר לקבוע את סיסמת המנהל שלך
    if (password === "3579") {
      onLoginSuccess();
    } else {
      setError(true);
      setPassword("");
    }
  };

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(5px)' }}>
      <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <h3>🔐 כניסת מנהל מערכת</h3>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>
          הקש סיסמה כדי לנהל את יומן האירועים
        </p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <input 
              type="password" 
              value={password} 
              onChange={(e) => { setPassword(e.target.value); setError(false); }} 
              placeholder="הקש סיסמה..." 
              style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px' }}
              autoFocus
            />
          </div>

          {error && (
            <p style={{ color: '#f44336', fontSize: '0.85rem', marginBottom: '15px' }}>
              סיסמה שגויה, נסה שוב.
            </p>
          )}

          <button className="save-btn" type="submit" style={{ width: '100%', padding: '10px' }}>
            היכנס למערכת
          </button>
        </form>
      </div>
    </div>
  );
}