import { useState, useEffect } from 'react';
import { HDate, HebrewCalendar } from '@hebcal/core';
import ArtistManager from './ArtistManager';
import AddArtistModal from './AddArtistModal';
import EventModal from './EventModal';
import ArtistSquare from './ArtistSquare';
import AdvancesModal from './AdvancesModal';
import LoginModal from './LoginModal';
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

  // טעינה ראשונית מזיכרון הדפדפן (Local Storage) אם קיים
  const [artists, setArtists] = useState(() => {
    const saved = localStorage.getItem('calendar_artists');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'ישראל', role: 'צלם', color: '#00BCD4' },
      { id: '2', name: 'דוד', role: 'רחפן', color: '#F44336' },
      { id: '3', name: 'שרה', role: 'עורכת', color: '#9C27B0' },
      { id: '4', name: 'יוסי', role: 'צלם 2', color: '#2196F3' },
      { id: '5', name: 'משה', role: 'תאורה', color: '#4CAF50' }
    ];
  });

  // משתנים עבור פתיחת וסגירת החלונות הקופצים
  const [isAddArtistOpen, setIsAddArtistOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

    const firstDayOfMonth = new HDate(1, hMonth, hYear).greg();
    const lastDayOfMonth = new HDate(daysInMonth, hMonth, hYear).greg();

    const startPadding = firstDayOfMonth.getDay();
    const totalCells = Math.ceil((startPadding + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const cellDate = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth(), 1 - startPadding + i);
      const hDate = new HDate(cellDate);
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

    const gMonth1 = gregMonthsMap[firstDayOfMonth.getMonth()];
    const gMonth2 = gregMonthsMap[lastDayOfMonth.getMonth()];
    const gMonthDisplay = gMonth1 === gMonth2 ? gMonth1 : `${gMonth1}/${gMonth2}`;
    const gYearDisplay = lastDayOfMonth.getFullYear();
    subTitle = `${gMonthDisplay} ${gYearDisplay}`;

    // הניווט קדימה ואחורה מותאם לקפיצות של חודשים עבריים
    nextMonthFn = () => setCurrentDate(new HDate(1, hMonth, hYear).add(daysInMonth + 1, 'd').greg());
    prevMonthFn = () => setCurrentDate(new HDate(1, hMonth, hYear).subtract(1, 'd').greg());
  }

  const toggleView = () => setIsHebrewView(!isHebrewView);

  // פונקציה לשמירת אומן (מקבלת את הנתונים מהחלון החיצוני)
  const handleAddArtist = (artistData) => {
    const newArtist = {
      id: Date.now().toString(),
      ...artistData // לוקח את השם, התפקיד, הטלפון והצבע מהחלון
    };
    setArtists([...artists, newArtist]);
    setIsAddArtistOpen(false);
  };

  const handleEditArtist = (updatedArtist) => {
    setArtists(prevArtists =>
      prevArtists.map(art =>
        art.id === updatedArtist.id ? updatedArtist : art
      )
    );
  };

  // פונקציה למחיקת אומן מהמאגר
  const handleDeleteArtist = (artistId) => {
    setArtists(artists.filter(artist => artist.id !== artistId));
  };

  // פונקציה לשמירת אירוע חדש או עדכון אירוע קיים (כולל בדיקת התנגשות אומן)
  const handleSaveEvent = (eventData) => {
    const formattedDateString = selectedDate ? selectedDate.toDateString() : "";
    const targetArtistId = eventData.artistId || (selectedArtistForEvent ? selectedArtistForEvent.id : null);

    // 1. בדיקה האם לאומן היעד כבר יש אירוע תפוס באותו יום (ומדובר באירוע אחר משלנו)
    const isArtistBusy = scheduledEvents.some(ev => 
      ev.dateString === formattedDateString && 
      ev.artistId === targetArtistId && 
      (!editingEvent || ev.id !== editingEvent.id) // אם אנחנו בעריכה, מתעלמים מהאירוע של עצמנו
    );

    if (isArtistBusy) {
      alert("⚠️ שגיאה: לאומן הנבחר כבר יש אירוע תפוס בתאריך הזה! לא ניתן להעביר אליו את האירוע.");
      return; // עוצרים את השמירה ולא סוגרים את החלון
    }

    if (editingEvent) {
      // מצב עריכה: מסירים רק את האירוע הישן לפי ה-ID שלו
      const cleanedEvents = scheduledEvents.filter(ev => ev.id !== editingEvent.id);

      const updatedEvent = {
        ...editingEvent,
        ...eventData,
        dateString: formattedDateString,
        artistId: targetArtistId
      };

      setScheduledEvents([...cleanedEvents, updatedEvent]);
      setEditingEvent(null);
    } else {
      // מצב יצירת אירוע חדש לגמרי
      const newEvent = {
        id: Date.now().toString(),
        dateString: formattedDateString,
        artistId: targetArtistId,
        ...eventData
      };

      setScheduledEvents([...scheduledEvents, newEvent]);
    }

    setIsEventModalOpen(false);
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
              <button className="view-toggle-btn" onClick={toggleView}>
                {isHebrewView ? "עבור לתצוגה לועזית" : "עבור לתצוגה עברית"}
              </button>
              <button className="view-toggle-btn" onClick={() => setShowWeekend(!showWeekend)}>
                {showWeekend ? "הסתר סופ\"ש" : "הצג סופ\"ש"}
              </button>
              <button className="settings-btn" onClick={() => setIsSettingsOpen(true)}>⚙️ ניהול אומנים</button>
              <button className="settings-btn" onClick={() => setIsAdvancesOpen(true)} style={{ backgroundColor: '#ff9800' }}>
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
                    <div className="day-events">
                      {day.events.map((ev, i) => (
                        <div key={i} className="holiday-text">{ev}</div>
                      ))}
                    </div>

                    {/* ריבועי האומנים */}
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
                            setEditingEvent(eventToEdit); // שומר את האירוע בזיכרון כדי שהטופס ידע להציג אותו
                            setIsEventModalOpen(true);    // פותח את חלון הנתונים
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
        <ArtistManager
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          artists={artists}
          onDelete={handleDeleteArtist}
          onAddArtist={handleAddArtist}
          onEditArtist={handleEditArtist}
        />

          <AddArtistModal
            isOpen={isAddArtistOpen}
            onClose={() => setIsAddArtistOpen(false)}
            onSave={handleAddArtist}
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