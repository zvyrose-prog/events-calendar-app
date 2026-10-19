import { useState } from 'react';

export default function AddArtistModal({ isOpen, onClose, onSave }) {
  // המשתנים חיים עכשיו בתוך החלון עצמו
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [color, setColor] = useState("#FF9800");

  if (!isOpen) return null;

  const handleSaveClick = () => {
    if (!name.trim()) return; // מונע שמירה של שם ריק
    
    // שולח את הנתונים המאוגדים חזרה לקובץ הראשי (App.jsx)
    onSave({ name, role, phone, password, color });
    
    // מאפס את השדות לפעם הבאה שתפתח את החלון
    setName("");
    setRole("");
    setPhone("");
    setPassword("");
    setColor("#FF9800");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <h3>הוספת אומן חדש</h3>
        <div className="form-group">
          <label>שם האומן:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: אבי כהן" />
        </div>
        <div className="form-group">
          <label>תפקיד:</label>
          <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="לדוגמה: צלם וידאו" />
        </div>
        <div className="form-group">
          <label>טלפון נייד (לכניסה):</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-1234567" dir="ltr" />
        </div>
        <div className="form-group">
          <label>סיסמה התחלתית:</label>
          <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="לדוגמה: 1234" dir="ltr" />
        </div>
        <div className="form-group">
          <label>צבע בלוח השנה:</label>
          <input type="color" className="color-picker" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button className="save-btn" onClick={handleSaveClick}>שמור אומן</button>
          <button className="cancel-btn" onClick={onClose}>ביטול</button>
        </div>
      </div>
    </div>
  );
}