// פונקציה להורדת גיבוי אקסל (CSV) ישירות למכשיר של הלקוח (מחצי שנה אחורה ועד בכלל)
export const exportEventsBackup = (scheduledEvents, artists) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  // מיפוי מזהי אומנים לשמותיהם
  const artistsMap = {};
  artists.forEach(a => {
    artistsMap[a.id] = a.name;
  });

  // סינון אירועים מחצי שנה אחורה ועד בכלל ומיון כרונולוגי
  const filteredEvents = scheduledEvents
    .map(ev => {
      const dateObj = new Date(ev.dateString);
      return { ...ev, _dateObj: dateObj };
    })
    .filter(ev => !isNaN(ev._dateObj.getTime()) && ev._dateObj >= sixMonthsAgo)
    .sort((a, b) => a._dateObj - b._dateObj);

  if (filteredEvents.length === 0) {
    alert("אין אירועים לגיבוי (מחצי שנה אחורה ועד היום).");
    return;
  }

  const headers = [
    "תאריך", "חתן", "כלה", "אולם", "טלפון 1", "טלפון 2", 
    "אומן / צלם", "עורך", "סטטוס", "מקדמה", "שירים", "רשימת שירים", "חומר נאסף"
  ];
  const csvRows = [headers.join(",")];

  const cleanCsvText = (val) => `"${String(val || "").replace(/"/g, '""')}"`;
  const formatBool = (val) => (val === true ? "כן" : val === false ? "לא" : String(val || ""));

  filteredEvents.forEach(ev => {
    const dateFormatted = ev._dateObj.toLocaleDateString('he-IL');
    const mainArtist = artistsMap[ev.artistId] || artistsMap[ev.photographer] || ev.photographer || "";
    const editor = artistsMap[ev.videoEditor] || ev.videoEditor || "";

    csvRows.push([
      dateFormatted,
      cleanCsvText(ev.groomName),
      cleanCsvText(ev.brideName),
      cleanCsvText(ev.venue),
      cleanCsvText(ev.phone1),
      cleanCsvText(ev.phone2),
      cleanCsvText(mainArtist),
      cleanCsvText(editor),
      ev.isTentative ? "אופציה" : "סגור",
      formatBool(ev.hasAdvancePaid),
      formatBool(ev.hasSongs),
      cleanCsvText(ev.songList),
      formatBool(ev.materialCollected)
    ].join(","));
  });

  const csvContent = "\uFEFF" + csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const todayStr = new Date().toLocaleDateString('he-IL').replace(/\./g, '-');

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `גיבוי_יומן_${todayStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};