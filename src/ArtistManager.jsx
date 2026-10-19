export default function ArtistManager({ isOpen, onClose, artists, onDelete }) {
  // אם החלון לא אמור להיות פתוח, אל תרנדר (תצייר) שום דבר
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>מאגר אומנים רשומים</h3>
        <div className="artists-list">
          {artists.length === 0 ? <p style={{textAlign:'center'}}>אין אומנים במאגר</p> : null}
          {artists.map(artist => (
            <div key={artist.id} className="artist-list-item">
              <div className="artist-info">
                <span className="artist-color-dot" style={{ backgroundColor: artist.color }}></span>
                <strong>{artist.name}</strong> ({artist.role}) <br/>
                <small style={{color: '#666', fontSize: '0.8rem'}}>
                  📞 {artist.phone || 'לא הוזן'} | 🔑 {artist.password || 'לא הוזן'}
                </small>
              </div>
              <button className="delete-artist-btn" onClick={() => onDelete(artist.id)}>
                🗑️ מחיקה
              </button>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="cancel-btn" style={{width: '100%'}} onClick={onClose}>
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}