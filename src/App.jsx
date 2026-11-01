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
  saveUserSettingsToFirestore
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
      if (settings.whatsappTemplate) {
        setWhatsappTemplate(settings.whatsappTemplate);
      } else {
        setWhatsappTemplate("");
      }
    });

    return () => {
      unsubscribeArtists();
      unsubscribeEvents();
      unsubscribeSettings();
    };
  }, [currentUser]);

  useEffect(() => {
    const unsubscribeAuth = subscribeToAuth((user) => {
      if (user && !getEncryptionKey(user.uid)) {
        // אם המשתמש מחובר מעבר ישן אבל עדיין אין לו מפתח הצפנה שמור במכשיר
        logoutCustomer();
        return;
      }

      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        const savedTentatives = localStorage.getItem(`calendar_tentatives_${user.uid}`);
        setTentativeHolds(savedTentatives ? JSON.parse(savedTentatives) : []);
      } else {
        setArtists([]);
        setScheduledEvents([]);
        setTentativeHolds([]);
        setIsArtistsLoaded(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 1. האזנה למצב ההתחברות של הלקוח ואיפוס/טעינת נתונים מקומיים
  useEffect(() => {
    const unsubscribeAuth = subscribeToAuth((user) => {
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

  // פונקציה למחיקת אירוע מהענן של הלקוח
  const handleDeleteEvent = async (eventId) => {
    if (!currentUser) return;
    if (window.confirm("האם אתה בטוח שברצונך למחוק את האירוע?")) {
      try {
        await deleteEventFromFirestore(currentUser.uid, eventId);
      } catch (error) {
        console.error("שגיאה במחיקת האירוע:", error);
        alert("אירעה שגיאה בעת מחיקת האירוע.");
      }
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
            <div className="title-and-user">
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
              <button className="settings-btn" onClick={() => setIsArtistManagerOpen(true)} style={{ backgroundColor: '#334155' }}>
                ⚙️ אומנים
              </button>
              <button className="settings-btn" onClick={() => setIsAdvancesOpen(true)} style={{ backgroundColor: '#047857' }}>
                💰 מקדמות
              </button>
              <button className="settings-btn" onClick={logoutCustomer} style={{ backgroundColor: '#dc2626' }}>
                🚪 צא
              </button>
            </div>
          </header>

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
            />
          )}

          <AdvancesModal
            isOpen={isAdvancesOpen}
            onClose={() => setIsAdvancesOpen(false)}
            scheduledEvents={scheduledEvents}
            whatsappTemplate={whatsappTemplate}
            onSaveTemplate={(newText) => 
              saveUserSettingsToFirestore(currentUser.uid, { whatsappTemplate: newText })
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