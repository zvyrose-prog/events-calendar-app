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
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
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
  return onAuthStateChanged(auth, (user) => {
    // השהיה זעירה שמבטיחה שמפתח ההצפנה נשמר ב-localStorage לפני ש-App.jsx מושך נתונים
    setTimeout(() => {
      callback(user);
    }, 50);
  });
};

// --- 2. ניהול אמנים (פרטי ומוצפן לכל לקוח!) ---

// האזנה לשינויים באמנים של הלקוח בזמן אמת + פענוח אוטומטי
export const subscribeToArtists = (uid, callback) => {
  if (!uid) return () => {};
  const userArtistsRef = collection(db, "users", uid, "artists");
  return onSnapshot(userArtistsRef, (snapshot) => {
    const artistsData = snapshot.docs
      .map(docSnap => decryptObjectData(uid, docSnap.id, docSnap.data()))
      .filter(item => !item._decryptionFailed)
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); // מיון מהישן לחדש (החדש נכנס למטה)
      
    callback(artistsData);
  });
};

// הוספת אומן חדש (מוצפן) לתיקיית הלקוח
export const addArtistToFirestore = async (uid, artistData) => {
  const userArtistsRef = collection(db, "users", uid, "artists");
  
  // מוודא שתמיד תהיה חותמת זמן ליצירה לטובת המיון
  const dataWithTimestamp = {
    ...artistData,
    createdAt: artistData.createdAt || Date.now()
  };

  const encryptedData = encryptObjectData(uid, dataWithTimestamp);
  return await addDoc(userArtistsRef, encryptedData);
};

// עדכון אומן קיים (מוצפן) של הלקוח - נשאר בדיוק כמו אצלך
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

// האזנה ישירה ונקייה להגדרות הטופס האישיות של המשתמש (עורכי וידאו + שדות מותאמים אישית + וואטסאפ)
export const subscribeToUserSettings = (uid, callback) => {
  if (!uid) return () => {};
  const settingsRef = doc(db, "users", uid, "settings", "formConfig");
  
  return onSnapshot(settingsRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({
        editorsList: data.editorsList || [],
        customFields: data.customFields || [],
        whatsappTemplate: data.whatsappTemplate || ''
      });
    } else {
      callback({ editorsList: [], customFields: [], whatsappTemplate: '' });
    }
  });
};

// שמירת הגדרות אישיות (מוצפנות) בענן של הלקוח
export const saveUserSettingsToFirestore = async (uid, settingsData) => {
  const prefRef = doc(db, "users", uid, "settings", "preferences");
  const encryptedData = encryptObjectData(uid, settingsData);
  return await setDoc(prefRef, encryptedData, { merge: true });
};

// שמירה ישירה, ממוזגת ומנקה של הגדרות המשתמש בענן
// שמירה ישירה, ממוזגת ומנקה של הגדרות המשתמש בענן (כולל תפיסת שגיאות)
export const saveUserSettings = async (uid, newSettings) => {
  if (!uid) throw new Error("User ID is required to save settings");
  const settingsRef = doc(db, "users", uid, "settings", "formConfig");
  
  const cleanSettings = JSON.parse(JSON.stringify(newSettings));
  console.log("🚀 Saving clean data to Firebase for UID:", uid, cleanSettings);

  try {
    await setDoc(settingsRef, cleanSettings, { merge: true });
    console.log("✅ Successfully saved to Firebase!");
  } catch (error) {
    console.error("❌ Error saving to Firebase:", error);
    throw error;
  }
};