import { useState } from 'react';

// רשימת צבעים אלגנטית ומקצועית ללוח השנה
const PRESET_COLORS = [
  "#3f51b5", // כחול עמוק
  "#009688", // ירוק / טורקיז
  "#673ab7", // סגול
  "#ff9800", // כתום חם
  "#e91e63", // ורוד / אדמדם
  "#00bcd4", // תכלת עז
  "#795548", // חום עץ
  "#607d8b"  // אפור פחם
];

export default function AddArtistModal({ isOpen, onClose, onSave, existingArtist, artists = [], artistsCount = 0 }) {
  const [name, setName] = useState(existingArtist?.name || "");
  const [role, setRole] = useState(existingArtist?.role || "");
  const [phone, setPhone] = useState(existingArtist?.phone || "");
  const [customColor, setCustomColor] = useState(null);

  // סנכרון השדות בעת מעבר בין הוספה לעריכה (ללא useEffect כדי למנוע שגיאת Linter)
  const currentSessionKey = `${isOpen}-${existingArtist?.id || 'new'}`;
  const [prevSessionKey, setPrevSessionKey] = useState(currentSessionKey);

  if (currentSessionKey !== prevSessionKey) {
    setPrevSessionKey(currentSessionKey);
    setName(existingArtist?.name || "");
    setRole(existingArtist?.role || "");
    setPhone(existingArtist?.phone || "");
    setCustomColor(null);
  }

  if (!isOpen) return null;

  // פונקציה שמחשבת בזמן אמת את הצבע של האומן בעריכה או הצבע הפנוי הבא בהוספה
  const getNextAvailableColor = () => {
    if (existingArtist && existingArtist.color) {
      return existingArtist.color;
    }
    
    if (artists && artists.length > 0) {
      const usedColors = artists.map(a => a.color?.toLowerCase());
      const availableColor = PRESET_COLORS.find(c => !usedColors.includes(c.toLowerCase()));
      if (availableColor) return availableColor;
    }

    const count = artists.length || artistsCount;
    return PRESET_COLORS[count % PRESET_COLORS.length];
  };

  const activeColor = customColor || getNextAvailableColor();

  const handleSaveClick = () => {
    if (!name.trim()) return;
    
    onSave({
      ...(existingArtist ? existingArtist : {}),
      name: name.trim(), 
      role: role.trim(), 
      phone: phone.trim(), 
      color: activeColor,
      // אם זה אומן קיים נשמור על המיקום שלו, ואם הוא חדש ניתן לו את הזמן הנוכחי כדי שייכנס בסוף!
      createdAt: existingArtist ? (existingArtist.createdAt ?? 0) : Date.now()
    });
    
    setName("");
    setRole("");
    setPhone("");
    setCustomColor(null);
  };

  const handleClose = () => {
    setCustomColor(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{existingArtist ? "עריכת אומן" : "הוספת אומן חדש"}</h3>
        
        <div className="form-group">
          <label>שם האומן:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: אבי כהן" />
        </div>
        
        <div className="form-group">
          <label>תפקיד:</label>
          <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="לדוגמה: צלם וידאו" />
        </div>
        
        <div className="form-group">
          <label>טלפון נייד (לשליחת פרטי אירוע בוואטסאפ):</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-1234567" dir="ltr" />
        </div>
        
        <div className="form-group">
          <label>צבע בלוח השנה:</label>
          <input type="color" className="color-picker" value={activeColor} onChange={(e) => setCustomColor(e.target.value)} />
        </div>
        
        <div className="modal-actions">
          <button className="save-btn" onClick={handleSaveClick}>שמור אומן</button>
          <button className="cancel-btn" onClick={handleClose}>ביטול</button>
        </div>
      </div>
    </div>
  );
}