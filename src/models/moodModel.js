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
    quote: quotes.neutral[0]
  };
}

export function loadSampleData(state) {
  const sampleEntries = [
    { date: '2025-10-14', mood: 4, note: 'Belle journée au travail' },
    { date: '2025-10-15', mood: 3, note: 'Journée normale' },
    { date: '2025-10-16', mood: 5, note: 'Excellent projet terminé !' }
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

export function computeAnalytics(state, weekDays) {
  const entries = getWeekEntries(state);

  if (entries.length === 0) {
    return {
      hasData: false,
      averageLabel: '-',
      bestDayLabel: '-',
      recordedDaysLabel: '0/7',
      summary: 'Ajoutez vos humeurs pour voir un résumé personnalisé de votre semaine.',
      chartData: buildChartData(weekDays, entries)
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
    chartData: buildChartData(weekDays, entries)
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
