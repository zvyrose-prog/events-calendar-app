import { useState, useEffect } from 'react';

export default function EventModal({ isOpen, onClose, onSave, selectedDate, prefilledArtist, existingEvent, artists }) {

  // אתחול השדות מתוך existingEvent (אם קיים) או ריקים (אם חדש)
  const [groomName, setGroomName] = useState(existingEvent?.groomName || "");
  const [brideName, setBrideName] = useState(existingEvent?.brideName || "");
  const [venue, setVenue] = useState(existingEvent?.venue || "");
  const [phone1, setPhone1] = useState(existingEvent?.phone1 || "");
  const [phone2, setPhone2] = useState(existingEvent?.phone2 || "");
  const [photographer, setPhotographer] = useState(existingEvent?.photographer || "");
  const [videoEditor, setVideoEditor] = useState(existingEvent?.videoEditor || "");

  // שדות בוליאניים (כן/לא)
  const [hasSongs, setHasSongs] = useState(existingEvent?.hasSongs || false);
  const [songList, setSongList] = useState(existingEvent?.songList || "");
  const [materialCollected, setMaterialCollected] = useState(existingEvent?.materialCollected || false);
  const [hasAdvancePaid, setHasAdvancePaid] = useState(existingEvent?.hasAdvancePaid || false);
  const [isTentative, setIsTentative] = useState(existingEvent?.isTentative || false);

  // בחירת אומן
  const [selectedArtistId, setSelectedArtistId] = useState(
    existingEvent?.artistId || prefilledArtist?.id || (artists && artists[0]?.id) || ""
  );

  // מאגר עורכי וידאו קבועים (נשמר כמו שהיה!)
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
      hasAdvancePaid,
      artistId: selectedArtistId, // <--- תוסיף את השורה הזו כאן!
      isTentative
    };

    onSave(eventData);

    // איפוס הטופס לפעם הבאה
    setGroomName(""); setBrideName(""); setVenue(""); setPhone1(""); setPhone2("");
    setPhotographer(""); setVideoEditor(""); setHasSongs(false); setSongList(""); setMaterialCollected(false);
    setHasAdvancePaid(false);
    setIsTentative(false); // יחד עם שאר האיפוסים של השדות
  }; // <--- כאן הפונקציה handleSaveClick נסגרת סוף סוף כמו שצריך!

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content event-modal" onClick={(e) => e.stopPropagation()}>

        <h3>{existingEvent ? "עריכת אירוע" : "סגירת אירוע"} - {displayDate}</h3>

        {/* בחירת אומן / איש צוות דינמית */}
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>אומן / איש צוות:</label>
          <select
            value={selectedArtistId}
            onChange={(e) => setSelectedArtistId(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
          >
            {artists && artists.map((art) => (
              <option key={art.id} value={art.id}>
                {art.name} ({art.role})
              </option>
            ))}
          </select>
        </div>

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

        {/* רובריקה לסימן שאלה בעיצוב תואם לשאר השורות */}
        <div className="form-group checkbox-group">
          <label style={{ cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={isTentative} 
              onChange={e => setIsTentative(e.target.checked)} 
            />
            סימן שאלה ❓
          </label>
        </div>

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