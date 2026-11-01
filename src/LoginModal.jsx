import { useState } from 'react';
import { registerCustomer, loginCustomer } from './firebaseService';

export default function LoginModal() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (isRegistering) {
        if (!email || !phone || !password) {
          setErrorMsg("נא למלא מייל, טלפון וסיסמה.");
          setLoading(false);
          return;
        }
        await registerCustomer(email, phone, password);
      } else {
        await loginCustomer(email, password);
      }
      // ברגע שההתחברות מצליחה, App.jsx מזהה אוטומטית את המשתמש ופותח את היומן!
    } catch (err) {
      console.error("שגיאת התחברות:", err);
      if (err.code === "auth/email-already-in-use") {
        setErrorMsg("כתובת המייל הזו כבר רשומה במערכת.");
      } else if (err.code === "auth/weak-password") {
        setErrorMsg("הסיסמה חייבת להכיל לפחות 6 תווים.");
      } else if (err.code === "auth/invalid-email") {
        setErrorMsg("כתובת המייל אינה תקינה.");
      } else {
        setErrorMsg("פרטי ההתחברות שגויים או שהמשתמש אינו קיים.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(5px)' }}>
      <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <h3>{isRegistering ? "📝 הרשמת לקוח חדש" : "🔐 כניסה ליומן האישי"}</h3>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>
          {isRegistering 
            ? "הגדר מייל, טלפון וסיסמה אישית. גיבוי יישלח למייל בכל יום חמישי ב-20:00" 
            : "הזן את המייל והסיסמה האישית שלך כדי להיכנס ליומן"}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => { setEmail(e.target.value); setErrorMsg(""); }} 
              placeholder="אימייל (לקבלת גיבוי שבועי)..." 
              dir="ltr"
              style={{ textAlign: 'center', fontSize: '1rem', width: '100%', padding: '10px', boxSizing: 'border-box' }}
              required
              autoFocus
            />
          </div>

          {isRegistering && (
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => { setPhone(e.target.value); setErrorMsg(""); }} 
                placeholder="טלפון נייד..." 
                dir="ltr"
                style={{ textAlign: 'center', fontSize: '1rem', width: '100%', padding: '10px', boxSizing: 'border-box' }}
                required
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => { setPassword(e.target.value); setErrorMsg(""); }} 
              placeholder="סיסמה (לפחות 6 תווים)..." 
              dir="ltr"
              style={{ textAlign: 'center', fontSize: '1.1rem', letterSpacing: '2px', width: '100%', padding: '10px', boxSizing: 'border-box' }}
              required
            />
          </div>

          {errorMsg && (
            <p style={{ color: '#f44336', fontSize: '0.85rem', marginBottom: '15px', fontWeight: 'bold' }}>
              {errorMsg}
            </p>
          )}

          <button 
            className="save-btn" 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          >
            {loading ? "מתחבר..." : isRegistering ? "צור יומן אישי והיכנס" : "היכנס למערכת"}
          </button>

          <button 
            type="button" 
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorMsg("");
            }}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#3f51b5', 
              cursor: 'pointer', 
              fontSize: '0.9rem',
              textDecoration: 'underline',
              marginTop: '5px'
            }}
          >
            {isRegistering ? "כבר יש לך חשבון? לחץ להתחברות" : "לקוח חדש? לחץ כאן להרשמה"}
          </button>
        </form>
      </div>
    </div>
  );
}