import { useState, useEffect } from 'react';

export default function EventModal({ isOpen, onClose, onSave, selectedDate, prefilledArtist }) {
  // כל השדות מהאפיון שלך
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [venue, setVenue] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [photographer, setPhotographer] = useState("");
  const [videoEditor, setVideoEditor] = useState("");

  // שדות בוליאניים (כן/לא)
  const [hasSongs, setHasSongs] = useState(false);
  const [songList, setSongList] = useState("");
  const [materialCollected, setMaterialCollected] = useState(false);
  const [hasAdvancePaid, setHasAdvancePaid] = useState(false);

  // מאגר עורכי וידאו קבועים
  const [editorsList] = useState([
    { id: '1', name: 'שרה עורכת' },
    { id: '2', name: 'מיכל עורכת' }
  ]);

  // טיפול בכפתור חזרה (Back) באנדרואיד לסגירת החלון בלבד
  useEffect(() => {
    const handlePopState = (e) => {
      if (isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  // תנאי העצירה יושב תמיד אחרי ال-useEffect!
  if (!isOpen) return null;

  // עיצוב התאריך שנבחר כדי להציג אותו בכותרת החלון
  const displayDate = selectedDate ? selectedDate.toLocaleDateString('he-IL') : "";

  const handleSaveClick = () => {
    // בדיקה בסיסית: לפחות שם חתן או כלה כדי לא לשמור אירוע ריק לחלוטין
    if (!groomName.trim() && !brideName.trim()) {
      alert("נא להזין לפחות שם חתן או כלה");
      return;
    }

    const eventData = {
      groomName,
      brideName,
      venue,
      phone1,
      phone2,
      photographer,
      videoEditor,
      hasSongs,
      songList: hasSongs ? songList : "", // שומר את השירים רק אם סומן "כן"
      materialCollected,
      hasAdvancePaid
    };

    onSave(eventData);

    // איפוס הטופס לפעם הבאה
    setGroomName(""); setBrideName(""); setVenue(""); setPhone1(""); setPhone2("");
    setPhotographer(""); setVideoEditor(""); setHasSongs(false); setSongList(""); setMaterialCollected(false);
    setHasAdvancePaid(false);
  }; // <--- כאן הפונקציה handleSaveClick נסגרת סוף סוף כמו שצריך!

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content event-modal" onClick={(e) => e.stopPropagation()}>
        <h3>סגירת אירוע - {displayDate}</h3>
        {prefilledArtist && (
          <div style={{ backgroundColor: '#f0f4f8', padding: '8px 12px', borderRadius: '6px', marginBottom: '10px', fontSize: '0.95rem', color: '#333' }}>
            🎥 מסריט ראשי: <strong>{prefilledArtist.name}</strong> ({prefilledArtist.role})
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>שם חתן:</label>
            <input type="text" value={groomName} onChange={e => setGroomName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>שם כלה:</label>
            <input type="text" value={brideName} onChange={e => setBrideName(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>אולם:</label>
          <input type="text" value={venue} onChange={e => setVenue(e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>טלפון 1:</label>
            <input type="text" value={phone1} onChange={e => setPhone1(e.target.value)} dir="ltr" />
          </div>
          <div className="form-group">
            <label>טלפון 2:</label>
            <input type="text" value={phone2} onChange={e => setPhone2(e.target.value)} dir="ltr" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>שם צלם תמונות:</label>
            <input type="text" value={photographer} onChange={e => setPhotographer(e.target.value)} />
          </div>
          <div className="form-group">
            <label>שם עורכת וידאו:</label>
            <select value={videoEditor} onChange={e => setVideoEditor(e.target.value)}>
              <option value="">בחר עורך/ת...</option>
              {editorsList.map(editor => (
                <option key={editor.id} value={editor.name}>
                  {editor.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input type="checkbox" checked={hasSongs} onChange={e => setHasSongs(e.target.checked)} />
            בחירת שירים?
          </label>
        </div>

        {/* שדה שירים שקופץ רק אם סומן "כן" */}
        {hasSongs && (
          <div className="form-group">
            <label>רשימת שירים:</label>
            <textarea
              value={songList}
              onChange={e => setSongList(e.target.value)}
              rows="3"
              placeholder="הקלד כאן את השירים..."
            />
          </div>
        )}

        {/* רובריקה חדשה: שולמה מקדמה? */}
        <div className="form-group checkbox-group">
          <label>
            <input type="checkbox" checked={hasAdvancePaid} onChange={e => setHasAdvancePaid(e.target.checked)} />
            שולמה מקדמה?
          </label>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input type="checkbox" checked={materialCollected} onChange={e => setMaterialCollected(e.target.checked)} />
            חומר נאסף?
          </label>
        </div>

        <div className="modal-actions">
          <button className="save-btn" onClick={handleSaveClick}>שמור אירוע</button>
          <button className="cancel-btn" onClick={onClose}>ביטול</button>
        </div>
      </div>
    </div>
  );
}