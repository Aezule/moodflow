export const moodLevels = {
  1: { emoji: '😢', label: 'Très triste', color: '#475569', value: 1 },
  2: { emoji: '😔', label: 'Triste', color: '#b5896f', value: 2 },
  3: { emoji: '😐', label: 'Neutre', color: '#f4d06f', value: 3 },
  4: { emoji: '😊', label: 'Heureux', color: '#5ed4a2', value: 4 },
  5: { emoji: '😄', label: 'Très heureux', color: '#5fa8f6', value: 5 },
};

export const quotes = {
  sad: [
    "Ce n'est pas la force, mais la persévérance, qui fait les grandes œuvres. — Samuel Johnson",
    "Il n'y a point de bonheur sans courage ni de vertu sans combat. — Jean-Jacques Rousseau",
    "Au milieu de l'hiver, j'apprenais enfin qu'il y avait en moi un été invincible. — Albert Camus",
    'Il faut porter du chaos en soi pour accoucher d’une étoile qui danse. — Friedrich Nietzsche',
    "Les grandes douleurs sont muettes. — Sénèque",
    "Le chagrin, moins on en parle, plus il est dévorant. — Voltaire",
    'Même la nuit la plus sombre prendra fin et le soleil se lèvera. — Victor Hugo',
    "Ceux qui souffrent ne sont pas toujours à plaindre. — Honoré de Balzac",
  ],
  neutral: [
    'Le bonheur dépend de nous. — Aristote',
    'La simplicité est la sophistication suprême. — Léonard de Vinci',
    'La vie est un mystère qu’il faut vivre, et non un problème à résoudre. — Mahatma Gandhi',
    'Le vrai bonheur ne dépend d’aucun être, d’aucun objet extérieur. — Dalaï-Lama',
    'Le repos n’est pas oisiveté. — John Lubbock',
    "La patience est amère, mais son fruit est doux. — Jean-Jacques Rousseau",
    'Le temps est un grand maître, il règle bien des choses. — Pierre Corneille',
    "La paix vient de l'intérieur. Ne la cherchez pas à l'extérieur. — Bouddha",
  ],
  happy: [
    'La joie est en tout ; il faut savoir l’extraire. — Confucius',
    'Le rire est le propre de l’homme. — François Rabelais',
    'La vie est un défi à relever, un bonheur à mériter, une aventure à tenter. — Mère Teresa',
    'Le bonheur est parfois caché dans l’inconnu. — Victor Hugo',
    'Rien n’est plus contagieux que l’enthousiasme. — Samuel Taylor Coleridge',
    'La gaieté chasse la mélancolie. — Molière',
    'La gratitude silencieuse ne sert à personne. — Gertrude Stein',
    "Le bonheur est né de l'altruisme et le malheur de l'égoïsme. — Bouddha",
  ],
};

export const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export const shortDayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const STORAGE_KEY = 'moodflow_state_v1';
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
  const today = new Date();
  const sampleEntries = [];
  
  // Paramètres de personnalité réaliste
  const baseHappiness = 3.5;
  const weekdayPattern = [0, -0.3, -0.2, 0.1, 0.2, 0.4, 0.3]; // Dim-Sam
  const seasonalPattern = [-0.2, -0.1, 0.1, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0, -0.1, -0.2]; // Jan-Déc
  
  const notes = [
    'Belle journée',
    'Journée productive',
    'Un peu fatigué',
    'Excellente ambiance',
    'Réunion intéressante',
    'Projet avancé',
    'Journée tranquille',
    'Moment difficile',
    'Super moment avec amis',
    'Travail intense',
    'Repos bien mérité',
    'Découverte enrichissante',
    'Moment de réflexion',
    'Énergie au top',
    'Besoin de pause',
    'Journée équilibrée',
    'Challenge relevé',
    'Moment créatif',
    'Soirée agréable',
    'Matinée motivante',
  ];
  
  // Générer 500 jours avant aujourd'hui
  for (let i = 500; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const weekday = date.getDay();
    const month = date.getMonth();
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    
    // Simuler météo réaliste
    let weatherCode;
    const randomFactor = Math.random();
    
    if (month >= 5 && month <= 8) {
      // Été : plus de soleil
      weatherCode = randomFactor > 0.3 ? 0 : randomFactor > 0.1 ? 1 : 3;
    } else if (month >= 11 || month <= 2) {
      // Hiver : plus de pluie/neige
      weatherCode = randomFactor > 0.5 ? 61 : randomFactor > 0.2 ? 3 : 71;
    } else {
      // Printemps/Automne
      weatherCode = randomFactor > 0.6 ? 1 : randomFactor > 0.3 ? 3 : 61;
    }
    
    const weather = interpretWeatherCode(weatherCode);
    const tempMax = 15 + seasonalPattern[month] * 10 + (Math.random() - 0.5) * 5;
    
    // Calculer une humeur réaliste INCLUANT la météo
    let mood = baseHappiness;
    mood += weekdayPattern[weekday]; // Jour semaine
    mood += seasonalPattern[month]; // Saison
    mood += weather.modifier * 1.5; // MÉTÉO (amplifié)
    mood += (Math.random() - 0.5) * 0.6; // Variation aléatoire
    mood += Math.sin(dayOfYear / 30) * 0.25; // Cycles mensuels
    
    // Influence température
    const tempDiff = Math.abs(tempMax - 20);
    mood -= (tempDiff / 15) * 0.8;
    
    // Clamp entre 1 et 5 (garder décimales)
    mood = Math.max(1, Math.min(5, mood));
    mood = Number(mood.toFixed(2));
    
    // Sélectionner une note aléatoire (80% du temps seulement)
    const hasNote = Math.random() > 0.2;
    const note = hasNote ? notes[Math.floor(Math.random() * notes.length)] : '';
    
    sampleEntries.push({
      date: formatDate(date),
      mood: mood,
      note: note,
    });
  }
  
  console.log(`📊 Génération de ${sampleEntries.length} jours d'humeurs pré-remplies`);

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
    const moodData = entry ? moodLevels[Math.round(entry.mood)] : null;

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
    const moodData = entry ? moodLevels[Math.round(entry.mood)] : null;

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
  const bestDayLabel = `${moodLevels[Math.round(bestEntry.mood)].emoji} ${bestDate.toLocaleDateString('fr-FR', {
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
  const bestDayLabel = `${moodLevels[Math.round(bestEntry.mood)].emoji} ${bestDate.toLocaleDateString('fr-FR', {
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
    moodLevels[Math.round(bestEntry.mood)].emoji
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
    const roundedMood = Math.round(entry.mood);
    moodCounts[roundedMood] = (moodCounts[roundedMood] || 0) + 1;
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
    const roundedMood = Math.round(entry.mood);
    if (roundedMood >= 1 && roundedMood <= 5) {
      moodCounts[roundedMood] += 1;
    }
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
      lineColors.push(moodLevels[Math.round(entry.mood)].color);
    } else {
      lineData.push(null);
      lineColors.push('#cccccc');
    }
  }

  const moodCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  entries.forEach((entry) => {
    const roundedMood = Math.round(entry.mood);
    moodCounts[roundedMood] = (moodCounts[roundedMood] || 0) + 1;
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

// ============================================================================
// 🤖 MACHINE LEARNING - RÉGRESSION LINÉAIRE POUR PRÉDICTION D'HUMEUR
// ============================================================================

/**
 * Génère des données d'entraînement réalistes pour le ML
 * Simule 500 jours d'humeurs avec patterns réalistes
 */
export function generateTrainingData() {
  const trainingData = [];
  const today = new Date();
  
  // Paramètres de personnalité simulée
  const baseHappiness = 3.5; // Humeur de base
  const weekdayPattern = [0, -0.3, -0.2, 0.1, 0.2, 0.4, 0.3]; // Dim-Sam (weekend meilleur)
  const seasonalPattern = [
    -0.2, -0.1, 0.1, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0, -0.1, -0.2
  ]; // Jan-Déc (été meilleur, hiver plus difficile)
  
  // Générer 500 jours de données (~16 mois)
  for (let i = 500; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const weekday = date.getDay();
    const month = date.getMonth();
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    
    // Simuler code météo réaliste basé sur la saison
    let weatherCode;
    const randomFactor = Math.random();
    
    if (month >= 5 && month <= 8) {
      // Été : 70% soleil, 20% nuageux, 10% couvert
      weatherCode = randomFactor > 0.3 ? 0 : randomFactor > 0.1 ? 1 : 3;
    } else if (month >= 11 || month <= 2) {
      // Hiver : 50% pluie, 30% couvert, 20% neige
      weatherCode = randomFactor > 0.5 ? 61 : randomFactor > 0.2 ? 3 : 71;
    } else {
      // Printemps/Automne : 40% nuageux, 30% couvert, 30% pluie
      weatherCode = randomFactor > 0.6 ? 1 : randomFactor > 0.3 ? 3 : 61;
    }
    
    const weather = interpretWeatherCode(weatherCode);
    const tempMax = 15 + seasonalPattern[month] * 10 + (Math.random() - 0.5) * 5;
    const tempMin = tempMax - 5 - Math.random() * 3;
    
    // Calculer l'humeur réelle avec formule complexe
    let mood = baseHappiness;
    mood += weekdayPattern[weekday]; // -0.3 à +0.4
    mood += seasonalPattern[month]; // -0.2 à +0.5
    mood += weather.modifier * 1.5; // Impact météo amplifié
    mood += (Math.random() - 0.5) * 0.6; // Bruit aléatoire ±0.3
    mood += Math.sin(dayOfYear / 30) * 0.25; // Cycles mensuels
    
    // Influence de la température (optimum autour de 20°C)
    const tempOptimum = 20;
    const tempDiff = Math.abs(tempMax - tempOptimum);
    mood -= (tempDiff / 15) * 0.8; // Impact température amplifié
    
    // Clamp entre 1 et 5
    mood = Math.max(1, Math.min(5, mood));
    
    trainingData.push({
      date: formatDate(date),
      mood: Number(mood.toFixed(2)),
      weekday,
      month,
      dayOfYear,
      weatherCode,
      weatherModifier: weather.modifier,
      tempMax: Number(tempMax.toFixed(1)),
      tempMin: Number(tempMin.toFixed(1)),
      seasonFactor: Number(Math.sin((dayOfYear / 365) * 2 * Math.PI).toFixed(2)),
    });
  }
  
  return trainingData;
}

/**
 * K-Nearest Neighbors pour régression
 * Prédit basé sur les K exemples les plus similaires
 */
class KNNRegressor {
  constructor(k = 5) {
    this.k = k;
    this.X_train = null;
    this.y_train = null;
    this.r2Score = null;
    this.meanSquaredError = null;
  }
  
  fit(X, y) {
    this.X_train = X;
    this.y_train = y;
    
    // Calculer métriques sur le training set (avec leave-one-out)
    const predictions = X.map((_, i) => {
      const X_temp = X.filter((_, idx) => idx !== i);
      const y_temp = y.filter((_, idx) => idx !== i);
      return this._predictOne(X[i], X_temp, y_temp);
    });
    
    this._calculateMetrics(y, predictions);
    return this;
  }
  
  predict(X) {
    if (!this.X_train) {
      throw new Error("Modèle non entraîné. Appelez fit() d'abord.");
    }
    
    return X.map(x => this._predictOne(x, this.X_train, this.y_train));
  }
  
  _predictOne(x, X_train, y_train) {
    // Calculer distances euclidiennes
    const distances = X_train.map((x_train, i) => ({
      distance: this._euclideanDistance(x, x_train),
      value: y_train[i]
    }));
    
    // Trier et prendre les K plus proches
    distances.sort((a, b) => a.distance - b.distance);
    const nearest = distances.slice(0, this.k);
    
    // Moyenne pondérée (poids = 1/distance)
    let weightedSum = 0;
    let totalWeight = 0;
    
    nearest.forEach(n => {
      const weight = n.distance === 0 ? 1000 : 1 / (n.distance + 1e-5);
      weightedSum += n.value * weight;
      totalWeight += weight;
    });
    
    return weightedSum / totalWeight;
  }
  
  _euclideanDistance(a, b) {
    return Math.sqrt(
      a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
    );
  }
  
  _calculateMetrics(y_true, y_pred) {
    const n = y_true.length;
    const mean_y = y_true.reduce((a, b) => a + b, 0) / n;
    
    const mse = y_true.reduce((sum, y, i) => {
      return sum + Math.pow(y - y_pred[i], 2);
    }, 0) / n;
    
    const ss_tot = y_true.reduce((sum, y) => {
      return sum + Math.pow(y - mean_y, 2);
    }, 0);
    
    const ss_res = y_true.reduce((sum, y, i) => {
      return sum + Math.pow(y - y_pred[i], 2);
    }, 0);
    
    this.meanSquaredError = mse;
    this.r2Score = 1 - ss_res / ss_tot;
  }
}

/**
 * Decision Tree pour régression
 * Arbre de décision binaire
 */
class DecisionTreeRegressor {
  constructor(maxDepth = 5, minSamplesSplit = 10) {
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
    this.tree = null;
    this.r2Score = null;
    this.meanSquaredError = null;
  }
  
  fit(X, y) {
    this.tree = this._buildTree(X, y, 0);
    
    // Calculer métriques
    const predictions = this.predict(X);
    this._calculateMetrics(y, predictions);
    
    return this;
  }
  
  predict(X) {
    if (!this.tree) {
      throw new Error("Modèle non entraîné. Appelez fit() d'abord.");
    }
    
    return X.map(x => this._predictOne(x, this.tree));
  }
  
  _buildTree(X, y, depth) {
    const n = X.length;
    
    // Conditions d'arrêt
    if (depth >= this.maxDepth || n < this.minSamplesSplit) {
      return {
        type: 'leaf',
        value: y.reduce((a, b) => a + b, 0) / n
      };
    }
    
    // Trouver le meilleur split
    const bestSplit = this._findBestSplit(X, y);
    
    if (!bestSplit || bestSplit.gain < 0.01) {
      return {
        type: 'leaf',
        value: y.reduce((a, b) => a + b, 0) / n
      };
    }
    
    // Séparer les données
    const leftIndices = [];
    const rightIndices = [];
    
    X.forEach((x, i) => {
      if (x[bestSplit.featureIndex] <= bestSplit.threshold) {
        leftIndices.push(i);
      } else {
        rightIndices.push(i);
      }
    });
    
    return {
      type: 'node',
      featureIndex: bestSplit.featureIndex,
      threshold: bestSplit.threshold,
      left: this._buildTree(
        leftIndices.map(i => X[i]),
        leftIndices.map(i => y[i]),
        depth + 1
      ),
      right: this._buildTree(
        rightIndices.map(i => X[i]),
        rightIndices.map(i => y[i]),
        depth + 1
      )
    };
  }
  
  _findBestSplit(X, y) {
    const numFeatures = X[0].length;
    let bestGain = -Infinity;
    let bestSplit = null;
    
    const variance = this._variance(y);
    
    // Essayer chaque feature
    for (let featureIdx = 0; featureIdx < numFeatures; featureIdx++) {
      const values = X.map(x => x[featureIdx]);
      const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
      
      // Essayer chaque threshold
      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
        
        const leftIndices = [];
        const rightIndices = [];
        
        X.forEach((x, idx) => {
          if (x[featureIdx] <= threshold) {
            leftIndices.push(idx);
          } else {
            rightIndices.push(idx);
          }
        });
        
        if (leftIndices.length === 0 || rightIndices.length === 0) continue;
        
        const leftY = leftIndices.map(i => y[i]);
        const rightY = rightIndices.map(i => y[i]);
        
        // Calculer gain (réduction de variance)
        const leftVar = this._variance(leftY);
        const rightVar = this._variance(rightY);
        const weightedVar = 
          (leftY.length / y.length) * leftVar +
          (rightY.length / y.length) * rightVar;
        
        const gain = variance - weightedVar;
        
        if (gain > bestGain) {
          bestGain = gain;
          bestSplit = { featureIndex: featureIdx, threshold, gain };
        }
      }
    }
    
    return bestSplit;
  }
  
  _predictOne(x, node) {
    if (node.type === 'leaf') {
      return node.value;
    }
    
    if (x[node.featureIndex] <= node.threshold) {
      return this._predictOne(x, node.left);
    } else {
      return this._predictOne(x, node.right);
    }
  }
  
  _variance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }
  
  _calculateMetrics(y_true, y_pred) {
    const n = y_true.length;
    const mean_y = y_true.reduce((a, b) => a + b, 0) / n;
    
    const mse = y_true.reduce((sum, y, i) => {
      return sum + Math.pow(y - y_pred[i], 2);
    }, 0) / n;
    
    const ss_tot = y_true.reduce((sum, y) => {
      return sum + Math.pow(y - mean_y, 2);
    }, 0);
    
    const ss_res = y_true.reduce((sum, y, i) => {
      return sum + Math.pow(y - y_pred[i], 2);
    }, 0);
    
    this.meanSquaredError = mse;
    this.r2Score = 1 - ss_res / ss_tot;
  }
}

/**
 * Classe de régression linéaire multivariée
 * Implémentation from scratch (pas de lib externe)
 * Formule: y = β₀ + β₁x₁ + β₂x₂ + ... + βₙxₙ
 */
class LinearRegression {
  constructor() {
    this.coefficients = null;
    this.intercept = null;
    this.r2Score = null;
    this.meanSquaredError = null;
  }
  
  /**
   * Entraîne le modèle avec la méthode des moindres carrés ordinaires
   * β = (X'X)⁻¹X'y
   */
  fit(X, y) {
    
    // Ajouter colonne de 1 pour l'intercept
    const X_with_intercept = X.map((row) => [1, ...row]);
    
    // Calcul matriciel: β = (X'X)⁻¹X'y
    const XT = this._transpose(X_with_intercept);
    const XTX = this._matmul(XT, X_with_intercept);
    const XTX_inv = this._inverse(XTX);
    const XTy = this._matvecmul(XT, y);
    const beta = this._matvecmul(XTX_inv, XTy);
    
    this.intercept = beta[0];
    this.coefficients = beta.slice(1);
    
    // Calculer métriques de performance
    const predictions = this.predict(X);
    this._calculateMetrics(y, predictions);
    
    return this;
  }
  
  /**
   * Prédit les valeurs pour de nouvelles données
   */
  predict(X) {
    if (!this.coefficients) {
      throw new Error("Modèle non entraîné. Appelez fit() d'abord.");
    }
    
    return X.map((row) => {
      let prediction = this.intercept;
      for (let i = 0; i < row.length; i++) {
        prediction += this.coefficients[i] * row[i];
      }
      return prediction;
    });
  }
  
  /**
   * Calcule R² et MSE pour évaluer la performance
   */
  _calculateMetrics(y_true, y_pred) {
    const n = y_true.length;
    const mean_y = y_true.reduce((a, b) => a + b, 0) / n;
    
    // MSE = moyenne des erreurs au carré
    const mse = y_true.reduce((sum, y, i) => {
      return sum + Math.pow(y - y_pred[i], 2);
    }, 0) / n;
    
    // R² = 1 - (SS_res / SS_tot)
    const ss_tot = y_true.reduce((sum, y) => {
      return sum + Math.pow(y - mean_y, 2);
    }, 0);
    
    const ss_res = y_true.reduce((sum, y, i) => {
      return sum + Math.pow(y - y_pred[i], 2);
    }, 0);
    
    const r2 = 1 - ss_res / ss_tot;
    
    this.meanSquaredError = mse;
    this.r2Score = r2;
  }
  
  // ===== Utilitaires d'algèbre linéaire =====
  
  _transpose(matrix) {
    return matrix[0].map((_, i) => matrix.map((row) => row[i]));
  }
  
  _matmul(A, B) {
    const result = [];
    for (let i = 0; i < A.length; i++) {
      result[i] = [];
      for (let j = 0; j < B[0].length; j++) {
        result[i][j] = 0;
        for (let k = 0; k < A[0].length; k++) {
          result[i][j] += A[i][k] * B[k][j];
        }
      }
    }
    return result;
  }
  
  _matvecmul(matrix, vector) {
    return matrix.map((row) => row.reduce((sum, val, i) => sum + val * vector[i], 0));
  }
  
  _inverse(matrix) {
    const n = matrix.length;
    const identity = Array(n)
      .fill(0)
      .map((_, i) => Array(n).fill(0).map((_, j) => (i === j ? 1 : 0)));
    
    const augmented = matrix.map((row, i) => [...row, ...identity[i]]);
    
    // Élimination de Gauss-Jordan pour inverser la matrice
    for (let i = 0; i < n; i++) {
      // Pivot partiel
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      
      const pivot = augmented[i][i];
      if (Math.abs(pivot) < 1e-10) continue;
      
      // Normaliser la ligne du pivot
      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= pivot;
      }
      
      // Éliminer la colonne
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = augmented[k][i];
          for (let j = 0; j < 2 * n; j++) {
            augmented[k][j] -= factor * augmented[i][j];
          }
        }
      }
    }
    
    return augmented.map((row) => row.slice(n));
  }
}

/**
 * Calcule le Mean Squared Error
 */
function calculateMSE(y_true, y_pred) {
  const n = y_true.length;
  return y_true.reduce((sum, y, i) => {
    return sum + Math.pow(y - y_pred[i], 2);
  }, 0) / n;
}

/**
 * Calcule le R² Score
 */
function calculateR2(y_true, y_pred) {
  const n = y_true.length;
  const mean_y = y_true.reduce((a, b) => a + b, 0) / n;
  
  const ss_tot = y_true.reduce((sum, y) => {
    return sum + Math.pow(y - mean_y, 2);
  }, 0);
  
  const ss_res = y_true.reduce((sum, y, i) => {
    return sum + Math.pow(y - y_pred[i], 2);
  }, 0);
  
  return 1 - ss_res / ss_tot;
}

/**
 * Entraîne les 3 modèles et sélectionne le meilleur
 * @param {Object} state - État de l'application
 * @param {Object} forecast - Prévisions météo de l'API
 * @returns {Object} Résultats des 3 modèles + meilleur
 */
export function trainAllModelsAndPredict(state, forecast) {
  console.log('🤖 === ENTRAÎNEMENT DES 3 MODÈLES ML ===');
  
  // 1. GÉNÉRER LES DONNÉES D'ENTRAÎNEMENT
  // On utilise TOUJOURS les données simulées car elles incluent la météo
  // Les vraies données utilisateur n'ont pas l'historique météo
  console.log('🎲 Génération de 501 jours de données simulées avec météo');
  const trainingData = generateTrainingData();
  
  console.log(`✅ ${trainingData.length} exemples d'entraînement générés`);
  
  // 2. PRÉPARER LES FEATURES (X) ET LABELS (y)
  const X = trainingData.map((d) => [
    d.weekday / 6,
    d.month / 11,
    d.weatherModifier,
    d.seasonFactor,
    (d.tempMax - 10) / 20,
    d.dayOfYear / 365,
  ]);
  
  const y = trainingData.map((d) => d.mood);
  
  // 3. SPLIT TEMPOREL TRAIN/TEST (80/20)
  const splitRatio = 0.8;
  const splitIndex = Math.floor(X.length * splitRatio);
  
  const X_train = X.slice(0, splitIndex);
  const y_train = y.slice(0, splitIndex);
  const X_test = X.slice(splitIndex);
  const y_test = y.slice(splitIndex);
  
  
  // 4. ENTRAÎNER LES 3 MODÈLES
  console.log('\n📚 ENTRAÎNEMENT DES MODÈLES...');
  
  const startTime = performance.now();
  
  // Modèle 1: Régression Linéaire
  console.log('1️⃣ Régression Linéaire...');
  const linearModel = new LinearRegression();
  linearModel.fit(X_train, y_train);
  const linearTestPred = linearModel.predict(X_test);
  const linearTestR2 = calculateR2(y_test, linearTestPred);
  const linearTestMSE = calculateMSE(y_test, linearTestPred);
  console.log(`   Train: R²=${(linearModel.r2Score * 100).toFixed(1)}% | Test: R²=${(linearTestR2 * 100).toFixed(1)}% MSE=${linearTestMSE.toFixed(3)}`);
  
  // Modèle 2: KNN
  console.log('2️⃣ K-Nearest Neighbors (k=5)...');
  const knnModel = new KNNRegressor(5);
  knnModel.fit(X_train, y_train);
  const knnTestPred = knnModel.predict(X_test);
  const knnTestR2 = calculateR2(y_test, knnTestPred);
  const knnTestMSE = calculateMSE(y_test, knnTestPred);
  console.log(`   Train: R²=${(knnModel.r2Score * 100).toFixed(1)}% | Test: R²=${(knnTestR2 * 100).toFixed(1)}% MSE=${knnTestMSE.toFixed(3)}`);
  
  // Modèle 3: Decision Tree
  console.log('3️⃣ Decision Tree (depth=5)...');
  const treeModel = new DecisionTreeRegressor(5, 10);
  treeModel.fit(X_train, y_train);
  const treeTestPred = treeModel.predict(X_test);
  const treeTestR2 = calculateR2(y_test, treeTestPred);
  const treeTestMSE = calculateMSE(y_test, treeTestPred);
  console.log(`   Train: R²=${(treeModel.r2Score * 100).toFixed(1)}% | Test: R²=${(treeTestR2 * 100).toFixed(1)}% MSE=${treeTestMSE.toFixed(3)}`);
  
  const trainingTime = performance.now() - startTime;
  console.log(`\n⏱️ Temps total: ${trainingTime.toFixed(0)}ms`);
  
  // 4. PRÉDIRE AVEC LES 3 MODÈLES
  const todayDate = new Date();
  
  const prepareFeaturesForDay = (day, i) => {
    const date = new Date(todayDate);
    date.setDate(todayDate.getDate() + i);
    
    const weekday = date.getDay();
    const month = date.getMonth();
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    const seasonFactor = Math.sin((dayOfYear / 365) * 2 * Math.PI);
    const weather = interpretWeatherCode(day.weatherCode);
    
    return {
      features: [
        weekday / 6,
        month / 11,
        weather.modifier,
        seasonFactor,
        (day.tempMax - 10) / 20,
        dayOfYear / 365,
      ],
      date: parseDateFromIso(day.date),
      weather,
      temp: { min: Math.round(day.tempMin), max: Math.round(day.tempMax) }
    };
  };
  
  const linearPredictions = [];
  const knnPredictions = [];
  const treePredictions = [];
  
  forecast.days.forEach((day, i) => {
    const { features, date, weather, temp } = prepareFeaturesForDay(day, i);
    
    const linearMood = clampMood(linearModel.predict([features])[0]);
    const knnMood = clampMood(knnModel.predict([features])[0]);
    const treeMood = clampMood(treeModel.predict([features])[0]);
    
    const label = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
    
    linearPredictions.push({
      label, date: day.date, mood: linearMood,
      moodLevel: moodLevels[Math.round(linearMood)] || moodLevels[3],
      weather, temp
    });
    
    knnPredictions.push({
      label, date: day.date, mood: knnMood,
      moodLevel: moodLevels[Math.round(knnMood)] || moodLevels[3],
      weather, temp
    });
    
    treePredictions.push({
      label, date: day.date, mood: treeMood,
      moodLevel: moodLevels[Math.round(treeMood)] || moodLevels[3],
      weather, temp
    });
  });
  
  // 5. DÉTERMINER LE MEILLEUR MODÈLE (basé sur R² de TEST)
  const models = [
    { 
      name: 'Régression Linéaire', 
      trainR2: linearModel.r2Score, 
      testR2: linearTestR2,
      trainMSE: linearModel.meanSquaredError,
      testMSE: linearTestMSE,
      predictions: linearPredictions, 
      model: linearModel 
    },
    { 
      name: 'K-Nearest Neighbors', 
      trainR2: knnModel.r2Score, 
      testR2: knnTestR2,
      trainMSE: knnModel.meanSquaredError,
      testMSE: knnTestMSE,
      predictions: knnPredictions, 
      model: knnModel 
    },
    { 
      name: 'Decision Tree', 
      trainR2: treeModel.r2Score, 
      testR2: treeTestR2,
      trainMSE: treeModel.meanSquaredError,
      testMSE: treeTestMSE,
      predictions: treePredictions, 
      model: treeModel 
    }
  ];
  
  // Sélection basée sur R² de TEST (plus fiable que le train)
  const bestModel = models.reduce((best, current) => 
    current.testR2 > best.testR2 ? current : best
  );
  
  console.log(`\n🏆 MEILLEUR MODÈLE (Test R²): ${bestModel.name}`);
  console.log(`   Test R²: ${(bestModel.testR2 * 100).toFixed(1)}%`);
  console.log(`   Écart Train-Test: ${Math.abs((bestModel.trainR2 - bestModel.testR2) * 100).toFixed(1)}% ${Math.abs(bestModel.trainR2 - bestModel.testR2) < 0.05 ? '✅ Bon' : '⚠️ Overfitting'}`);
  
  // 6. PRÉPARER LES RÉSULTATS
  const featureNames = [
    'Jour de la semaine',
    'Mois/Saison',
    'Conditions météo',
    'Cycle saisonnier',
    'Température',
    'Tendance temporelle',
  ];
  
  // Feature importances (seulement pour linear)
  const importances = linearModel.coefficients
    .map((coef, i) => ({
      name: featureNames[i],
      impact: Math.abs(coef),
      value: coef,
    }))
    .sort((a, b) => b.impact - a.impact);
  
  const avgPrediction = bestModel.predictions.reduce((sum, p) => sum + p.mood, 0) / 7;
  const avgMoodLevel = moodLevels[Math.round(avgPrediction)] || moodLevels[3];
  
  const reasons = [
    `🏆 Meilleur modèle: ${bestModel.name} avec Test R² = ${(bestModel.testR2 * 100).toFixed(1)}%`,
    `📊 Comparaison (Test R²): Linear=${(models[0].testR2 * 100).toFixed(1)}%, KNN=${(models[1].testR2 * 100).toFixed(1)}%, Tree=${(models[2].testR2 * 100).toFixed(1)}%`,
    `🎯 Prédiction moyenne: ${avgMoodLevel.emoji} ${avgMoodLevel.label} (${avgPrediction.toFixed(2)}/5)`,
  ];
  
  return {
    points: bestModel.predictions,
    reasons,
    baseline: moodLevels[Math.round(trainingData[trainingData.length - 1].mood)] || moodLevels[3],
    modelMetrics: {
      trainR2: bestModel.trainR2,
      testR2: bestModel.testR2,
      trainMSE: bestModel.trainMSE,
      testMSE: bestModel.testMSE,
      testRMSE: Math.sqrt(bestModel.testMSE),
      trainingSize: X_train.length,
      testSize: X_test.length,
      trainingTime: trainingTime,
      bestModelName: bestModel.name,
    },
    allModels: {
      linear: {
        name: 'Régression Linéaire',
        predictions: linearPredictions,
        trainR2: linearModel.r2Score,
        testR2: linearTestR2,
        trainMSE: linearModel.meanSquaredError,
        testMSE: linearTestMSE,
        testRMSE: Math.sqrt(linearTestMSE),
        coefficients: linearModel.coefficients,
        intercept: linearModel.intercept,
        featureImportances: importances,
      },
      knn: {
        name: 'K-Nearest Neighbors (k=5)',
        predictions: knnPredictions,
        trainR2: knnModel.r2Score,
        testR2: knnTestR2,
        trainMSE: knnModel.meanSquaredError,
        testMSE: knnTestMSE,
        testRMSE: Math.sqrt(knnTestMSE),
        k: knnModel.k,
      },
      tree: {
        name: 'Decision Tree (depth=5)',
        predictions: treePredictions,
        trainR2: treeModel.r2Score,
        testR2: treeTestR2,
        trainMSE: treeModel.meanSquaredError,
        testMSE: treeTestMSE,
        testRMSE: Math.sqrt(treeTestMSE),
        maxDepth: treeModel.maxDepth,
      },
    },
  };
}

/**
 * Entraîne un modèle ML et génère des prédictions (LEGACY - garde pour compatibilité)
 * @param {Object} state - État de l'application
 * @param {Object} forecast - Prévisions météo de l'API
 * @returns {Object} Prédictions avec métriques ML
 */
export function trainAndPredictWithML(state, forecast) {
  console.log('🤖 === DÉMARRAGE ENTRAÎNEMENT ML ===');
  
  // 1. GÉNÉRER LES DONNÉES D'ENTRAÎNEMENT
  let trainingData;
  if (Object.keys(state.moodEntries).length > 30) {
    console.log('📊 Utilisation des vraies données utilisateur');
    trainingData = getAllMoodEntries(state).map((entry) => {
      const date = parseDateFromIso(entry.date);
      const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
      return {
        ...entry,
        weekday: date.getDay(),
        month: date.getMonth(),
        dayOfYear,
        weatherModifier: 0,
        tempMax: 20,
        tempMin: 15,
        seasonFactor: Math.sin((dayOfYear / 365) * 2 * Math.PI),
      };
    });
  } else {
    console.log('🎲 Génération de données simulées');
    trainingData = generateTrainingData();
  }
  
  console.log(`✅ ${trainingData.length} exemples générés`);
  console.log('📋 Exemple de données:', trainingData[0]);
  
  // 2. PRÉPARER LES FEATURES (X) ET LABELS (y)
  const X = trainingData.map((d) => [
    d.weekday / 6, // Feature 1: Jour semaine (normalisé 0-1)
    d.month / 11, // Feature 2: Mois (normalisé 0-1)
    d.weatherModifier, // Feature 3: Impact météo (-0.6 à +0.6)
    d.seasonFactor, // Feature 4: Saison (-1 à +1)
    (d.tempMax - 10) / 20, // Feature 5: Température (normalisé)
    d.dayOfYear / 365, // Feature 6: Jour de l'année (0-1)
  ]);
  
  const y = trainingData.map((d) => d.mood);
  
  console.log('🔢 Features shape:', `${X.length} x ${X[0].length}`);
  console.log('🎯 Target shape:', y.length);
  
  // 3. ENTRAÎNER LE MODÈLE
  console.log('⚙️ Entraînement du modèle...');
  const model = new LinearRegression();
  model.fit(X, y);
  
  console.log('✅ MODÈLE ENTRAÎNÉ !');
  console.log(`📈 R² Score: ${(model.r2Score * 100).toFixed(2)}%`);
  console.log(`📉 MSE: ${model.meanSquaredError.toFixed(4)}`);
  console.log('🎯 Intercept:', model.intercept.toFixed(3));
  console.log('🎯 Coefficients:', model.coefficients.map((c) => c.toFixed(3)));
  
  // 4. FAIRE DES PRÉDICTIONS POUR LES 7 PROCHAINS JOURS
  const todayDate = new Date();
  const predictions = forecast.days.map((day, i) => {
    const date = new Date(todayDate);
    date.setDate(todayDate.getDate() + i);
    
    const weekday = date.getDay();
    const month = date.getMonth();
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    const seasonFactor = Math.sin((dayOfYear / 365) * 2 * Math.PI);
    
    const weather = interpretWeatherCode(day.weatherCode);
    
    // Créer le vecteur de features pour ce jour
    const features = [
      weekday / 6,
      month / 11,
      weather.modifier,
      seasonFactor,
      (day.tempMax - 10) / 20,
      dayOfYear / 365,
    ];
    
    // PRÉDIRE avec le modèle entraîné
    const [predictedMood] = model.predict([features]);
    const clampedMood = clampMood(predictedMood);
    
    const parsedDate = parseDateFromIso(day.date);
    
    return {
      label: parsedDate.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
      }),
      date: day.date,
      mood: clampedMood,
      moodLevel: moodLevels[Math.round(clampedMood)] || moodLevels[3],
      weather,
      temp: {
        min: Math.round(day.tempMin),
        max: Math.round(day.tempMax),
      },
    };
  });
  
  // 5. ANALYSER L'IMPORTANCE DES FEATURES
  const featureNames = [
    'Jour de la semaine',
    'Mois/Saison',
    'Conditions météo',
    'Cycle saisonnier',
    'Température',
    'Tendance temporelle',
  ];
  
  const importances = model.coefficients
    .map((coef, i) => ({
      name: featureNames[i],
      impact: Math.abs(coef),
      value: coef,
    }))
    .sort((a, b) => b.impact - a.impact);
  
  const avgPrediction = predictions.reduce((sum, p) => sum + p.mood, 0) / predictions.length;
  const avgMoodLevel = moodLevels[Math.round(avgPrediction)] || moodLevels[3];
  
  // 6. GÉNÉRER LES EXPLICATIONS
  const reasons = [
    `🤖 Modèle ML entraîné sur ${trainingData.length} jours avec R² = ${(model.r2Score * 100).toFixed(1)}% (précision: ${model.r2Score > 0.7 ? 'excellente' : model.r2Score > 0.5 ? 'bonne' : 'correcte'})`,
    `🎯 Top 3 facteurs: ${importances[0].name} (${importances[0].value > 0 ? '+' : ''}${importances[0].value.toFixed(2)}), ${importances[1].name} (${importances[1].value > 0 ? '+' : ''}${importances[1].value.toFixed(2)}), ${importances[2].name} (${importances[2].value > 0 ? '+' : ''}${importances[2].value.toFixed(2)})`,
    `📊 Prédiction moyenne: ${avgMoodLevel.emoji} ${avgMoodLevel.label} (${avgPrediction.toFixed(2)}/5) - Erreur moyenne: ±${Math.sqrt(model.meanSquaredError).toFixed(2)}`,
  ];
  
  console.log('🎉 Prédictions générées:', predictions);
  
  return {
    points: predictions,
    reasons,
    baseline:
      moodLevels[Math.round(trainingData[trainingData.length - 1].mood)] || moodLevels[3],
    modelMetrics: {
      r2: model.r2Score,
      mse: model.meanSquaredError,
      rmse: Math.sqrt(model.meanSquaredError),
      coefficients: model.coefficients,
      intercept: model.intercept,
      featureImportances: importances,
      trainingSize: trainingData.length,
    },
  };
}
