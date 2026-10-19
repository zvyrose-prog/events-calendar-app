import { useState } from 'react';
import EventDetailsModal from './EventDetailsModal';

export default function ArtistSquare({ 
  artist, 
  day, 
  scheduledEvents, 
  tentativeHolds, 
  onOpenEventModal, 
  onToggleTentative,
  onDeleteEvent 
}) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const bookedEvent = scheduledEvents.find(ev => 
    ev.dateString === day.date.toDateString() && ev.artistId === artist.id
  );
  
  const isBooked = !!bookedEvent;
  const isTentative = tentativeHolds.includes(`${day.date.toDateString()}_${artist.id}`);

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
      <div 
        className="artist-square"
        style={{ 
          backgroundColor: isBooked ? artist.color : `${artist.color}25`, 
          color: isBooked ? '#fff' : '#111', 
          border: `1px solid ${artist.color}`,
        }}
        title={`${artist.name} (${artist.role}) ${isBooked ? '- סגור (לחץ לצפייה)' : '- פנוי'}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {isBooked ? `💍 ${artist.name}` : (isTentative ? `? ${artist.name}` : artist.name)}
      </div>

      {/* חלון פרטי האירוע שנוצר */}
      <EventDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        event={bookedEvent}
        artist={artist}
        onEdit={() => {
          setIsDetailsOpen(false);
          onOpenEventModal(day.date, artist, bookedEvent); // פותח את טופס העריכה עם הנתונים הקיימים
        }}
        onDelete={(eventId) => {
          onDeleteEvent(eventId);
        }}
      />
    </>
  );
}