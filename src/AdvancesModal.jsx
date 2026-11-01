import { useState } from 'react';

const DEFAULT_TEMPLATE = "מזל טוב משפחת {זוג}, תזכורת לתשלום מקדמה עבור שירותי הסרטה לחתונה";

export default function AdvancesModal({ 
  isOpen, 
  onClose, 
  scheduledEvents, 
  onMarkPaid,
  whatsappTemplate,
  onSaveTemplate 
}) {
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [draftTemplate, setDraftTemplate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const activeTemplate = whatsappTemplate || DEFAULT_TEMPLATE;

  // פתיחת אזור עריכת הנוסח עם הנוסח הנוכחי של המשתמש
  const handleStartEdit = () => {
    setDraftTemplate(activeTemplate);
    setIsEditingTemplate(true);
  };

  // הוספת תגית חכמה לנוסח בלחיצה
  const insertPlaceholder = (tag) => {
    setDraftTemplate((prev) => `${prev} ${tag}`.trim());
  };

  // שמירת הנוסח האישי בענן
  const handleSave = async () => {
    if (!onSaveTemplate) return;
    setIsSaving(true);
    try {
      await onSaveTemplate(draftTemplate.trim() || DEFAULT_TEMPLATE);
      setIsEditingTemplate(false);
    } finally {
      setIsSaving(false);
    }
  };

  // פונקציית עזר להמרת מספר יום בחודש העברי לאותיות (א' עד ל')
  const toHebrewDayLetters = (num) => {
    const letters = [
      "", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י",
      "יא", "יב", "יג", "יד", "טו", "טז", "יז", "יח", "יט", "כ",
      "כא", "כב", "כג", "כד", "כה", "כו", "כז", "כח", "כט", "ל"
    ];
    return letters[num] || String(num);
  };

  // פונקציה שמחזירה תאריך עברי קצר ("כא חשוון") ותאריך לועזי קצר ("01/11")
  const formatCompactDates = (dateStr) => {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) {
      return { hebrewShort: "", gregorianShort: dateStr };
    }

    const dayG = String(dateObj.getDate()).padStart(2, '0');
    const monthG = String(dateObj.getMonth() + 1).padStart(2, '0');
    const gregorianShort = `${dayG}/${monthG}`;

    try {
      const parts = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
        day: 'numeric',
        month: 'long'
      }).formatToParts(dateObj);

      const dayNum = parseInt(parts.find(p => p.type === 'day')?.value, 10);
      const monthName = parts.find(p => p.type === 'month')?.value || '';
      const hebrewDay = toHebrewDayLetters(dayNum);

      return {
        hebrewShort: `${hebrewDay} ${monthName}`,
        gregorianShort
      };
    } catch {
      return { hebrewShort: "", gregorianShort };
    }
  };

  // פתיחת שיחת וואטסאפ עם הודעה המבוססת על הנוסח האישי של המשתמש
  const handleSendWhatsApp = (ev) => {
    const rawPhone = ev.phone1 || ev.phone2 || "";
    const digitsOnly = rawPhone.replace(/\D/g, '');

    if (!digitsOnly) {
      alert("לא הוזן מספר טלפון באירוע זה.");
      return;
    }

    const formattedPhone = digitsOnly.startsWith('0')
      ? '972' + digitsOnly.slice(1)
      : digitsOnly;

    const coupleNames = [ev.groomName, ev.brideName].filter(Boolean).join(" & ");
    const { hebrewShort, gregorianShort } = formatCompactDates(ev.dateString);
    const fullDateStr = hebrewShort ? `${hebrewShort} (${gregorianShort})` : gregorianShort;

    const messageText = activeTemplate
      .replaceAll("{זוג}", coupleNames)
      .replaceAll("{חתן}", ev.groomName || "")
      .replaceAll("{כלה}", ev.brideName || "")
      .replaceAll("{תאריך}", fullDateStr);

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(messageText)}`;
    window.open(whatsappUrl, '_blank');
  };

  // סינון אירועים שטרם שילמו מקדמה + מיון כרונולוגי לפי תאריך
  const unpaidEvents = scheduledEvents
    .filter(ev => !ev.hasAdvancePaid)
    .sort((a, b) => new Date(a.dateString) - new Date(b.dateString));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content event-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0 }}>💰 אירועים שטרם שולמה בהם מקדמה</h3>
          <button
            type="button"
            onClick={() => isEditingTemplate ? setIsEditingTemplate(false) : handleStartEdit()}
            style={{
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '5px 10px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {isEditingTemplate ? "✖ סגור עריכת נוסח" : "✏️ ערוך נוסח וואטסאפ"}
          </button>
        </div>

        {/* אזור עריכת תבנית הודעת הוואטסאפ האישית */}
        {isEditingTemplate && (
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b' }}>
              נוסח הודעת וואטסאפ קבוע (נשמר בחשבון שלך):
            </div>
            <textarea
              rows={3}
              value={draftTemplate}
              onChange={(e) => setDraftTemplate(e.target.value)}
              placeholder="הקלד כאן את נוסח ההודעה..."
              style={{ width: '100%', fontSize: '0.9rem', padding: '8px', borderRadius: '6px', border: '1px solid #94a3b8' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.75rem', color: '#475569' }}>
                <span>הוסף תגית:</span>
                {["{זוג}", "{חתן}", "{כלה}", "{תאריך}"].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertPlaceholder(tag)}
                    style={{
                      backgroundColor: '#e2e8f0',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      color: '#0f172a'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {isSaving ? "שומר..." : "💾 שמור נוסח קבוע"}
              </button>
            </div>
          </div>
        )}
        
        {unpaidEvents.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '30px', color: '#666' }}>מעולה! אין אירועים הממתינים לתשלום מקדמה 🎉</p>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f4f8', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '10px', whiteSpace: 'nowrap' }}>תאריך</th>
                  <th style={{ padding: '10px' }}>חתן וכלה</th>
                  <th style={{ padding: '10px' }}>טלפונים</th>
                  <th style={{ padding: '10px', textAlign: 'center', whiteSpace: 'nowrap' }}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {unpaidEvents.map(ev => {
                  const { hebrewShort, gregorianShort } = formatCompactDates(ev.dateString);
                  return (
                    <tr key={ev.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 10px', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b' }}>
                          {hebrewShort}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {gregorianShort}
                        </div>
                      </td>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>
                        {ev.groomName} & {ev.brideName}
                      </td>
                      <td style={{ padding: '10px', direction: 'ltr', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {ev.phone1 || ''} {ev.phone2 ? `/ ${ev.phone2}` : ''}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={() => onMarkPaid && onMarkPaid(ev)}
                            style={{
                              backgroundColor: '#10b981',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              fontSize: '0.78rem',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                            title="סמן שמקדמה שולמה"
                          >
                            ✓ שולם
                          </button>
                          <button
                            onClick={() => handleSendWhatsApp(ev)}
                            style={{
                              backgroundColor: '#25D366',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              fontSize: '0.78rem',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                            title="שלח תזכורת בוואטסאפ"
                          >
                            💬 וואטסאפ
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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