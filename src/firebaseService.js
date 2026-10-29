import { db } from './firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

// --- ניהול אמנים ---

// האזנה לשינויים באמנים בזמן אמת
export const subscribeToArtists = (callback) => {
  return onSnapshot(collection(db, "artists"), (snapshot) => {
    const artistsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(artistsData);
  });
};

// הוספת אומן חדש
export const addArtistToFirestore = async (artistData) => {
  await addDoc(collection(db, "artists"), artistData);
};

// עדכון אומן קיים
export const updateArtistInFirestore = async (artistId, artistData) => {
  const artistRef = doc(db, "artists", artistId);
  
  // יוצרים עותק של הנתונים בלי שדה ה-id כדי לא לשמור אותו כפול במסמך
  const dataToUpdate = { ...artistData };
  delete dataToUpdate.id;

  await updateDoc(artistRef, dataToUpdate);
};

// --- ניהול אירועים ---

// האזנה לשינויים באירועים בזמן אמת
export const subscribeToEvents = (callback) => {
  return onSnapshot(collection(db, "events"), (snapshot) => {
    const eventsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(eventsData);
  });
};

// הוספת אירוע חדש לענן
export const addEventToFirestore = async (eventData) => {
  await addDoc(collection(db, "events"), eventData);
};

// עדכון אירוע קיים
export const updateEventInFirestore = async (eventId, updatedData) => {
  const eventRef = doc(db, "events", eventId);
  await updateDoc(eventRef, updatedData);
};

// מחיקת אירוע מהענן
export const deleteEventFromFirestore = async (eventId) => {
  const eventRef = doc(db, "events", eventId);
  await deleteDoc(eventRef);
};

// מחיקת אמן מהענן
export const deleteArtistFromFirestore = async (artistId) => {
  const artistRef = doc(db, "artists", artistId);
  await deleteDoc(artistRef);
};