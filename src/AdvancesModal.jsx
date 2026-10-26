export default function AdvancesModal({ isOpen, onClose, scheduledEvents }) {
  if (!isOpen) return null;

  // סינון רק של האירועים שטרם שילמו מקדמה
  const unpaidEvents = scheduledEvents.filter(ev => !ev.hasAdvancePaid);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content event-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <h3>💰 אירועים שטרם שולמה בהם מקדמה</h3>
        
        {unpaidEvents.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '30px', color: '#666' }}>מעולה! אין אירועים הממתינים לתשלום מקדמה 🎉</p>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '15px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f4f8', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '10px' }}>תאריך</th>
                  <th style={{ padding: '10px' }}>חתן וכלה</th>
                  <th style={{ padding: '10px' }}>אולם</th>
                  <th style={{ padding: '10px' }}>טלפונים</th>
                </tr>
              </thead>
              <tbody>
                {unpaidEvents.map(ev => (
                  <tr key={ev.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{ev.dateString}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{ev.groomName} & {ev.brideName}</td>
                    <td style={{ padding: '10px' }}>{ev.venue || '-'}</td>
                    <td style={{ padding: '10px', direction: 'ltr', textAlign: 'right' }}>{ev.phone1 || ''} {ev.phone2 ? `/ ${ev.phone2}` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button className="cancel-btn" style={{ width: '100%' }} onClick={onClose}>סגור</button>
        </div>
      </div>
    </div>
  );
}