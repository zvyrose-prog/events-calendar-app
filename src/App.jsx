import { useState, useEffect } from 'react';
import { HDate, HebrewCalendar } from '@hebcal/core';
import ArtistManager from './ArtistManager';
import AddArtistModal from './AddArtistModal';
import EventModal from './EventModal';
import EventDetailsModal from './EventDetailsModal';
import ArtistSquare from './ArtistSquare';
import AdvancesModal from './AdvancesModal';
import LoginModal from './LoginModal';
import { getEncryptionKey } from './cryptoUtils';
import { exportEventsBackup } from './backupUtils';
import {
  subscribeToAuth,
  logoutCustomer,
  subscribeToArtists,
  addArtistToFirestore,
  updateArtistInFirestore,
  deleteArtistFromFirestore,
  subscribeToEvents,
  addEventToFirestore,
  updateEventInFirestore,
  deleteEventFromFirestore,
  subscribeToUserSettings,
  saveUserSettings
} from './firebaseService';
import './App.css';

// תרגום חודשים עבריים ולועזיים לעברית
const hebrewMonthsMap = {
  "Nisan": "ניסן", "Iyyar": "אייר", "Sivan": "סיוון", "Tamuz": "תמוז", "Av": "אב", "Elul": "אלול",
  "Tishrei": "תשרי", "Cheshvan": "חשוון", "Kislev": "כסלו", "Tevet": "טבת", "Sh'vat": "שבט",
  "Adar I": "אדר א'", "Adar II": "אדר ב'", "Adar": "אדר"
};

const gregMonthsMap = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
];

const hebDays = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "יא", "יב", "יג", "יד", "טו", "טז", "יז", "יח", "יט", "כ", "כא", "כב", "כג", "כד", "כה", "כו", "כז", "כח", "כט", "ל"];

function App() {
  // ניהול המשתמש המחובר
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isHebrewView, setIsHebrewView] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null); // שומר את האירוע שעליו לחצו לצפייה
  const [isArtistsLoaded, setIsArtistsLoaded] = useState(false);

  // רשימות האומנים והאירועים של הלקוח המחובר
  const [artists, setArtists] = useState([]);
  const [scheduledEvents, setScheduledEvents] = useState([]);
  const [tentativeHolds, setTentativeHolds] = useState([]);

  // משתנים עבור פתיחת וסגירת החלונות הקופצים
  const [isAddArtistOpen, setIsAddArtistOpen] = useState(false);
  const [isArtistManagerOpen, setIsArtistManagerOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [showWeekend, setShowWeekend] = useState(false); // שומר האם להציג או להסתיר את שישי-שבת
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null); // שומר את האירוע שברצון לערוך
  const [selectedArtistForEvent, setSelectedArtistForEvent] = useState(null); // שומר את האומן שלחצנו עליו
  const [isAdvancesOpen, setIsAdvancesOpen] = useState(false);
  const [whatsappTemplate, setWhatsappTemplate] = useState("");
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

  const [editorsList, setEditorsList] = useState([]);
  const [customFields, setCustomFields] = useState([]);

  // States לחלוניות הניהול מתוך התפריט
  const [isEditorsModalOpen, setIsEditorsModalOpen] = useState(false);
  const [newEditorName, setNewEditorName] = useState('');

  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [newFieldTitle, setNewFieldTitle] = useState('');

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeArtists = subscribeToArtists(currentUser.uid, (artistsData) => {
      setArtists(artistsData);
      setIsArtistsLoaded(true);
    });

    const unsubscribeEvents = subscribeToEvents(currentUser.uid, (eventsData) => {
      setScheduledEvents(eventsData);
    });

    const unsubscribeSettings = subscribeToUserSettings(currentUser.uid, (settings) => {
      console.log("📥 Loaded from Firebase:", settings); // <-- תוסיף את זה

      setEditorsList(settings.editorsList || []);
      setCustomFields(settings.customFields || []);

      if (settings.whatsappTemplate) {
        setWhatsappTemplate(settings.whatsappTemplate);
      } else {
        setWhatsappTemplate("");
      }
    });

    const unsubSettings = subscribeToUserSettings(currentUser.uid, (settings) => {
      setEditorsList(settings.editorsList || []);
      setCustomFields(settings.customFields || []);
    });

    return () => {
      unsubscribeArtists();
      unsubscribeEvents();
      unsubscribeSettings();
      unsubSettings();
    };
  }, [currentUser]);

  // האזנה למצב ההתחברות של הלקוח ואיפוס/טעינת נתונים מקומיים
  useEffect(() => {
    const unsubscribeAuth = subscribeToAuth((user) => {
      if (user && !getEncryptionKey(user.uid)) {
        // המתנה קצרה למקרה שההתחברות כרגע בעיצומה ושמירת המפתח עדיין רצה
        setTimeout(() => {
          if (!getEncryptionKey(user.uid)) {
            logoutCustomer();
          } else {
            setCurrentUser(user);
            setAuthLoading(false);
            const savedTentatives = localStorage.getItem(`calendar_tentatives_${user.uid}`);
            setTentativeHolds(savedTentatives ? JSON.parse(savedTentatives) : []);
          }
        }, 300);
        return;
      }

      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        // טעינת סימני שאלה שמורים של הלקוח הספציפי שהתחבר
        const savedTentatives = localStorage.getItem(`calendar_tentatives_${user.uid}`);
        setTentativeHolds(savedTentatives ? JSON.parse(savedTentatives) : []);
      } else {
        // איפוס הנתונים כשהלקוח מתנתק
        setArtists([]);
        setScheduledEvents([]);
        setTentativeHolds([]);
        setIsArtistsLoaded(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. טעינה וסינכרון של אמנים ואירועים בזמן אמת מהענן - רק עבור הלקוח המחובר!
  useEffect(() => {
    if (!currentUser) return;

    const unsubArtists = subscribeToArtists(currentUser.uid, (artistsData) => {
      setArtists(artistsData);
      setIsArtistsLoaded(true);
    });

    const unsubEvents = subscribeToEvents(currentUser.uid, (eventsData) => {
      setScheduledEvents(eventsData);
    });

    return () => {
      unsubArtists();
      unsubEvents();
    };
  }, [currentUser]);

  // שמירת סימני השאלה של הלקוח בזיכרון המקומי
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`calendar_tentatives_${currentUser.uid}`, JSON.stringify(tentativeHolds));
    }
  }, [tentativeHolds, currentUser]);

  const daysArray = [];
  let mainTitle;
  let subTitle;
  let nextMonthFn, prevMonthFn;

  const gYear = currentDate.getFullYear();
  const gMonth = currentDate.getMonth();
  const baseHDate = new HDate(currentDate);

  // משיכת חגים לשנה הנוכחית והבאה (כדי לכסות את כל הקצוות)
  const events = HebrewCalendar.calendar({ year: gYear, isHebrewYear: false, il: true })
    .concat(HebrewCalendar.calendar({ year: gYear + 1, isHebrewYear: false, il: true }))
    .concat(HebrewCalendar.calendar({ year: gYear - 1, isHebrewYear: false, il: true }));

  if (!isHebrewView) {
    // --- חישוב תצוגה לועזית (לפי חודש לועזי) ---
    const firstDay = new Date(gYear, gMonth, 1);
    const lastDay = new Date(gYear, gMonth + 1, 0);

    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const totalCells = Math.ceil((startPadding + totalDays) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const cellDate = new Date(gYear, gMonth, 1 - startPadding + i);
      const isCurrentMonth = cellDate.getMonth() === gMonth;
      const hDate = new HDate(cellDate);

      const dayEvents = events.filter(ev => ev.getDate().isSameDate(hDate));
      daysArray.push({
        date: cellDate,
        gregorianDay: cellDate.getDate(),
        hebrewDay: hebDays[hDate.getDate()],
        isCurrentMonth,
        events: dayEvents.map(ev => ev.render('he'))
      });
    }

    mainTitle = currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

    const hFirst = new HDate(firstDay);
    const hLast = new HDate(lastDay);
    const hMonth1 = hebrewMonthsMap[hFirst.getMonthName()] || hFirst.getMonthName();
    const hMonth2 = hebrewMonthsMap[hLast.getMonthName()] || hLast.getMonthName();
    const hebMonthDisplay = hMonth1 === hMonth2 ? hMonth1 : `${hMonth1}/${hMonth2}`;
    const hebYearStr = hLast.renderGematriya().split(' ').pop().replace(/['"׳״]/g, '');
    subTitle = `${hebMonthDisplay} ${hebYearStr}`;

    nextMonthFn = () => setCurrentDate(new Date(gYear, gMonth + 1, 1));
    prevMonthFn = () => setCurrentDate(new Date(gYear, gMonth - 1, 1));

  } else {
    // --- חישוב תצוגה עברית (לפי חודש עברי) ---
    const hYear = baseHDate.getFullYear();
    const hMonth = baseHDate.getMonth();
    const daysInMonth = HDate.daysInMonth(hMonth, hYear);

    const firstDayHDate = new HDate(1, hMonth, hYear);
    const firstDayGreg = firstDayHDate.greg();
    const lastDayGreg = new HDate(daysInMonth, hMonth, hYear).greg();

    const startPadding = firstDayGreg.getDay();
    const totalCells = Math.ceil((startPadding + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const hDate = new HDate(1, hMonth, hYear).add(i - startPadding, 'd');
      const cellDate = hDate.greg();
      const isCurrentMonth = hDate.getMonth() === hMonth;

      const dayEvents = events.filter(ev => ev.getDate().isSameDate(hDate));
      daysArray.push({
        date: cellDate,
        gregorianDay: cellDate.getDate(),
        hebrewDay: hebDays[hDate.getDate()],
        isCurrentMonth,
        events: dayEvents.map(ev => ev.render('he'))
      });
    }

    const hMonthName = hebrewMonthsMap[baseHDate.getMonthName()] || baseHDate.getMonthName();
    const hebYearStr = baseHDate.renderGematriya().split(' ').pop().replace(/['"׳״]/g, '');
    mainTitle = `${hMonthName} ${hebYearStr}`;

    const gMonth1 = gregMonthsMap[firstDayGreg.getMonth()];
    const gMonth2 = gregMonthsMap[lastDayGreg.getMonth()];
    const gMonthDisplay = gMonth1 === gMonth2 ? gMonth1 : `${gMonth1}/${gMonth2}`;
    const gYearDisplay = lastDayGreg.getFullYear();
    subTitle = `${gMonthDisplay} ${gYearDisplay}`;

    nextMonthFn = () => setCurrentDate(new HDate(1, hMonth, hYear).add(daysInMonth + 1, 'd').greg());
    prevMonthFn = () => setCurrentDate(new HDate(1, hMonth, hYear).subtract(1, 'd').greg());
  }

  const toggleView = () => setIsHebrewView(!isHebrewView);

  const handleDeleteEvent = async (eventOrId) => {
    // תמיכה גם אם מועבר אובייקט אירוע שלם וגם אם מועבר רק ה-ID ישירות
    const eventId = typeof eventOrId === 'object' ? (eventOrId.id || eventOrId._id) : eventOrId;

    console.log("-> handleDeleteEvent started. Extracted eventId:", eventId);

    if (!currentUser) {
      alert("שגיאה: משתמש לא מחובר");
      return;
    }
    if (!eventId) {
      alert("שגיאה: מזהה האירוע ריק ולא ניתן למחוק");
      return;
    }

    try {
      await deleteEventFromFirestore(currentUser.uid, String(eventId));
      console.log("-> האירוע נמחק בהצלחה מהענן!");
      setSelectedEvent(null);
    } catch (error) {
      console.error("שגיאה במחיקת האירוע:", error);
      alert("אירעה שגיאה בעת מחיקת האירוע: " + error.message);
    }
  };

  // פונקציה לשמירת אומן חדש בענן של הלקוח
  const handleAddArtist = async (artistData) => {
    if (!currentUser) return;
    try {
      await addArtistToFirestore(currentUser.uid, artistData);
      setIsAddArtistOpen(false);
    } catch (error) {
      console.error("שגיאה בשמירת האומן בענן:", error);
      alert("שגיאה בשמירת האומן בענן");
    }
  };

  // פונקציה לעדכון אומן קיים בענן של הלקוח
  const handleEditArtist = async (updatedArtist) => {
    if (!currentUser) return;
    try {
      await updateArtistInFirestore(currentUser.uid, updatedArtist.id, updatedArtist);
    } catch (error) {
      console.error("שגיאה בעדכון האומן בענן:", error);
      alert("שגיאה בעדכון האומן בענן");
    }
  };

  // פונקציה למחיקת אומן מהענן של הלקוח
  const handleDeleteArtist = async (artistId) => {
    if (!currentUser) return;
    if (window.confirm("האם אתה בטוח שברצונך למחוק את האומן?")) {
      try {
        await deleteArtistFromFirestore(currentUser.uid, String(artistId));
        setArtists(prevArtists => prevArtists.filter(artist => artist.id !== artistId));
      } catch (error) {
        console.error("שגיאה במחיקת האומן:", error);
        alert("אירעה שגיאה בעת מחיקת האומן.");
      }
    }
  };

  // פונקציה לשמירת אירוע חדש או עדכון אירוע קיים בענן של הלקוח
  const handleSaveEvent = async (eventData) => {
    if (!currentUser) return;
    const formattedDateString = selectedDate ? selectedDate.toDateString() : "";
    const targetArtistId = eventData.artistId || (selectedArtistForEvent ? selectedArtistForEvent.id : null);

    // בדיקה האם לאומן היעד כבר יש אירוע תפוס באותו יום
    const isArtistBusy = scheduledEvents.some(ev =>
      ev.dateString === formattedDateString &&
      ev.artistId === targetArtistId &&
      (!editingEvent || ev.id !== editingEvent.id)
    );

    if (isArtistBusy) {
      alert("⚠️ שגיאה: לאומן הנבחר כבר יש אירוע תפוס בתאריך הזה! לא ניתן להעביר אליו את האירוע.");
      return;
    }

    try {
      if (editingEvent) {
        const updatedData = {
          ...eventData,
          dateString: formattedDateString,
          artistId: targetArtistId
        };
        await updateEventInFirestore(currentUser.uid, editingEvent.id, updatedData);
        setEditingEvent(null);
      } else {
        const newEvent = {
          dateString: formattedDateString,
          artistId: targetArtistId,
          ...eventData
        };
        await addEventToFirestore(currentUser.uid, newEvent);
      }

      setIsEventModalOpen(false);
    } catch (error) {
      console.error("שגיאה בשמירת האירוע לענן:", error);
      alert("אירעה שגיאה בשמירה, נסה שוב.");
    }
  };

  // פונקציה להוספה/הסרה של סימן שאלה לאומן בלחיצה על הריבוע שלו
  const toggleTentative = (dateString, artistId) => {
    const key = `${dateString}_${artistId}`;
    if (tentativeHolds.includes(key)) {
      setTentativeHolds(tentativeHolds.filter(k => k !== key));
    } else {
      setTentativeHolds([...tentativeHolds, key]);
    }
  };

  if (authLoading) {
    return <div style={{ textAlign: "center", padding: "50px", fontSize: "18px" }}>טוען מערכת...</div>;
  }

  return (
    <div className="app-container" dir="rtl">
      {!currentUser ? (
        <LoginModal />
      ) : (
        <>
          <header className="top-bar">
            <div className="title-and-user" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* כפתור 3 פסים (המבורגר) בצד ימין למעלה */}
              <button
                onClick={() => setIsSideMenuOpen(true)}
                style={{
                  backgroundColor: '#1e293b',
                  color: '#fff',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  lineHeight: 1
                }}
                title="תפריט מערכת"
              >
                ☰
              </button>

              <div>
                <h1>לוח שנה אירועים</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => exportEventsBackup(scheduledEvents, artists)}
                    style={{
                      backgroundColor: '#0284c7',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '3px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                    title="הורד גיבוי אקסל למכשיר"
                  >
                    📥 גיבוי
                  </button>
                  <span className="logged-user-badge" dir="ltr" title={currentUser.email}>
                    👤 {currentUser.email?.split('@')[0]}
                  </span>
                </div>
              </div>
            </div>

            <div className="month-navigation">
              <button onClick={prevMonthFn}>▶</button>
              <div className="month-titles">
                <h2>{mainTitle}</h2>
                <h3 className="sub-month-title">{subTitle}</h3>
              </div>
              <button onClick={nextMonthFn}>◀</button>
            </div>

            <div className="header-actions">
              <button className="view-toggle-btn" onClick={toggleView} style={{ backgroundColor: '#3f51b5', color: '#fff' }}>
                {isHebrewView ? "📅 לועזי" : "📅 עברי"}
              </button>
              <button className="view-toggle-btn" onClick={() => setShowWeekend(!showWeekend)} style={{ backgroundColor: '#1e3a8a', color: '#fff' }}>
                {showWeekend ? "הסתר סופ\"ש" : "הצג סופ\"ש"}
              </button>
              <button className="settings-btn" onClick={() => setIsAdvancesOpen(true)} style={{ backgroundColor: '#047857' }}>
                💰 מקדמות
              </button>
            </div>
          </header>

          {/* מגירת תפריט צד נפתחת (Drawer) */}
          {isSideMenuOpen && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(3px)',
                zIndex: 9999,
                display: 'flex',
                justifyContent: 'flex-start'
              }}
              onClick={() => setIsSideMenuOpen(false)}
            >
              <div
                dir="rtl"
                style={{
                  width: '280px',
                  maxWidth: '80vw',
                  height: '100%',
                  backgroundColor: '#0f172a',
                  borderLeft: '1px solid #1e293b',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '-5px 0 25px rgba(0,0,0,0.5)',
                  color: '#fff'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  {/* כותרת התפריט וכפתור סגירה */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid #1e293b' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>☰</span> תפריט מערכת
                    </h3>
                    <button
                      onClick={() => setIsSideMenuOpen(false)}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* סעיף 4 נמצא כאן: רשימת הפעולות בתפריט */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      onClick={() => {
                        setIsSideMenuOpen(false);
                        setIsArtistManagerOpen(true);
                      }}
                      style={{
                        width: '100%', padding: '12px 14px', backgroundColor: '#1e293b', color: '#f8fafc',
                        border: '1px solid #334155', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 'bold',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'right'
                      }}
                    >
                      <span>⚙️</span>
                      <span>ניהול אומנים</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsSideMenuOpen(false);
                        setIsEditorsModalOpen(true);
                      }}
                      style={{
                        width: '100%', padding: '12px 14px', backgroundColor: '#1e293b', color: '#f8fafc',
                        border: '1px solid #334155', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 'bold',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'right'
                      }}
                    >
                      <span>🎬</span>
                      <span>ניהול עורכי וידאו</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsSideMenuOpen(false);
                        setIsAddFieldModalOpen(true);
                      }}
                      style={{
                        width: '100%', padding: '12px 14px', backgroundColor: '#1e293b', color: '#f8fafc',
                        border: '1px solid #334155', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 'bold',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'right'
                      }}
                    >
                      <span>➕</span>
                      <span>הוסף שדה</span>
                    </button>
                  </div>
                </div>

                {/* תחתית התפריט - כפתור התנתקות ופרטי משתמש */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={() => {
                      setIsSideMenuOpen(false);
                      logoutCustomer();
                    }}
                    style={{
                      width: '100%', padding: '12px 14px', backgroundColor: 'rgba(220, 38, 38, 0.15)', color: '#f87171',
                      border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 'bold',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'right'
                    }}
                  >
                    <span>🚪</span>
                    <span>התנתקות</span>
                  </button>

                  <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
                    מחובר כ: {currentUser.email}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* סעיף 5 נמצא כאן (מחוץ לתפריט): חלונית ניהול עורכי וידאו */}
          {isEditorsModalOpen && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsEditorsModalOpen(false)}>
              <div dir="rtl" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '24px', borderRadius: '14px', width: '360px', maxWidth: '90vw', border: '1px solid #334155' }} onClick={e => e.stopPropagation()}>
                <h3 style={{ marginTop: 0, marginBottom: '16px' }}>🎬 רשימת עורכי/ות וידאו</h3>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    placeholder="שם עורך/ת חדש..."
                    value={newEditorName}
                    onChange={(e) => setNewEditorName(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' }}
                  />
                  <button
                    onClick={async () => {
                      if (!newEditorName.trim()) return;
                      const updated = [...editorsList, { id: Date.now().toString(), name: newEditorName.trim() }];
                      await saveUserSettings(currentUser.uid, {
                        editorsList: updated,
                        customFields: customFields
                      });
                      setNewEditorName('');
                    }}
                    style={{ padding: '8px 14px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    הוסף
                  </button>
                </div>

                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {editorsList.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>עדיין לא הוגדרו עורכים. הוסף למעלה!</p>
                  ) : (
                    editorsList.map(ed => (
                      <div key={ed.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '8px 12px', borderRadius: '8px' }}>
                        <span>{ed.name}</span>
                        <button
                          onClick={async () => {
                            const updated = editorsList.filter(item => item.id !== ed.id);
                            await saveUserSettings(currentUser.uid, {
                              editorsList: updated,
                              customFields: customFields
                            });
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}
                          title="מחק"
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <button onClick={() => setIsEditorsModalOpen(false)} style={{ marginTop: '18px', width: '100%', padding: '10px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  סגור
                </button>
              </div>
            </div>
          )}

          {/* חלונית "הוסף שדה" לפרטי אירוע */}
          {isAddFieldModalOpen && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsAddFieldModalOpen(false)}>
              <div dir="rtl" style={{ backgroundColor: '#1e293b', color: '#fff', padding: '24px', borderRadius: '14px', width: '360px', maxWidth: '90vw', border: '1px solid #334155' }} onClick={e => e.stopPropagation()}>
                <h3 style={{ marginTop: 0, marginBottom: '12px' }}>➕ הוסף שדה לפרטי אירוע</h3>

                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#cbd5e1' }}>הכנס כותרת:</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    placeholder="למשל: מספר מוזמנים / ציוד נוסף"
                    value={newFieldTitle}
                    onChange={(e) => setNewFieldTitle(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' }}
                  />
                  <button
                    onClick={async () => {
                      if (!newFieldTitle.trim()) return;
                      const newField = { id: 'field_' + Date.now(), label: newFieldTitle.trim() };
                      const updated = [...customFields, newField];
                      // שומרים גם את השדות המעודכנים וגם את רשימת העורכים הקיימת יחד!
                      await saveUserSettings(currentUser.uid, {
                        customFields: updated,
                        editorsList: editorsList
                      });
                      setNewFieldTitle('');
                    }}
                    style={{ padding: '8px 14px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    שמור
                  </button>
                </div>

                {customFields.length > 0 && (
                  <div style={{ marginTop: '12px', borderTop: '1px solid #334155', paddingTop: '12px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>שדות קיימים שהוספת:</div>
                    <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {customFields.map(f => (
                        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '6px 10px', borderRadius: '6px', fontSize: '0.9rem' }}>
                          <span>{f.label}</span>
                          <button
                            onClick={async () => {
                              const updated = customFields.filter(item => item.id !== f.id);
                              await saveUserSettings(currentUser.uid, {
                                customFields: updated,
                                editorsList: editorsList
                              });
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => setIsAddFieldModalOpen(false)} style={{ marginTop: '18px', width: '100%', padding: '10px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  סגור
                </button>
              </div>
            </div>
          )}

          <main className="calendar-wrapper">
            <div className="calendar-header" style={{ gridTemplateColumns: showWeekend ? 'repeat(7, 1fr)' : 'repeat(5, 1fr)' }}>
              <div>ראשון</div><div>שני</div><div>שלישי</div><div>רביעי</div><div>חמישי</div>
              {showWeekend && (
                <>
                  <div>שישי</div><div>שבת</div>
                </>
              )}
            </div>

            {isArtistsLoaded && artists.length === 0 && (
              <div style={{
                backgroundColor: '#fff3cd',
                color: '#856404',
                border: '1px solid #ffeeba',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                margin: '10px auto',
                fontWeight: 'bold'
              }}>
                כנס לניהול אומנים והוסף את האומנים שלך למערכת
              </div>
            )}

            <div className="calendar-grid" style={{ gridTemplateColumns: showWeekend ? 'repeat(7, 1fr)' : 'repeat(5, 1fr)' }}>
              {daysArray
                .filter(day => showWeekend || (day.date.getDay() !== 5 && day.date.getDay() !== 6))
                .map((day, index) => (
                  <div
                    key={index}
                    className={`day-cell ${!day.isCurrentMonth ? 'not-current-month' : ''}`}
                  >
                    <div className="dates-header">
                      {isHebrewView ? (
                        <>
                          <span className="primary-date">{day.hebrewDay}</span>
                          <span className="secondary-date">{day.gregorianDay}</span>
                        </>
                      ) : (
                        <>
                          <span className="primary-date">{day.gregorianDay}</span>
                          <span className="secondary-date">{day.hebrewDay}</span>
                        </>
                      )}
                    </div>
                    <div className="day-events">
                      {day.events.map((ev, i) => (
                        <div key={i} className="holiday-text">{ev}</div>
                      ))}
                    </div>

                    <div className="artists-squares">
                      {artists.map(artist => (
                        <ArtistSquare
                          key={artist.id}
                          artist={artist}
                          day={day}
                          scheduledEvents={scheduledEvents}
                          tentativeHolds={tentativeHolds}
                          onOpenEventModal={(date, art, eventToEdit = null) => {
                            setSelectedDate(date);
                            setSelectedArtistForEvent(art);
                            setEditingEvent(eventToEdit);
                            setIsEventModalOpen(true);
                          }}
                          onToggleTentative={toggleTentative}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </main>

          {/* --- חלונות קופצים --- */}
          <AddArtistModal
            isOpen={isAddArtistOpen}
            onClose={() => setIsAddArtistOpen(false)}
            onSave={handleAddArtist}
            artists={artists}
          />

          {isArtistManagerOpen && (
            <ArtistManager
              isOpen={isArtistManagerOpen}
              onClose={() => setIsArtistManagerOpen(false)}
              artists={artists}
              onDelete={handleDeleteArtist}
              onAddArtist={handleAddArtist}
              onEditArtist={handleEditArtist}
            />
          )}

          <EventDetailsModal
            isOpen={!!selectedEvent}
            event={selectedEvent}
            artist={artists.find(a => a.id === selectedEvent?.artistId)}
            artists={artists}
            onClose={() => setSelectedEvent(null)}
            onEdit={(eventToEdit) => {
              setEditingEvent(eventToEdit);
              setSelectedEvent(null);
            }}
            onDelete={handleDeleteEvent}
          />

          {isEventModalOpen && (
            <EventModal
              isOpen={isEventModalOpen}
              onClose={() => setIsEventModalOpen(false)}
              onSave={handleSaveEvent}
              selectedDate={selectedDate}
              prefilledArtist={selectedArtistForEvent}
              existingEvent={editingEvent}
              artists={artists}
              editorsList={editorsList}
              customFields={customFields}
            />
          )}

          <AdvancesModal
            isOpen={isAdvancesOpen}
            onClose={() => setIsAdvancesOpen(false)}
            scheduledEvents={scheduledEvents}
            whatsappTemplate={whatsappTemplate}
            onSaveTemplate={(newText) =>
              saveUserSettings(currentUser.uid, { whatsappTemplate: newText })
            }
            onMarkPaid={(ev) => {
              updateEventInFirestore(currentUser.uid, ev.id, {
                ...ev,
                hasAdvancePaid: true
              });
            }}
          />


        </>
      )}
    </div>
  );
}

export default App;