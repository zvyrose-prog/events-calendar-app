import CryptoJS from 'crypto-js';

const STORAGE_KEY_PREFIX = 'calendar_enc_key_';

// יצירת ושמירת מפתח הצפנה מקומי במכשיר בעת התחברות/הרשמה
export const saveEncryptionKey = (uid, password) => {
  // גוזרים מפתח חזק משילוב הסיסמה וה-UID של המשתמש
  const derivedKey = CryptoJS.SHA256(`${uid}_${password}_secret_salt`).toString();
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${uid}`, derivedKey);
  return derivedKey;
};

// שליפת המפתח השמור מהמכשיר
export const getEncryptionKey = (uid) => {
  return localStorage.getItem(`${STORAGE_KEY_PREFIX}${uid}`);
};

// מחיקת המפתח מהמכשיר בעת התנתקות יזומה
export const clearEncryptionKey = (uid) => {
  if (uid) {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${uid}`);
  }
};

// הצפנת אובייקט שלם (אירוע או אומן) לפני שליחה ל-Firebase
export const encryptObjectData = (uid, dataObj) => {
  const key = getEncryptionKey(uid);
  if (!key) throw new Error("Missing encryption key");

  const jsonStr = JSON.stringify(dataObj);
  const cipherText = CryptoJS.AES.encrypt(jsonStr, key).toString();

  // זה כל מה שיישמר ב-Firebase! אף אחד לא יכול לקרוא את התוכן
  return {
    encryptedPayload: cipherText,
    updatedAt: new Date().toISOString()
  };
};

// פענוח אובייקט שמגיע מ-Firebase חזרה לנתונים רגילים עבור המסך
export const decryptObjectData = (uid, docId, docData) => {
  // תמיכה אחורה: אם יש נתונים ישנים שנשמרו לפני ההצפנה, נחזיר אותם כרגיל
  if (!docData.encryptedPayload) {
    return { id: docId, ...docData };
  }

  const key = getEncryptionKey(uid);
  if (!key) {
    return { id: docId, _decryptionFailed: true };
  }

  try {
    const bytes = CryptoJS.AES.decrypt(docData.encryptedPayload, key);
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedStr) throw new Error("Empty decryption");

    const parsedData = JSON.parse(decryptedStr);
    return { id: docId, ...parsedData };
  } catch (err) {
    console.error("שגיאה בפענוח נתונים:", err);
    return { id: docId, _decryptionFailed: true };
  }
};