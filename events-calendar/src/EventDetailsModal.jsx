import { useEffect } from 'react';

export default function EventDetailsModal({ isOpen, onClose, event, artist, onEdit, onDelete }) {


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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content event-modal" onClick={(e) => e.stopPropagation()}>
        <h3>פרטי אירוע - {artist.name} ({artist.role})</h3>

        <div style={{ margin: '15px 0', lineHeight: '1.8', fontSize: '1.05rem' }}>
          <p><strong>📅 תאריך:</strong> {event.dateString}</p>
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

        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <div>
            <button
              className="save-btn"
              style={{ backgroundColor: '#2196F3', marginRight: '8px' }}
              onClick={onEdit}
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