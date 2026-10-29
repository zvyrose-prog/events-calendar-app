import { useState, useEffect } from 'react';
import { HDate, HebrewCalendar } from '@hebcal/core';
import ArtistManager from './ArtistManager';
import AddArtistModal from './AddArtistModal';
import EventModal from './EventModal';
import EventDetailsModal from './EventDetailsModal';
import ArtistSquare from './ArtistSquare';
import AdvancesModal from './AdvancesModal';
import LoginModal from './LoginModal';
import { 
  subscribeToArtists, 
  addArtistToFirestore, 
  updateArtistInFirestore, 
  deleteArtistFromFirestore,
  subscribeToEvents, 
  addEventToFirestore, 
  updateEventInFirestore, 
  deleteEventFromFirestore 
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isHebrewView, setIsHebrewView] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null); // שומר את האירוע שעליו לחצו לצפייה
  const [isArtistsLoaded, setIsArtistsLoaded] = useState(false);


  // הגדרת משתנה ה-State להתחלה כרשימה ריקה (הנתונים יגיעו מיד מהענן)
  const [artists, setArtists] = useState([]);

  // טעינה וסינכרון של אמנים בזמן אמת מהענן
  useEffect(() => {
    const unsubscribe = subscribeToArtists((artistsData) => {
      setArtists(artistsData);
      setIsArtistsLoaded(true); // מסמן שהנתונים נטענו מהענן
    });
    return () => unsubscribe();
  }, []);

  // משתנים עבור פתיחת וסגירת החלונות הקופצים
  const [isAddArtistOpen, setIsAddArtistOpen] = useState(false);
  const [isArtistManagerOpen, setIsArtistManagerOpen] = useState(false);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [showWeekend, setShowWeekend] = useState(false); // שומר האם להציג או להסתיר את שישי-שבת
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null); // שומר את האירוע שברצון לערוך

  const [scheduledEvents, setScheduledEvents] = useState(() => {
    const saved = localStorage.getItem('calendar_events');
    return saved ? JSON.parse(saved) : [];
  });

  const [tentativeHolds, setTentativeHolds] = useState(() => {
    const saved = localStorage.getItem('calendar_tentatives');
    return saved ? JSON.parse(saved) : [];
  });

  // שמירה אוטומטית לזיכרון הדפדפן בכל שינוי
  useEffect(() => {
    localStorage.setItem('calendar_artists', JSON.stringify(artists));
  }, [artists]);

  // 2. טעינה וסינכרון של אירועים בזמן אמת מהענן דרך קובץ השירות
  useEffect(() => {
    const unsubscribe = subscribeToEvents((eventsData) => {
      setScheduledEvents(eventsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('calendar_events', JSON.stringify(scheduledEvents));
  }, [scheduledEvents]);

  useEffect(() => {
    localStorage.setItem('calendar_tentatives', JSON.stringify(tentativeHolds));
  }, [tentativeHolds]);

  const [selectedArtistForEvent, setSelectedArtistForEvent] = useState(null); // שומר את האומן שלחצנו עליו
  const [isAdvancesOpen, setIsAdvancesOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);


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
      // יוצרים את התאריך העברי של המשבצת ישירות מספריית HDate לפי אינדקס הימים
      const hDate = new HDate(1, hMonth, hYear).add(i - startPadding, 'd');
      const cellDate = hDate.greg(); // התאריך הלועזי המותאם במדויק ליום העברי
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

    // הניווט קדימה ואחורה מותאם לקפיצות של חודשים עבריים
    nextMonthFn = () => setCurrentDate(new HDate(1, hMonth, hYear).add(daysInMonth + 1, 'd').greg());
    prevMonthFn = () => setCurrentDate(new HDate(1, hMonth, hYear).subtract(1, 'd').greg());
  }

  const toggleView = () => setIsHebrewView(!isHebrewView);

  // פונקציה למחיקת אירוע מהענן
  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק את האירוע?")) {
      try {
        await deleteEventFromFirestore(eventId);
        // ה-state יתעדכן אוטומטית הודות ל-onSnapshot ברקע!
      } catch (error) {
        console.error("שגיאה במחיקת האירוע:", error);
        alert("אירעה שגיאה בעת מחיקת האירוע.");
      }
    }
  };

  // פונקציה לשמירת אומן חדש בענן
  const handleAddArtist = async (artistData) => {
    try {
      await addArtistToFirestore(artistData);
      setIsAddArtistOpen(false);
    } catch (error) {
      console.error("שגיאה בשמירת האומן בענן:", error);
      alert("שגיאה בשמירת האומן בענן");
    }
  };

  const handleEditArtist = async (updatedArtist) => {
    try {
      await updateArtistInFirestore(updatedArtist.id, updatedArtist);
    } catch (error) {
      console.error("שגיאה בעדכון האומן בענן:", error);
      alert("שגיאה בעדכון האומן בענן");
    }
  };

  const handleDeleteArtist = async (artistId) => {
    console.log("מנסה למחוק אמן עם ID:", artistId);
    if (window.confirm("האם אתה בטוח שברצונך למחוק את האומן?")) {
      try {
        await deleteArtistFromFirestore(String(artistId)); // מוודא שזה מחרוזת

        // עדכון מיידי של המסך והרשימה המקומית כדי שלא יישאר תקוע
        setArtists(prevArtists => prevArtists.filter(artist => artist.id !== artistId));

        console.log("האמן נמחק בהצלחה מהענן ומהמסך!");
      } catch (error) {
        console.error("שגיאה במחיקת האומן:", error);
        alert("אירעה שגיאה בעת מחיקת האומן.");
      }
    }
  };

  // פונקציה לשמירת אירוע חדש או עדכון אירוע קיים בענן (כולל בדיקת התנגשות אומן)
  const handleSaveEvent = async (eventData) => {
    const formattedDateString = selectedDate ? selectedDate.toDateString() : "";
    const targetArtistId = eventData.artistId || (selectedArtistForEvent ? selectedArtistForEvent.id : null);

    // בדיקה האם לאומן היעד כבר יש אירוע תפוס באותו יום (ומדובר באירוע אחר משלנו)
    const isArtistBusy = scheduledEvents.some(ev =>
      ev.dateString === formattedDateString &&
      ev.artistId === targetArtistId &&
      (!editingEvent || ev.id !== editingEvent.id) // אם אנחנו בעריכה, מתעלמים מהאירוע של עצמנו
    );

    if (isArtistBusy) {
      alert("⚠️ שגיאה: לאומן הנבחר כבר יש אירוע תפוס בתאריך הזה! לא ניתן להעביר אליו את האירוע.");
      return; // עוצרים את השמירה ולא סוגרים את החלון
    }

    try {
      if (editingEvent) {
        // מצב עריכה: עדכון האירוע הקיים במסד הנתונים בענן
        const updatedData = {
          ...eventData,
          dateString: formattedDateString,
          artistId: targetArtistId
        };
        await updateEventInFirestore(editingEvent.id, updatedData);
        setEditingEvent(null);
      } else {
        // מצב יצירת אירוע חדש לגמרי בענן
        const newEvent = {
          dateString: formattedDateString,
          artistId: targetArtistId,
          ...eventData
        };
        await addEventToFirestore(newEvent);
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
      setTentativeHolds(tentativeHolds.filter(k => k !== key)); // מסיר אם קיים
    } else {
      setTentativeHolds([...tentativeHolds, key]); // מוסיף אם לא קיים
    }
  };

  return (
    <div className="app-container" dir="rtl">
      {!isAuthenticated ? (
        <LoginModal onLoginSuccess={() => setIsAuthenticated(true)} />
      ) : (
        <>
          <header className="top-bar">
            <h1>לוח שנה אירועים</h1>
            <div className="month-navigation">
              <button onClick={prevMonthFn}>▶</button>
              <div className="month-titles">
                <h2>{mainTitle}</h2>
                <h3 className="sub-month-title">{subTitle}</h3>
              </div>
              <button onClick={nextMonthFn}>◀</button>
            </div>
            <div className="header-actions">
              <button className="view-toggle-btn" onClick={toggleView} style={{ backgroundColor: '#3f51b5', color: '#fff', borderRadius: '8px' }}>
                {isHebrewView ? "עבור לתצוגה לועזית" : "עבור לתצוגה עברית"}
              </button>
              <button className="view-toggle-btn" onClick={() => setShowWeekend(!showWeekend)} style={{ backgroundColor: '#1e3a8a', color: '#fff', borderRadius: '8px' }}>
                {showWeekend ? "הסתר סופ\"ש" : "הצג סופ\"ש"}
              </button>
              <button className="settings-btn" onClick={() => setIsArtistManagerOpen(true)} style={{ backgroundColor: '#334155' }}>⚙️ ניהול אומנים</button>
              <button className="settings-btn" onClick={() => setIsAdvancesOpen(true)} style={{ backgroundColor: '#047857' }}>
                💰 מקדמות
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
                כנס לניהול אומנים והוסף את האומנים לזיכרון
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
                      {/* מחליף את מיקום ועיצוב התאריכים בהתאם לתצוגה שנבחרה */}
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
                    {/* אירועי היום - נגביל לגובה מינימלי ונמנע חריגה */}
                    <div className="day-events">
                      {day.events.map((ev, i) => (
                        <div key={i} className="holiday-text">{ev}</div>
                      ))}
                    </div>

                    {/* ריבועי האומנים - עטפנו בקונטיינר עם גלילה נקייה או צמצום */}
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
              onEditArtist={handleEditArtist} // <--- תוודא שהשורה הזו קיימת כאן
            />
          )}

          <EventDetailsModal
            isOpen={!!selectedEvent}
            event={selectedEvent}
            artist={artists.find(a => a.id === selectedEvent?.artistId)}
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
          />
        </>
      )}
    </div>
  );

}

export default App;