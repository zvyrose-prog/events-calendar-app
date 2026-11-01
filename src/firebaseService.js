import { db, auth } from './firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  saveEncryptionKey, 
  clearEncryptionKey, 
  encryptObjectData, 
  decryptObjectData 
} from './cryptoUtils';

// --- 1. ניהול משתמשים (הרשמה, כניסה, יציאה) ---

// הרשמת לקוח חדש (מייל, טלפון וסיסמה)
export const registerCustomer = async (email, phone, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // יצירת ושמירת מפתח ההצפנה מקומית במכשיר של הלקוח
  saveEncryptionKey(user.uid, password);

  await setDoc(doc(db, "users", user.uid), {
    email: email.trim(),
    phone: phone.trim(),
    createdAt: new Date().toISOString()
  });

  return user;
};

// התחברות לקוח קיים
export const loginCustomer = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // גזירת ושמירת מפתח ההצפנה מקומית במכשיר בעת ההתחברות
  saveEncryptionKey(user.uid, password);

  return user;
};

// התנתקות מהמערכת
export const logoutCustomer = async () => {
  if (auth.currentUser) {
    clearEncryptionKey(auth.currentUser.uid);
  }
  await signOut(auth);
};

// האזנה למצב החיבור של הלקוח (מחובר / מנותק)
export const subscribeToAuth = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// --- 2. ניהול אמנים (פרטי ומוצפן לכל לקוח!) ---

// האזנה לשינויים באמנים של הלקוח בזמן אמת + פענוח אוטומטי
export const subscribeToArtists = (uid, callback) => {
  if (!uid) return () => {};
  const userArtistsRef = collection(db, "users", uid, "artists");
  return onSnapshot(userArtistsRef, (snapshot) => {
    const artistsData = snapshot.docs
      .map(docSnap => decryptObjectData(uid, docSnap.id, docSnap.data()))
      .filter(item => !item._decryptionFailed);
    callback(artistsData);
  });
};

// הוספת אומן חדש (מוצפן) לתיקיית הלקוח
export const addArtistToFirestore = async (uid, artistData) => {
  const userArtistsRef = collection(db, "users", uid, "artists");
  const encryptedData = encryptObjectData(uid, artistData);
  return await addDoc(userArtistsRef, encryptedData);
};

// עדכון אומן קיים (מוצפן) של הלקוח
export const updateArtistInFirestore = async (uid, artistId, artistData) => {
  const artistRef = doc(db, "users", uid, "artists", String(artistId));
  
  const dataToUpdate = { ...artistData };
  delete dataToUpdate.id;

  const encryptedData = encryptObjectData(uid, dataToUpdate);
  return await updateDoc(artistRef, encryptedData);
};

// מחיקת אמן מהענן של הלקוח
export const deleteArtistFromFirestore = async (uid, artistId) => {
  const artistRef = doc(db, "users", uid, "artists", String(artistId));
  return await deleteDoc(artistRef);
};

// --- 3. ניהול אירועים (פרטי ומוצפן לכל לקוח!) ---

// האזנה לשינויים באירועים של הלקוח בזמן אמת + פענוח אוטומטי
export const subscribeToEvents = (uid, callback) => {
  if (!uid) return () => {};
  const userEventsRef = collection(db, "users", uid, "events");
  return onSnapshot(userEventsRef, (snapshot) => {
    const eventsData = snapshot.docs
      .map(docSnap => decryptObjectData(uid, docSnap.id, docSnap.data()))
      .filter(item => !item._decryptionFailed);
    callback(eventsData);
  });
};

// הוספת אירוע חדש (מוצפן) לענן של הלקוח
export const addEventToFirestore = async (uid, eventData) => {
  const userEventsRef = collection(db, "users", uid, "events");
  const encryptedData = encryptObjectData(uid, eventData);
  return await addDoc(userEventsRef, encryptedData);
};

// עדכון אירוע קיים (מוצפן) של הלקוח
export const updateEventInFirestore = async (uid, eventId, updatedData) => {
  const eventRef = doc(db, "users", uid, "events", String(eventId));
  
  const dataToUpdate = { ...updatedData };
  delete dataToUpdate.id;

  const encryptedData = encryptObjectData(uid, dataToUpdate);
  return await updateDoc(eventRef, encryptedData);
};

// מחיקת אירוע מהענן של הלקוח
export const deleteEventFromFirestore = async (uid, eventId) => {
  const eventRef = doc(db, "users", uid, "events", String(eventId));
  return await deleteDoc(eventRef);
};

// --- 4. ניהול הגדרות אישיות למשתמש (כמו נוסח הודעת וואטסאפ) ---

// האזנה להגדרות האישיות של הלקוח בזמן אמת + פענוח אוטומטי
export const subscribeToUserSettings = (uid, callback) => {
  if (!uid) return () => {};
  const prefRef = doc(db, "users", uid, "settings", "preferences");
  return onSnapshot(prefRef, (docSnap) => {
    if (docSnap.exists()) {
      const decrypted = decryptObjectData(uid, docSnap.id, docSnap.data());
      if (!decrypted._decryptionFailed) {
        callback(decrypted);
        return;
      }
    }
    callback({});
  });
};

// שמירת הגדרות אישיות (מוצפנות) בענן של הלקוח
export const saveUserSettingsToFirestore = async (uid, settingsData) => {
  const prefRef = doc(db, "users", uid, "settings", "preferences");
  const encryptedData = encryptObjectData(uid, settingsData);
  return await setDoc(prefRef, encryptedData, { merge: true });
};