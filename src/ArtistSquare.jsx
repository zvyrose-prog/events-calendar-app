import { useState } from 'react';
import EventDetailsModal from './EventDetailsModal';

export default function ArtistSquare({
  artist,
  day,
  scheduledEvents,
  onOpenEventModal,
  onToggleTentative,
  onDeleteEvent
}) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const bookedEvent = scheduledEvents.find(ev =>
    ev.dateString === day.date.toDateString() && ev.artistId === artist.id
  );

  const isBooked = !!bookedEvent;

  const handleClick = (e) => {
    e.stopPropagation();
    if (isBooked) {
      setIsDetailsOpen(true); // פותח את חלון הפרטים המעוצב במקום alert
    } else {
      onOpenEventModal(day.date, artist);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isBooked) {
      onToggleTentative(day.date.toDateString(), artist.id);
    }
  };

  return (
    <>

      {/* החלף את השורה הזו בריבוע: */}
<div
        className="artist-square"
        style={{
          // רק אירוע סגור (יש אמיתי) מקבל צבע מלא. פנוי או סימן שאלה מקבלים את הצבע הבהיר והעדין של האמן
          backgroundColor: (isBooked && !bookedEvent.isTentative) ? (artist.color || '#3f51b5') : `${artist.color || '#3f51b5'}25`,
          
          // טקסט לבן באירוע סגור מלא, או צבע האמן בבהיר/סימן שאלה
          color: (isBooked && !bookedEvent.isTentative) ? '#fff' : (artist.color || '#3f51b5'),
          
          border: `1px solid ${artist.color || '#3f51b5'}`,
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {isBooked ? (bookedEvent.isTentative ? `❓ ${artist.name}` : `💍 ${artist.name}`) : artist.name}
      </div>

      {/* חלון פרטי האירוע שנוצר */}
      <EventDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        event={bookedEvent}
        artist={artist}
        onEdit={(eventToEdit) => {
          setIsDetailsOpen(false); // סוגר את חלון הפרטים
          onOpenEventModal(day.date, artist, eventToEdit); // פותח את טופס העריכה עם הנתונים המדויקים
        }}
        onDelete={(eventId) => {
          onDeleteEvent(eventId);
        }}
      />
    </>
  );
}