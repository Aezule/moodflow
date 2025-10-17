export const moodLevels = {
  1: { emoji: '😢', label: 'Très triste', color: '#ff4757', value: 1 },
  2: { emoji: '😔', label: 'Triste', color: '#ff7675', value: 2 },
  3: { emoji: '😐', label: 'Neutre', color: '#fdcb6e', value: 3 },
  4: { emoji: '😊', label: 'Heureux', color: '#6c5ce7', value: 4 },
  5: { emoji: '😄', label: 'Très heureux', color: '#00b894', value: 5 },
};

export const quotes = {
  sad: [
    'Chaque nouvelle journée est une chance de recommencer',
    'Les nuages finissent toujours par passer',
    'Tu es plus fort que tu ne le penses',
    'Après la pluie, le beau temps',
    'Chaque fin est un nouveau début',
    'Même les licornes ont des jours sans paillettes',
    "Respire, on n'est pas sur une story Instagram parfaite",
    'Ton drama du jour sera la punchline de demain',
    'Ta charge mentale mérite un spa, pas un marathon: pose les to-do, respire',
  ],
  neutral: [
    'Chaque jour est une nouvelle page à écrire',
    'La beauté se trouve dans les petits moments',
    'Prends le temps de respirer',
    "L'équilibre est la clé du bonheur",
    "Reste présent dans l'instant",
    "Aujourd'hui, vibe tranquille, mais on met quand même un gif de chat",
    "Hydrate-toi, étire-toi, et fais semblant d'être dans un vlog esthétique",
  ],
  happy: [
    'Ton sourire illumine le monde',
    'Continue à rayonner !',
    'La joie est contagieuse, partage-la',
    "Aujourd'hui est un cadeau, c'est pourquoi on l'appelle le présent",
    'Ton bonheur inspire les autres',
    "Continue de briller, on dirait l'intro d'une comédie romantique Netflix",
    'Ton mood du jour mérite un montage TikTok avec transitions dramatiques',
    'On dirait que tu viens de recevoir un message de ton crush: ambiance fireworks',
  ],
};

export const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export const shortDayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const STORAGE_KEY = 'moodflow_state_v1';
const LEGACY_COOKIE_NAME = 'moodflow_state_v1';

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function getLocalStorage() {
  if (!isBrowser()) {
    return null;
  }
  try {
    return window.localStorage || null;
  } catch (error) {
    console.error('Local storage is not accessible', error);
    return null;
  }
}

function fromBase64(encoded) {
  if (typeof window === 'undefined' || typeof window.atob !== 'function') {
    return null;
  }
  try {
    const binary = window.atob(encoded);
    if (typeof TextDecoder !== 'undefined') {
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    }
    return decodeURIComponent(escape(binary));
  } catch (error) {
    console.error('Failed to decode base64 payload', error);
    return null;
  }
}

function decodeLegacyCookie(raw) {
  if (!isBrowser() || !raw) {
    return null;
  }
  try {
    const decoded = fromBase64(decodeURIComponent(raw));
    return decoded ? JSON.parse(decoded) : null;
  } catch (error) {
    console.error('Failed to decode legacy cookie payload', error);
    return null;
  }
}

function readLegacyCookie() {
  if (!isBrowser()) {
    return null;
  }

  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${LEGACY_COOKIE_NAME}=`));

  if (!cookie) {
    return null;
  }

  const raw = cookie.split('=')[1];
  return decodeLegacyCookie(raw);
}

function clearLegacyCookie() {
  if (!isBrowser()) {
    return;
  }

  document.cookie = `${LEGACY_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

function buildPersistedPayload(state) {
  return {
    moodEntries: state.moodEntries,
    currentWeekStart: state.currentWeekStart ? formatDate(state.currentWeekStart) : null,
    currentMonth: state.currentMonth ? formatDate(state.currentMonth) : null,
    theme: state.theme,
    useSystemTheme: state.useSystemTheme,
    predictionCity: state.prediction?.city || '',
    analyticsView: state.analyticsView,
  };
}

export function loadStateFromStorage() {
  const storage = getLocalStorage();

  if (storage) {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (error) {
        console.error('Failed to parse persisted state from local storage', error);
        storage.removeItem(STORAGE_KEY);
      }
    }
  }

  const legacy = readLegacyCookie();
  if (legacy) {
    if (storage) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(legacy));
      } catch (error) {
        console.error('Failed to migrate legacy cookie to local storage', error);
      }
    }
    clearLegacyCookie();
    return legacy;
  }

  return null;
}

export function saveStateToStorage(state) {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  const payload = buildPersistedPayload(state);

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to persist state to local storage', error);
  }

  clearLegacyCookie();
}

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
    analyticsView: 'week',
    selectedDate: null,
    showMoodModal: false,
    showCalendarModal: false,
    moodDraft: { mood: null, note: '' },
    toast: { visible: false, message: '' },
    quote: quotes.neutral[0],
    analyticsPeriod: 'week', // 'week', 'month', 'year'
    prediction: {
      city: '',
      cityLabel: '',
      status: 'idle',
      error: null,
      chart: null,
      reasons: [],
      baseline: null,
      lastUpdated: null,
    },
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
    { date: '2025-01-25', mood: 3, note: 'Janvier correct' },
  ];

  sampleEntries.forEach((entry) => {
    state.moodEntries[entry.date] = {
      mood: entry.mood,
      note: entry.note || '',
      timestamp: new Date().toISOString(),
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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  const today = new Date();
  const todayStr = today.toDateString();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (let i = 0; i < 7; i++) {
    const date = new Date(state.currentWeekStart);
    date.setDate(state.currentWeekStart.getDate() + i);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const iso = formatDate(date);
    const entry = state.moodEntries[iso];
    const moodData = entry ? moodLevels[entry.mood] : null;

    days.push({
      iso,
      dayName: dayNames[i],
      shortName: shortDayNames[i],
      displayDate: date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
      }),
      isToday: date.toDateString() === todayStr,
      isFuture: dayStart.getTime() > todayStart.getTime(),
      entry: entry
        ? {
            ...entry,
            emoji: moodData.emoji,
            label: moodData.label,
            color: moodData.color,
          }
        : null,
    });
  }

  return days;
}

export function getWeekEntries(state) {
  const weekDays = getWeekDays(state);
  return weekDays
    .filter((day) => Boolean(day.entry))
    .map((day) => ({
      date: day.iso,
      dayName: day.shortName,
      ...day.entry,
    }));
}

export function getAllMoodEntries(state) {
  return Object.entries(state.moodEntries).map(([date, entry]) => {
    const parsed = parseDateFromIso(date);
    return {
      date,
      ...entry,
      weekday: parsed ? parsed.getDay() : null,
    };
  });
}

export function getMonthDays(state) {
  const days = [];
  const base = new Date(state.currentMonth);
  const year = base.getFullYear();
  const month = base.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toDateString();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const iso = formatDate(date);
    const entry = state.moodEntries[iso];
    const moodData = entry ? moodLevels[entry.mood] : null;

    days.push({
      iso,
      label: String(day),
      dayName: date.toLocaleDateString('fr-FR', { weekday: 'long' }),
      shortName: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
      displayDate: date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
      }),
      isToday: date.toDateString() === todayStr,
      entry: entry
        ? {
            ...entry,
            emoji: moodData.emoji,
            label: moodData.label,
            color: moodData.color,
          }
        : null,
    });
  }

  return days;
}

export function getMonthEntries(state) {
  return getMonthDays(state)
    .filter((day) => Boolean(day.entry))
    .map((day) => ({
      date: day.iso,
      dayName: day.dayName,
      ...day.entry,
    }));
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
        monthName: new Date(year, month, 1).toLocaleDateString('fr-FR', {
          month: 'short',
        }),
        averageMood: avgMood,
        count: monthEntries.length,
      });
    }
  }
  return entries;
}

function generateMonthSummary(entries, average, totalDays) {
  const averageRounded = Math.round(average);
  const summaryIntro = `Ce mois-ci, vous avez enregistré ${
    entries.length
  } jour${entries.length > 1 ? 's' : ''} sur ${totalDays}. `;

  if (averageRounded >= 4) {
    return (
      summaryIntro +
      `Tendance très positive avec une humeur ${moodLevels[
        averageRounded
      ].label.toLowerCase()}. Continuez ainsi ! 🌟`
    );
  }

  if (averageRounded === 3) {
    return (
      summaryIntro +
      `Un mois équilibré avec des moments variés. Prenez le temps de célébrer vos réussites et de souffler. 🌈`
    );
  }

  return (
    summaryIntro +
    `Mois exigeant avec une humeur moyenne ${moodLevels[
      averageRounded
    ].label.toLowerCase()}. Prenez soin de vous et accordez-vous du repos. 💙`
  );
}

export function computeMonthlyAnalytics(state) {
  const monthDays = getMonthDays(state);
  const entries = getMonthEntries(state);

  if (entries.length === 0) {
    return {
      hasData: false,
      averageLabel: '-',
      bestDayLabel: '-',
      recordedDaysLabel: `0/${monthDays.length}`,
      summary: 'Ajoutez vos humeurs pour analyser votre mois.',
      chartData: buildChartData(monthDays, entries, (day) => day.label),
    };
  }

  const average = entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length;
  const averageMood = moodLevels[Math.round(average)];
  const bestEntry = entries.reduce((best, current) => (current.mood > best.mood ? current : best));
  const bestDate = parseDateFromIso(bestEntry.date);
  const bestDayLabel = `${moodLevels[bestEntry.mood].emoji} ${bestDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })}`;

  return {
    hasData: true,
    averageLabel: `${averageMood.emoji} ${averageMood.label}`,
    bestDayLabel,
    recordedDaysLabel: `${entries.length}/${monthDays.length}`,
    summary: generateMonthSummary(entries, average, monthDays.length),
    chartData: buildChartData(monthDays, entries, (day) => day.label),
  };
}

function getYearMonths(state) {
  const base = new Date(state.currentMonth);
  const year = base.getFullYear();
  const months = [];

  for (let month = 0; month < 12; month++) {
    const firstDay = new Date(year, month, 1);
    const label = firstDay.toLocaleDateString('fr-FR', { month: 'short' });
    const fullLabel = firstDay.toLocaleDateString('fr-FR', { month: 'long' });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const entries = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const iso = formatDate(date);
      const entry = state.moodEntries[iso];
      if (entry) {
        entries.push({
          date: iso,
          ...entry,
        });
      }
    }

    let chartEntry = null;
    if (entries.length > 0) {
      const avg = entries.reduce((sum, item) => sum + item.mood, 0) / entries.length;
      const rounded = Math.round(avg);
      const moodMeta = moodLevels[rounded];
      chartEntry = {
        mood: Number(avg.toFixed(2)),
        emoji: moodMeta.emoji,
        label: moodMeta.label,
        color: moodMeta.color,
      };
    }

    months.push({
      label,
      fullLabel,
      entries,
      entry: chartEntry,
    });
  }

  return months;
}

function generateYearSummary(entries, average, activeMonths) {
  const averageRounded = Math.round(average);
  const summaryIntro = `Cette année compte déjà ${entries.length} jour${
    entries.length > 1 ? 's' : ''
  } enregistrés sur ${activeMonths} mois actifs. `;

  if (averageRounded >= 4) {
    return (
      summaryIntro +
      `Année lumineuse avec une humeur ${moodLevels[
        averageRounded
      ].label.toLowerCase()}. Continuez à capitaliser sur ces moments positifs. ✨`
    );
  }

  if (averageRounded === 3) {
    return (
      summaryIntro +
      `Année équilibrée pour l'instant. Vos humeurs restent stables malgré les variations saisonnières. 🌤️`
    );
  }

  return (
    summaryIntro +
    `Année à améliorer avec une humeur ${moodLevels[
      averageRounded
    ].label.toLowerCase()}. Planifiez des pauses et des moments ressourçants. 💙`
  );
}

export function computeYearlyAnalytics(state) {
  const months = getYearMonths(state);
  const allEntries = months
    .flatMap((month) => month.entries.map((entry) => ({ ...entry, month })))
    .map((item) => ({
      date: item.date,
      mood: item.mood,
      note: item.note || '',
    }));

  const monthsWithData = months.filter((month) => month.entries.length > 0).length;

  if (allEntries.length === 0) {
    return {
      hasData: false,
      averageLabel: '-',
      bestDayLabel: '-',
      recordedDaysLabel: `0/12`,
      summary: 'Enregistrez vos humeurs pour analyser votre année.',
      chartData: buildChartData(months, allEntries, (month) => month.label),
    };
  }

  const average = allEntries.reduce((sum, entry) => sum + entry.mood, 0) / allEntries.length;
  const averageMood = moodLevels[Math.round(average)];

  const bestMonth = months.reduce(
    (best, current) => {
      if (!current.entry) {
        return best;
      }
      if (!best.entry || current.entry.mood > best.entry.mood) {
        return current;
      }
      return best;
    },
    { entry: null }
  );

  const bestDayLabel = bestMonth.entry ? `${bestMonth.entry.emoji} ${bestMonth.fullLabel}` : '-';

  return {
    hasData: true,
    averageLabel: `${averageMood.emoji} ${averageMood.label}`,
    bestDayLabel,
    recordedDaysLabel: `${monthsWithData}/12`,
    summary: generateYearSummary(allEntries, average, monthsWithData),
    chartData: buildChartData(months, allEntries, (month) => month.label),
  };
}

export function getAnalyticsViews(state) {
  const weekDays = getWeekDays(state);
  return {
    week: computeAnalytics(state, weekDays),
    month: computeMonthlyAnalytics(state),
    year: computeYearlyAnalytics(state),
  };
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
      period: 'week',
    };
  }

  const average = entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length;
  const averageMood = moodLevels[Math.round(average)];

  const bestEntry = entries.reduce((best, current) => (current.mood > best.mood ? current : best));
  const bestDate = parseDateFromIso(bestEntry.date);
  const bestDayLabel = `${moodLevels[bestEntry.mood].emoji} ${bestDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
  })}`;

  return {
    hasData: true,
    averageLabel: `${averageMood.emoji} ${averageMood.label}`,
    bestDayLabel,
    recordedDaysLabel: `${entries.length}/7`,
    summary: generateWeekSummary(entries, average),
    chartData: buildChartData(weekDays, entries, (day) => day.shortName),
    period: 'week',
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
      period: 'month',
    };
  }

  const average = entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length;
  const averageMood = moodLevels[Math.round(average)];

  const bestEntry = entries.reduce((best, current) => (current.mood > best.mood ? current : best));
  const bestDate = parseDateFromIso(bestEntry.date);
  const bestDayLabel = `${
    moodLevels[bestEntry.mood].emoji
  } ${bestDate.getDate()} ${bestDate.toLocaleDateString('fr-FR', {
    month: 'long',
  })}`;

  return {
    hasData: true,
    averageLabel: `${averageMood.emoji} ${averageMood.label}`,
    bestDayLabel,
    recordedDaysLabel: `${entries.length}/${daysInMonth}`,
    summary: generateMonthSummary(entries, average, daysInMonth),
    chartData: buildMonthChartData(state, entries),
    period: 'month',
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
      summary: "Ajoutez vos humeurs pour voir un résumé personnalisé de l'année.",
      chartData: buildYearChartData(entries),
      period: 'year',
    };
  }

  const average = entries.reduce((sum, entry) => sum + entry.averageMood, 0) / entries.length;
  const averageMood = moodLevels[Math.round(average)];

  const bestMonth = entries.reduce((best, current) =>
    current.averageMood > best.averageMood ? current : best
  );
  const bestDayLabel = `${
    moodLevels[Math.round(bestMonth.averageMood)].emoji
  } ${bestMonth.monthName}`;

  return {
    hasData: true,
    averageLabel: `${averageMood.emoji} ${averageMood.label}`,
    bestDayLabel,
    recordedDaysLabel: `${entries.length} mois`,
    summary: generateYearSummary(entries, average, 12),
    chartData: buildYearChartData(entries),
    period: 'year',
  };
}

function generateWeekSummary(entries, average) {
  const averageRounded = Math.round(average);
  const moodCounts = {};

  entries.forEach((entry) => {
    moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
  });

  const summaryIntro = `Cette semaine, vous avez enregistré ${
    entries.length
  } jour${entries.length > 1 ? 's' : ''}. `;

  if (averageRounded >= 4) {
    return (
      summaryIntro +
      `Excellente semaine ! Votre humeur moyenne était ${moodLevels[
        averageRounded
      ].label.toLowerCase()}. Continuez sur cette lancée ! 🌟`
    );
  }

  if (averageRounded === 3) {
    return (
      summaryIntro +
      `Semaine équilibrée avec une humeur ${moodLevels[
        averageRounded
      ].label.toLowerCase()}. Il y a eu des hauts et des bas, c'est normal. 🌈`
    );
  }

  return (
    summaryIntro +
    `La semaine a été difficile avec une humeur moyenne ${moodLevels[
      averageRounded
    ].label.toLowerCase()}. N'hésitez pas à prendre soin de vous. 💙`
  );
}

function buildChartData(units, entries, labelSelector) {
  const labels = units.map((unit) =>
    typeof labelSelector === 'function' ? labelSelector(unit) : unit[labelSelector] || ''
  );
  const lineData = units.map((unit) => (unit.entry ? unit.entry.mood : null));
  const lineColors = units.map((unit) => (unit.entry ? unit.entry.color : '#cccccc'));

  const moodCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  entries.forEach((entry) => {
    moodCounts[entry.mood] += 1;
  });

  return {
    line: {
      labels,
      data: lineData,
      colors: lineColors,
    },
    bar: {
      labels: Object.values(moodLevels).map((level) => level.emoji),
      data: Object.keys(moodCounts).map((key) => moodCounts[Number(key)]),
      backgroundColors: Object.values(moodLevels).map((level) => `${level.color}80`),
      borderColors: Object.values(moodLevels).map((level) => level.color),
    },
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
  entries.forEach((entry) => {
    moodCounts[entry.mood] += 1;
  });

  return {
    line: {
      labels: lineLabels,
      data: lineData,
      colors: lineColors,
    },
    bar: {
      labels: Object.values(moodLevels).map((level) => level.emoji),
      data: Object.keys(moodCounts).map((key) => moodCounts[Number(key)]),
      backgroundColors: Object.values(moodLevels).map((level) => `${level.color}80`),
      borderColors: Object.values(moodLevels).map((level) => level.color),
    },
  };
}

function buildYearChartData(entries) {
  const allMonths = [];
  for (let i = 0; i < 12; i++) {
    allMonths.push({
      monthName: new Date(2000, i, 1).toLocaleDateString('fr-FR', {
        month: 'short',
      }),
      averageMood: null,
      color: '#cccccc',
    });
  }

  entries.forEach((entry) => {
    allMonths[entry.month] = {
      monthName: entry.monthName,
      averageMood: entry.averageMood,
      color: moodLevels[Math.round(entry.averageMood)].color,
    };
  });

  const moodCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  entries.forEach((entry) => {
    const rounded = Math.round(entry.averageMood);
    moodCounts[rounded] += 1;
  });

  return {
    line: {
      labels: allMonths.map((m) => m.monthName),
      data: allMonths.map((m) => m.averageMood),
      colors: allMonths.map((m) => m.color),
    },
    bar: {
      labels: Object.values(moodLevels).map((level) => level.emoji),
      data: Object.keys(moodCounts).map((key) => moodCounts[Number(key)]),
      backgroundColors: Object.values(moodLevels).map((level) => `${level.color}80`),
      borderColors: Object.values(moodLevels).map((level) => level.color),
    },
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
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
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
    cells.push(buildCalendarCell(state, date, false, todayStart));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day);
    cells.push(buildCalendarCell(state, date, true, todayStart));
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    const date = new Date(year, monthIndex + 1, nextDay++);
    cells.push(buildCalendarCell(state, date, false, todayStart));
  }

  for (let row = 0; row < cells.length; row += 7) {
    matrix.push(cells.slice(row, row + 7));
  }

  return matrix;
}

function buildCalendarCell(state, date, isCurrentMonth, todayStart) {
  const iso = formatDate(date);
  const entry = state.moodEntries[iso];
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return {
    iso,
    label: date.getDate(),
    isCurrentMonth,
    isToday: dayStart.getTime() === todayStart.getTime(),
    hasMood: Boolean(entry),
    isFuture: dayStart.getTime() > todayStart.getTime(),
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
    timestamp: new Date().toISOString(),
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
        year: 'numeric',
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

const weatherCodeInsights = [
  {
    codes: [0],
    label: 'Grand soleil',
    icon: '☀️',
    modifier: 0.6,
    tooltip: 'Un ciel dégagé favorise souvent une énergie positive et des activités en extérieur.',
  },
  {
    codes: [1, 2],
    label: 'Ciel partiellement nuageux',
    icon: '⛅',
    modifier: 0.3,
    tooltip: 'Quelques nuages mais assez de lumière pour maintenir un bon niveau de motivation.',
  },
  {
    codes: [3],
    label: 'Ciel couvert',
    icon: '☁️',
    modifier: -0.1,
    tooltip: 'Un ciel gris peut amener un léger ralentissement ou une baisse de moral.',
  },
  {
    codes: [45, 48],
    label: 'Brouillard',
    icon: '🌫️',
    modifier: -0.2,
    tooltip: 'La visibilité réduite complique les déplacements et peut fatiguer.',
  },
  {
    codes: [51, 53, 55, 56, 57],
    label: 'Bruine ou pluie fine',
    icon: '🌦️',
    modifier: -0.3,
    tooltip: 'L’humidité persistante influence souvent la motivation à sortir.',
  },
  {
    codes: [61, 63, 65, 80, 81, 82],
    label: 'Pluie modérée',
    icon: '🌧️',
    modifier: -0.4,
    tooltip: 'Les journées pluvieuses demandent plus d’effort pour maintenir une bonne humeur.',
  },
  {
    codes: [66, 67, 71, 73, 75, 77, 85, 86],
    label: 'Neige ou pluie verglaçante',
    icon: '❄️',
    modifier: -0.15,
    tooltip:
      'Les routes glissantes ralentissent le rythme mais peuvent aussi apporter une ambiance cosy.',
  },
  {
    codes: [95, 96, 99],
    label: 'Orages',
    icon: '⛈️',
    modifier: -0.6,
    tooltip: 'Les orages intenses peuvent créer du stress ou limiter les activités extérieures.',
  },
];

function interpretWeatherCode(code) {
  return (
    weatherCodeInsights.find((group) => group.codes.includes(code)) || {
      label: 'Conditions variables',
      icon: '🌤️',
      modifier: 0,
      tooltip: 'Prévision météo incertaine, prudence recommandée.',
    }
  );
}

function clampMood(value) {
  return Math.max(1, Math.min(5, Number(value.toFixed(2))));
}

export async function fetchCityForecast(city) {
  if (!city || !city.trim()) {
    throw new Error('Saisissez une ville valide.');
  }

  const trimmed = city.trim();
  const searchUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    trimmed
  )}&count=1&language=fr&format=json`;
  const searchResponse = await fetch(searchUrl);

  if (!searchResponse.ok) {
    throw new Error('Impossible de contacter le service météo (géocodage).');
  }

  const searchData = await searchResponse.json();
  const found = searchData?.results?.[0];

  if (!found) {
    throw new Error('Ville introuvable. Vérifiez l’orthographe.');
  }

  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${
    found.latitude
  }&longitude=${
    found.longitude
  }&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(
    found.timezone
  )}&forecast_days=7`;
  const forecastResponse = await fetch(forecastUrl);

  if (!forecastResponse.ok) {
    throw new Error('La prévision météo est temporairement indisponible.');
  }

  const forecastData = await forecastResponse.json();
  const daily = forecastData?.daily;

  if (!daily || !daily.time) {
    throw new Error('Aucune donnée météo exploitable.');
  }

  return {
    cityLabel: `${found.name}, ${found.country_code}`,
    timezone: forecastData.timezone,
    days: daily.time.map((date, index) => ({
      date,
      weatherCode: daily.weathercode[index],
      tempMax: daily.temperature_2m_max[index],
      tempMin: daily.temperature_2m_min[index],
    })),
  };
}

function buildBaselineFromHistory(state) {
  const entries = getAllMoodEntries(state);
  if (!entries.length) {
    return {
      baseline: 3,
      weekdayModifiers: {},
    };
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const recentEntries = entries.filter((entry) => {
    const parsed = parseDateFromIso(entry.date);
    return parsed && parsed >= thirtyDaysAgo;
  });

  const pool = recentEntries.length >= 5 ? recentEntries : entries;
  const baseline = pool.reduce((sum, entry) => sum + entry.mood, 0) / pool.length;

  const weekdayTotals = new Array(7).fill(0);
  const weekdayCounts = new Array(7).fill(0);

  pool.forEach((entry) => {
    if (entry.weekday != null) {
      weekdayTotals[entry.weekday] += entry.mood;
      weekdayCounts[entry.weekday] += 1;
    }
  });

  const weekdayModifiers = {};
  weekdayTotals.forEach((total, weekday) => {
    if (weekdayCounts[weekday] > 0) {
      const average = total / weekdayCounts[weekday];
      weekdayModifiers[weekday] = Number((average - baseline).toFixed(2));
    }
  });

  return {
    baseline,
    weekdayModifiers,
  };
}

export function computePredictionFromForecast(state, forecast) {
  const { baseline, weekdayModifiers } = buildBaselineFromHistory(state);
  const baselineMood = moodLevels[Math.round(clampMood(baseline))] || moodLevels[3];

  const points = forecast.days.map((day) => {
    const weather = interpretWeatherCode(day.weatherCode);
    const parsedDate = parseDateFromIso(day.date);
    const weekday = parsedDate ? parsedDate.getDay() : null;
    const weekdayAdjust =
      weekday != null && weekdayModifiers[weekday] ? weekdayModifiers[weekday] : 0;
    const projected = clampMood(baseline + weather.modifier + weekdayAdjust);

    return {
      label: parsedDate
        ? parsedDate.toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
          })
        : day.date,
      date: day.date,
      mood: projected,
      moodLevel: moodLevels[Math.round(projected)] || moodLevels[3],
      weather,
      temp: {
        min: Math.round(day.tempMin),
        max: Math.round(day.tempMax),
      },
    };
  });

  const dominantWeather = points.reduce((acc, point) => {
    if (!acc[point.weather.label]) {
      acc[point.weather.label] = { count: 0, info: point.weather };
    }
    acc[point.weather.label].count += 1;
    return acc;
  }, {});

  const topWeather = Object.values(dominantWeather).sort((a, b) => b.count - a.count)[0];

  const averageProjectedMood = points.reduce((sum, point) => sum + point.mood, 0) / points.length;
  const averageMoodLevel = moodLevels[Math.round(clampMood(averageProjectedMood))] || moodLevels[3];

  const reasons = [
    `Votre humeur de référence est ${
      baselineMood.emoji
    } ${baselineMood.label.toLowerCase()}, calculée à partir des ${
      baselineMood ? 'derniers enregistrements' : 'données disponibles'
    }.`,
    topWeather
      ? `La tendance météo dominante sera ${
          topWeather.info.icon
        } ${topWeather.info.label.toLowerCase()}, ce qui influe de ${
          topWeather.info.modifier > 0 ? '+' : ''
        }${topWeather.info.modifier} sur votre humeur moyenne.`
      : "Les conditions météo sont variées, l'impact sera modéré.",
    `La projection globale prévoit ${
      averageMoodLevel.emoji
    } ${averageMoodLevel.label.toLowerCase()} pour la semaine à venir.`,
  ];

  return {
    baseline: baselineMood,
    points,
    reasons,
  };
}

export function setAnalyticsPeriod(state, period) {
  if (['week', 'month', 'year'].includes(period)) {
    state.analyticsPeriod = period;
    state.analyticsView = period;
  }
}
