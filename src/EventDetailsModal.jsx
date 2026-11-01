import { useEffect } from 'react';

export default function EventDetailsModal({ isOpen, onClose, event, artist, onEdit, onDelete, artists = [] }) {

  // הוספת מאזין לכפתור ה-Back של אנדרואיד
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

  if (!isOpen || !event || !artist) return null;

  // פונקציית עזר להמרת מספר יום בחודש העברי לאותיות (א' עד ל')
  const toHebrewDayLetters = (num) => {
    const letters = [
      '', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י',
      'יא', 'יב', 'יג', 'יד', 'טו', 'טז', 'יז', 'יח', 'יט', 'כ',
      'כא', 'כב', 'כג', 'כד', 'כה', 'כו', 'כז', 'כח', 'כט', 'ל'
    ];
    return letters[num] || String(num);
  };

  // פונקציה שמחזירה תאריך משולב: יום בשבוע + תאריך עברי + תאריך לועזי
  const formatFullEventDate = (dateStr) => {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr || "";

    const dayG = String(dateObj.getDate()).padStart(2, '0');
    const monthG = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yearG = dateObj.getFullYear();
    const gregorianFormatted = `${dayG}/${monthG}/${yearG}`;

    try {
      const weekday = dateObj.toLocaleDateString('he-IL', { weekday: 'long' });
      const parts = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
        day: 'numeric',
        month: 'long'
      }).formatToParts(dateObj);

      const dayNum = parseInt(parts.find(p => p.type === 'day')?.value, 10);
      const monthName = parts.find(p => p.type === 'month')?.value || '';
      const hebrewDay = toHebrewDayLetters(dayNum);

      return `${weekday}, ${hebrewDay} ב${monthName} (${gregorianFormatted})`;
    } catch {
      return gregorianFormatted;
    }
  };

  const formattedDateDisplay = formatFullEventDate(event.dateString);

  // שליחת הודעת וואטסאפ לאומן של האירוע (ללא אימוג'ים שמתפרקים לסימני שאלה)
  const handleSendWhatsAppToArtist = () => {
    const fullArtist = artists.find(a => String(a.id) === String(event.artistId) || a.name === artist.name);
    const artistPhone = fullArtist?.phone || artist?.phone || "";
    
    const digitsOnly = artistPhone.replace(/\D/g, '');
    if (!digitsOnly) {
      alert("לא הוזן מספר טלפון עבור אומן זה במערכת.");
      return;
    }

    const formattedPhone = digitsOnly.startsWith('0')
      ? '972' + digitsOnly.slice(1)
      : digitsOnly;

    const coupleNames = [event.groomName, event.brideName].filter(Boolean).join(" ו");
    const venueName = event.venue || "לא צוין אולם";

    const lines = [
      `שלום ${artist.name}, פרטי אירוע:`,
      `*תאריך:* ${formattedDateDisplay}`,
      `*זוג:* ${coupleNames}`,
      `*אולם:* ${venueName}`
    ];
    const messageText = lines.join('\n');

    // שימוש ב-api.whatsapp.com שומר על קידוד עברית ותווים מיוחדים בצורה תקינה
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(messageText)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content event-modal" onClick={(e) => e.stopPropagation()}>
        <h3>פרטי אירוע - {artist.name} ({artist.role})</h3>

        <div style={{ margin: '15px 0', lineHeight: '1.8', fontSize: '1.05rem' }}>
          <p><strong>📅 תאריך:</strong> {formattedDateDisplay}</p>
          <p><strong>💍 חתן וכלה:</strong> {event.groomName} & {event.brideName}</p>
          <p><strong>📍 אולם:</strong> {event.venue || 'לא הוזן'}</p>
          <p><strong>📞 טלפונים:</strong> {event.phone1 || '-'} {event.phone2 ? `/ ${event.phone2}` : ''}</p>
          <p><strong>📸 צלם תמונות:</strong> {event.photographer || 'לא הוזן'}</p>
          <p><strong>🎬 עורכת וידאו:</strong> {event.videoEditor || 'לא הוזן'}</p>
          <p><strong>💰 שולמה מקדמה:</strong> {event.hasAdvancePaid ? 'כן ✅' : 'לא ❌'}</p>
          <p><strong>📦 חומר נאסף:</strong> {event.materialCollected ? 'כן ✅' : 'לא ❌'}</p>
          {event.hasSongs && (
            <p><strong>🎵 רשימת שירים:</strong><br /> <span style={{ whiteSpace: 'pre-wrap' }}>{event.songList}</span></p>
          )}
        </div>

        {/* כפתור שליחת וואטסאפ לאומן */}
        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={handleSendWhatsAppToArtist}
            style={{
              width: '100%',
              backgroundColor: '#25D366',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            💬 שלח פרטי אירוע לאומן בוואטסאפ
          </button>
        </div>

        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          <div>
            <button
              className="save-btn"
              style={{ backgroundColor: '#2196F3', marginLeft: '10px' }}
              onClick={() => onEdit(event)}
            >
              ✏️ עריכה
            </button>
            <button
              className="cancel-btn"
              style={{ backgroundColor: '#f44336', color: 'white' }}
              onClick={() => {
                if (window.confirm("בטוח שאתה מעוניין למחוק את האירוע?")) {
                  onDelete(event.id);
                  onClose();
                }
              }}
            >
              🗑️ מחיקה
            </button>
          </div>
          <button className="cancel-btn" onClick={onClose}>סגור</button>
        </div>
      </div>
    </div>
  );
}