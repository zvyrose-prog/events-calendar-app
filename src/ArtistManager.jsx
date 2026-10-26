import { useState } from 'react';
import AddArtistModal from './AddArtistModal'; // ודא שהנתיב תואם לקבצים שלך

export default function ArtistManager({ isOpen, onClose, artists, onDelete, onAddArtist, onEditArtist }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null); // שומר את האומן שעורכים כרגע

  // אם החלון לא אמור להיות פתוח, אל תרנדר שום דבר
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* כותרת וכפתור הוספת אומן חדש בשורה אחת */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>מאגר אומנים רשומים</h3>
          <button 
            className="save-btn" 
            onClick={() => { setEditingArtist(null); setIsAddModalOpen(true); }}
            style={{ backgroundColor: '#4CAF50', color: 'white', padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            + הוסף אומן
          </button>
        </div>

        <div className="artists-list">
          {artists.length === 0 ? <p style={{textAlign:'center'}}>אין אומנים במאגר</p> : null}
          {artists.map(artist => (
            <div key={artist.id} className="artist-list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
              <div className="artist-info">
                <span className="artist-color-dot" style={{ backgroundColor: artist.color, display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', marginLeft: '8px' }}></span>
                <strong>{artist.name}</strong> ({artist.role}) <br/>
                <small style={{color: '#666', fontSize: '0.8rem'}}>
                  📞 {artist.phone || 'לא הוזן'} | 🔑 {artist.password || 'לא הוזן'}
                </small>
              </div>

              {/* כפתורי פעולה: עריכה ומחיקה */}
              <div style={{ display: 'flex', gap: '5px' }}>
                <button 
                  className="edit-artist-btn" 
                  onClick={() => { setEditingArtist(artist); setIsAddModalOpen(true); }}
                  style={{ backgroundColor: '#2196F3', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  ✏️ עריכה
                </button>
                <button 
                  className="delete-artist-btn" 
                  onClick={() => onDelete(artist.id)}
                  style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  🗑️ מחיקה
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button className="cancel-btn" style={{width: '100%'}} onClick={onClose}>
            סגור
          </button>
        </div>

        {/* חלון הוספה / עריכת אומן נפתח מתוך מסך הניהול */}
        <AddArtistModal 
          isOpen={isAddModalOpen} 
          onClose={() => { setIsAddModalOpen(false); setEditingArtist(null); }} 
          onSave={(artistData) => {
            if (editingArtist) {
              onEditArtist({ ...editingArtist, ...artistData }); // עדכון אומן קיים
            } else {
              onAddArtist(artistData); // הוספת אומן חדש
            }
            setIsAddModalOpen(false);
            setEditingArtist(null);
          }}
          existingArtist={editingArtist} // מעביר את נתוני האומן לטופס במצב עריכה
        />

        

      </div>
    </div>
  );
}