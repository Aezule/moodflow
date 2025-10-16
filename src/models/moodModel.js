export const moodLevels = {
  1: { emoji: '😞', label: 'Très triste', color: '#ff4757', value: 1 },
  2: { emoji: '😔', label: 'Triste', color: '#ff7675', value: 2 },
  3: { emoji: '😐', label: 'Neutre', color: '#fdcb6e', value: 3 },
  4: { emoji: '😊', label: 'Heureux', color: '#6c5ce7', value: 4 },
  5: { emoji: '😄', label: 'Très heureux', color: '#00b894', value: 5 }
};

export const quotes = {
  sad: [
    "Chaque nouvelle journée est une chance de recommencer",
    "Les nuages finissent toujours par passer",
    "Tu es plus fort que tu ne le penses",
    "Après la pluie, le beau temps",
    "Chaque fin est un nouveau début"
  ],
  neutral: [
    "Chaque jour est une nouvelle page à écrire",
    "La beauté se trouve dans les petits moments",
    "Prends le temps de respirer",
    "L'équilibre est la clé du bonheur",
    "Reste présent dans l'instant"
  ],
  happy: [
    "Ton sourire illumine le monde",
    "Continue à rayonner !",
    "La joie est contagieuse, partage-la",
    "Aujourd'hui est un cadeau, c'est pourquoi on l'appelle le présent",
    "Ton bonheur inspire les autres"
  ]
};

export const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export const shortDayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function getSystemTheme() {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function createInitialState(initialTheme = 'light', useSystemTheme = false) {
  const today = new Date();
  return {
    moodEntries: {},
    currentWeekStart: getMonday(today),
    currentMonth: new Date(today.getFullYear(), today.getMonth(), 1),
    theme: initialTheme,
    useSystemTheme,
    selectedDate: null,
    showMoodModal: false,
    showCalendarModal: false,
    moodDraft: { mood: null, note: '' },
    toast: { visible: false, message: '' },
    quote: quotes.neutral[0],
    analyticsPeriod: 'week' // 'week', 'month', 'year'
  };
}

export function loadSampleData(state) {
  const sampleEntries = [
    // Semaine actuelle
    { date: '2025-10-14', mood: 4, note: 'Belle journée au travail' },
    { date: '2025-10-15', mood: 3, note: 'Journée normale' },
    { date: '2025-10-16', mood: 5, note: 'Excellent projet terminé !' },
    
    // Autres jours du mois d'octobre
    { date: '2025-10-01', mood: 4, note: 'Bon début de mois' },
    { date: '2025-10-03', mood: 5, note: 'Super journée' },
    { date: '2025-10-05', mood: 3, note: 'Journée tranquille' },
    { date: '2025-10-08', mood: 4, note: 'Bonne ambiance' },
    { date: '2025-10-10', mood: 2, note: 'Jour difficile' },
    { date: '2025-10-12', mood: 4, note: 'Journée productive' },
    
    // Mois précédents pour tester la vue année
    { date: '2025-09-15', mood: 4, note: 'Septembre agréable' },
    { date: '2025-09-20', mood: 5, note: 'Excellent mois' },
    { date: '2025-09-25', mood: 4, note: 'Bonne période' },
    
    { date: '2025-08-10', mood: 5, note: 'Super vacances' },
    { date: '2025-08-15', mood: 5, note: 'Août génial' },
    { date: '2025-08-20', mood: 4, note: 'Bel été' },
    
    { date: '2025-07-05', mood: 4, note: 'Juillet sympa' },
    { date: '2025-07-18', mood: 3, note: 'Mois moyen' },
    
    { date: '2025-06-12', mood: 3, note: 'Juin correct' },
    { date: '2025-06-20', mood: 4, note: 'Bonne fin de mois' },
    
    { date: '2025-05-08', mood: 2, note: 'Mai difficile' },
    { date: '2025-05-15', mood: 3, note: 'Ça va mieux' },
    
    { date: '2025-04-10', mood: 4, note: 'Avril agréable' },
    { date: '2025-04-22', mood: 5, note: 'Super printemps' },
    
    { date: '2025-03-05', mood: 3, note: 'Mars tranquille' },
    { date: '2025-03-18', mood: 4, note: 'Bonne période' },
    
    { date: '2025-02-14', mood: 5, note: 'Belle journée' },
    { date: '2025-02-20', mood: 4, note: 'Février sympa' },
    
    { date: '2025-01-10', mood: 4, note: 'Bonne année' },
    { date: '2025-01-25', mood: 3, note: 'Janvier correct' }
  ];

  sampleEntries.forEach(entry => {
    state.moodEntries[entry.date] = {
      mood: entry.mood,
      note: entry.note || '',
      timestamp: new Date().toISOString()
    };
  });
}

export function getMonday(date) {
  const temp = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = temp.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  temp.setDate(temp.getDate() + diff);
  return temp;
}

export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

export function parseDateFromIso(iso) {
  return iso ? new Date(`${iso}T00:00:00`) : null;
}

export function getWeekTitle(state) {
  const start = new Date(state.currentWeekStart);
  const end = new Date(state.currentWeekStart);
  end.setDate(end.getDate() + 6);
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  const startStr = start.toLocaleDateString('fr-FR', options);
  const endStr = end.toLocaleDateString('fr-FR', options);
  return `${startStr} - ${endStr}`;
}

export function getWeekDays(state) {
  const days = [];
  const todayStr = new Date().toDateString();

  for (let i = 0; i < 7; i++) {
    const date = new Date(state.currentWeekStart);
    date.setDate(state.currentWeekStart.getDate() + i);
    const iso = formatDate(date);
    const entry = state.moodEntries[iso];
    const moodData = entry ? moodLevels[entry.mood] : null;

    days.push({
      iso,
      dayName: dayNames[i],
      shortName: shortDayNames[i],
      displayDate: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
      isToday: date.toDateString() === todayStr,
      entry: entry
        ? {
            ...entry,
            emoji: moodData.emoji,
            label: moodData.label,
            color: moodData.color
          }
        : null
    });
  }

  return days;
}

export function getWeekEntries(state) {
  const weekDays = getWeekDays(state);
  return weekDays
    .filter(day => Boolean(day.entry))
    .map(day => ({
      date: day.iso,
      dayName: day.shortName,
      ...day.entry
    }));
}

export function getMonthEntries(state) {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const entries = [];
  for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
    const iso = formatDate(d);
    const entry = state.moodEntries[iso];
    if (entry) {
      entries.push({
        date: iso,
        dayName: d.getDate().toString(),
        ...entry
      });
    }
  }
  return entries;
}

export function getYearEntries(state) {
  const today = new Date();
  const year = today.getFullYear();
  
  const entries = [];
  for (let month = 0; month < 12; month++) {
    const monthEntries = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const iso = formatDate(date);
      const entry = state.moodEntries[iso];
      if (entry) {
        monthEntries.push(entry);
      }
    }
    
    if (monthEntries.length > 0) {
      const avgMood = monthEntries.reduce((sum, e) => sum + e.mood, 0) / monthEntries.length;
      entries.push({
        month: month,
        monthName: new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'short' }),
        averageMood: avgMood,
        count: monthEntries.length
      });
    }
  }
  return entries;
}

export function computeAnalytics(state, weekDays) {
  const period = state.analyticsPeriod || 'week';
  
  if (period === 'week') {
    return computeWeekAnalytics(state, weekDays);
  } else if (period === 'month') {
    return computeMonthAnalytics(state);
  } else if (period === 'year') {
    return computeYearAnalytics(state);
  }
  
  return computeWeekAnalytics(state, weekDays);
}

function computeWeekAnalytics(state, weekDays) {
  const entries = getWeekEntries(state);

  if (entries.length === 0) {
    return {
      hasData: false,
      averageLabel: '-',
      bestDayLabel: '-',
      recordedDaysLabel: '0/7',
      summary: 'Ajoutez vos humeurs pour voir un résumé personnalisé de votre semaine.',
      chartData: buildChartData(weekDays, entries),
      period: 'week'
    };
  }

  const average = entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length;
  const averageMood = moodLevels[Math.round(average)];

  const bestEntry = entries.reduce((best, current) => (current.mood > best.mood ? current : best));
  const bestDate = parseDateFromIso(bestEntry.date);
  const bestDayLabel = `${moodLevels[bestEntry.mood].emoji} ${bestDate.toLocaleDateString('fr-FR', {
    weekday: 'long'
  })}`;

  return {
    hasData: true,
    averageLabel: `${averageMood.emoji} ${averageMood.label}`,
    bestDayLabel,
    recordedDaysLabel: `${entries.length}/7`,
    summary: generateWeekSummary(entries, average),
    chartData: buildChartData(weekDays, entries),
    period: 'week'
  };
}

function computeMonthAnalytics(state) {
  const entries = getMonthEntries(state);
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  if (entries.length === 0) {
    return {
      hasData: false,
      averageLabel: '-',
      bestDayLabel: '-',
      recordedDaysLabel: `0/${daysInMonth}`,
      summary: 'Ajoutez vos humeurs pour voir un résumé personnalisé du mois.',
      chartData: buildMonthChartData(state, entries),
      period: 'month'
    };
  }

  const average = entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length;
  const averageMood = moodLevels[Math.round(average)];

  const bestEntry = entries.reduce((best, current) => (current.mood > best.mood ? current : best));
  const bestDate = parseDateFromIso(bestEntry.date);
  const bestDayLabel = `${moodLevels[bestEntry.mood].emoji} ${bestDate.getDate()} ${bestDate.toLocaleDateString('fr-FR', {
    month: 'long'
  })}`;

  return {
    hasData: true,
    averageLabel: `${averageMood.emoji} ${averageMood.label}`,
    bestDayLabel,
    recordedDaysLabel: `${entries.length}/${daysInMonth}`,
    summary: generateMonthSummary(entries, average, daysInMonth),
    chartData: buildMonthChartData(state, entries),
    period: 'month'
  };
}

function computeYearAnalytics(state) {
  const entries = getYearEntries(state);

  if (entries.length === 0) {
    return {
      hasData: false,
      averageLabel: '-',
      bestDayLabel: '-',
      recordedDaysLabel: '0 mois',
      summary: 'Ajoutez vos humeurs pour voir un résumé personnalisé de l\'année.',
      chartData: buildYearChartData(entries),
      period: 'year'
    };
  }

  const average = entries.reduce((sum, entry) => sum + entry.averageMood, 0) / entries.length;
  const averageMood = moodLevels[Math.round(average)];

  const bestMonth = entries.reduce((best, current) => (current.averageMood > best.averageMood ? current : best));
  const bestDayLabel = `${moodLevels[Math.round(bestMonth.averageMood)].emoji} ${bestMonth.monthName}`;

  return {
    hasData: true,
    averageLabel: `${averageMood.emoji} ${averageMood.label}`,
    bestDayLabel,
    recordedDaysLabel: `${entries.length} mois`,
    summary: generateYearSummary(entries, average),
    chartData: buildYearChartData(entries),
    period: 'year'
  };
}

function generateWeekSummary(entries, average) {
  const averageRounded = Math.round(average);
  const moodCounts = {};

  entries.forEach(entry => {
    moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
  });

  const summaryIntro = `Cette semaine, vous avez enregistré ${entries.length} jour${entries.length > 1 ? 's' : ''}. `;

  if (averageRounded >= 4) {
    return (
      summaryIntro +
      `Excellente semaine ! Votre humeur moyenne était ${moodLevels[averageRounded].label.toLowerCase()}. Continuez sur cette lancée ! 🌟`
    );
  }

  if (averageRounded === 3) {
    return (
      summaryIntro +
      `Semaine équilibrée avec une humeur ${moodLevels[averageRounded].label.toLowerCase()}. Il y a eu des hauts et des bas, c'est normal. 🌈`
    );
  }

  return (
    summaryIntro +
    `La semaine a été difficile avec une humeur moyenne ${moodLevels[averageRounded].label.toLowerCase()}. N'hésitez pas à prendre soin de vous. 💙`
  );
}

function generateMonthSummary(entries, average, daysInMonth) {
  const averageRounded = Math.round(average);
  const summaryIntro = `Ce mois-ci, vous avez enregistré ${entries.length} jour${entries.length > 1 ? 's' : ''} sur ${daysInMonth}. `;

  if (averageRounded >= 4) {
    return (
      summaryIntro +
      `Excellent mois ! Votre humeur moyenne était ${moodLevels[averageRounded].label.toLowerCase()}. Continuez sur cette lancée ! 🌟`
    );
  }

  if (averageRounded === 3) {
    return (
      summaryIntro +
      `Mois équilibré avec une humeur ${moodLevels[averageRounded].label.toLowerCase()}. Il y a eu des hauts et des bas, c'est normal. 🌈`
    );
  }

  return (
    summaryIntro +
    `Le mois a été difficile avec une humeur moyenne ${moodLevels[averageRounded].label.toLowerCase()}. N'hésitez pas à prendre soin de vous. 💙`
  );
}

function generateYearSummary(entries, average) {
  const averageRounded = Math.round(average);
  const summaryIntro = `Cette année, vous avez enregistré des humeurs sur ${entries.length} mois. `;

  if (averageRounded >= 4) {
    return (
      summaryIntro +
      `Excellente année ! Votre humeur moyenne était ${moodLevels[averageRounded].label.toLowerCase()}. Bravo pour cette belle année ! 🌟`
    );
  }

  if (averageRounded === 3) {
    return (
      summaryIntro +
      `Année équilibrée avec une humeur ${moodLevels[averageRounded].label.toLowerCase()}. Il y a eu des hauts et des bas, c'est la vie. 🌈`
    );
  }

  return (
    summaryIntro +
    `L'année a été difficile avec une humeur moyenne ${moodLevels[averageRounded].label.toLowerCase()}. Prenez soin de vous. 💙`
  );
}

function buildChartData(weekDays, entries) {
  const lineLabels = weekDays.map(day => day.shortName);
  const lineData = weekDays.map(day => (day.entry ? day.entry.mood : null));
  const lineColors = weekDays.map(day => (day.entry ? day.entry.color : '#cccccc'));

  const moodCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  entries.forEach(entry => {
    moodCounts[entry.mood] += 1;
  });

  return {
    line: {
      labels: lineLabels,
      data: lineData,
      colors: lineColors
    },
    bar: {
      labels: Object.values(moodLevels).map(level => level.emoji),
      data: Object.keys(moodCounts).map(key => moodCounts[Number(key)]),
      backgroundColors: Object.values(moodLevels).map(level => `${level.color}80`),
      borderColors: Object.values(moodLevels).map(level => level.color)
    }
  };
}

function buildMonthChartData(state, entries) {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  
  const lineLabels = [];
  const lineData = [];
  const lineColors = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    lineLabels.push(day.toString());
    const date = new Date(today.getFullYear(), today.getMonth(), day);
    const iso = formatDate(date);
    const entry = state.moodEntries[iso];
    
    if (entry) {
      lineData.push(entry.mood);
      lineColors.push(moodLevels[entry.mood].color);
    } else {
      lineData.push(null);
      lineColors.push('#cccccc');
    }
  }

  const moodCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  entries.forEach(entry => {
    moodCounts[entry.mood] += 1;
  });

  return {
    line: {
      labels: lineLabels,
      data: lineData,
      colors: lineColors
    },
    bar: {
      labels: Object.values(moodLevels).map(level => level.emoji),
      data: Object.keys(moodCounts).map(key => moodCounts[Number(key)]),
      backgroundColors: Object.values(moodLevels).map(level => `${level.color}80`),
      borderColors: Object.values(moodLevels).map(level => level.color)
    }
  };
}

function buildYearChartData(entries) {
  const allMonths = [];
  for (let i = 0; i < 12; i++) {
    allMonths.push({
      monthName: new Date(2000, i, 1).toLocaleDateString('fr-FR', { month: 'short' }),
      averageMood: null,
      color: '#cccccc'
    });
  }

  entries.forEach(entry => {
    allMonths[entry.month] = {
      monthName: entry.monthName,
      averageMood: entry.averageMood,
      color: moodLevels[Math.round(entry.averageMood)].color
    };
  });

  const moodCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  entries.forEach(entry => {
    const rounded = Math.round(entry.averageMood);
    moodCounts[rounded] += 1;
  });

  return {
    line: {
      labels: allMonths.map(m => m.monthName),
      data: allMonths.map(m => m.averageMood),
      colors: allMonths.map(m => m.color)
    },
    bar: {
      labels: Object.values(moodLevels).map(level => level.emoji),
      data: Object.keys(moodCounts).map(key => moodCounts[Number(key)]),
      backgroundColors: Object.values(moodLevels).map(level => `${level.color}80`),
      borderColors: Object.values(moodLevels).map(level => level.color)
    }
  };
}

export function pickQuote(entries) {
  if (!entries || entries.length === 0) {
    return quotes.neutral[Math.floor(Math.random() * quotes.neutral.length)];
  }

  const average = entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length;
  let category = 'neutral';
  if (average <= 2.5) category = 'sad';
  else if (average >= 4) category = 'happy';

  const options = quotes[category];
  return options[Math.floor(Math.random() * options.length)];
}

export function getCalendarMatrix(state) {
  const matrix = [];
  const today = new Date();
  const month = new Date(state.currentMonth);
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startDay = (firstDay.getDay() + 6) % 7;
  const prevMonthDays = new Date(year, monthIndex, 0).getDate();

  const cells = [];

  for (let i = startDay - 1; i >= 0; i--) {
    const date = new Date(year, monthIndex - 1, prevMonthDays - i);
    cells.push(buildCalendarCell(state, date, false, today));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day);
    cells.push(buildCalendarCell(state, date, true, today));
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    const date = new Date(year, monthIndex + 1, nextDay++);
    cells.push(buildCalendarCell(state, date, false, today));
  }

  for (let row = 0; row < cells.length; row += 7) {
    matrix.push(cells.slice(row, row + 7));
  }

  return matrix;
}

function buildCalendarCell(state, date, isCurrentMonth, today) {
  const iso = formatDate(date);
  const entry = state.moodEntries[iso];
  return {
    iso,
    label: date.getDate(),
    isCurrentMonth,
    isToday: date.toDateString() === today.toDateString(),
    hasMood: Boolean(entry)
  };
}

export function getMonthTitle(state) {
  const options = { month: 'long', year: 'numeric' };
  return new Date(state.currentMonth).toLocaleDateString('fr-FR', options);
}

export function navigateWeek(state, direction) {
  const next = new Date(state.currentWeekStart);
  next.setDate(next.getDate() + direction * 7);
  state.currentWeekStart = next;
}

export function navigateMonth(state, direction) {
  const next = new Date(state.currentMonth);
  next.setMonth(next.getMonth() + direction);
  state.currentMonth = new Date(next.getFullYear(), next.getMonth(), 1);
}

export function toggleTheme(state) {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
}

export function saveMood(state, payload) {
  const { date, mood, note } = payload;
  state.moodEntries[date] = {
    mood,
    note: note || '',
    timestamp: new Date().toISOString()
  };
}

export function deleteMood(state, date) {
  delete state.moodEntries[date];
}

export function getSelectedDateLabel(state) {
  if (!state.selectedDate) return '';
  const date = parseDateFromIso(state.selectedDate);
  return date
    ? date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '';
}

export function ensureWeekStartForDate(state, iso) {
  const date = parseDateFromIso(iso);
  if (!date) return;
  state.currentWeekStart = getMonday(date);
}

export function getEncouragementMessage(state) {
  const today = new Date();
  let lowMoodDays = 0;

  for (let i = 0; i < 3; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const iso = formatDate(date);
    const entry = state.moodEntries[iso];
    if (entry && entry.mood <= 2) {
      lowMoodDays += 1;
    }
  }

  if (lowMoodDays >= 2) {
    return '💙 Prends soin de toi. Chaque jour difficile te rend plus fort.';
  }

  return null;
}

export function setAnalyticsPeriod(state, period) {
  if (['week', 'month', 'year'].includes(period)) {
    state.analyticsPeriod = period;
  }
}
