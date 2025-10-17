import { reactive, computed, ref, watch } from 'vue';
import {
  moodLevels,
  createInitialState,
  loadSampleData,
  getWeekDays,
  pickQuote,
  getWeekTitle,
  getCalendarMatrix,
  getMonthTitle,
  getMonday,
  navigateWeek,
  navigateMonth,
  toggleTheme,
  saveMood,
  deleteMood,
  getSelectedDateLabel,
  ensureWeekStartForDate,
  getEncouragementMessage,
  getWeekEntries,
  formatDate,
  parseDateFromIso,
  getSystemTheme,
  loadStateFromStorage,
  saveStateToStorage,
  getAnalyticsViews,
  fetchCityForecast,
  setAnalyticsPeriod,
  trainAllModelsAndPredict,
} from '../models/moodModel';

const ANALYTICS_OPTIONS = [
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
  { value: 'year', label: 'Année' },
];

export function createMoodController() {
  const initialTheme = getSystemTheme();
  const state = reactive(createInitialState(initialTheme, true));
  const persisted = loadStateFromStorage();

  if (persisted) {
    if (persisted.moodEntries && typeof persisted.moodEntries === 'object') {
      state.moodEntries = { ...persisted.moodEntries };
    }

    if (persisted.currentWeekStart) {
      const parsedWeek = parseDateFromIso(persisted.currentWeekStart);
      if (parsedWeek) {
        state.currentWeekStart = getMonday(parsedWeek);
      }
    }

    if (persisted.currentMonth) {
      const parsedMonth = parseDateFromIso(persisted.currentMonth);
      if (parsedMonth) {
        state.currentMonth = new Date(parsedMonth.getFullYear(), parsedMonth.getMonth(), 1);
      }
    }

    if (typeof persisted.theme === 'string') {
      state.theme = persisted.theme;
    }

    if (typeof persisted.useSystemTheme === 'boolean') {
      state.useSystemTheme = persisted.useSystemTheme;
    }

    if (
      typeof persisted.analyticsView === 'string' &&
      ANALYTICS_OPTIONS.some((option) => option.value === persisted.analyticsView)
    ) {
      state.analyticsView = persisted.analyticsView;
    }

    if (typeof persisted.predictionCity === 'string') {
      state.prediction.city = persisted.predictionCity;
    }
  } else {
    loadSampleData(state);
  }

  const persistState = () => saveStateToStorage(state);

  persistState();

  const quote = ref(state.quote);

  if (typeof document !== 'undefined') {
    document.title = "Moodflow | Tracker d'humeur";
  }

  const faviconMap = {
    1: '/favicons/mood-1.svg',
    2: '/favicons/mood-2.svg',
    3: '/favicons/mood-3.svg',
    4: '/favicons/mood-4.svg',
    5: '/favicons/mood-5.svg',
  };

  const moodBackgroundMap = {
    light: {
      1: 'linear-gradient(160deg, rgba(226, 232, 240, 0.88), rgba(148, 163, 184, 0.62), rgba(71, 85, 105, 0.72))',
      2: 'linear-gradient(160deg, rgba(248, 236, 229, 0.86), rgba(214, 174, 146, 0.58), rgba(181, 137, 111, 0.68))',
      3: 'linear-gradient(160deg, rgba(255, 248, 223, 0.86), rgba(244, 208, 111, 0.55), rgba(250, 224, 134, 0.66))',
      4: 'linear-gradient(160deg, rgba(224, 255, 244, 0.86), rgba(153, 232, 195, 0.55), rgba(94, 212, 162, 0.66))',
      5: 'linear-gradient(160deg, rgba(219, 234, 254, 0.9), rgba(125, 180, 248, 0.55), rgba(95, 168, 246, 0.66))',
    },
    dark: {
      1: 'linear-gradient(160deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.82), rgba(71, 85, 105, 0.4))',
      2: 'linear-gradient(160deg, rgba(32, 24, 18, 0.94), rgba(67, 43, 30, 0.82), rgba(178, 124, 89, 0.26))',
      3: 'linear-gradient(160deg, rgba(36, 26, 10, 0.94), rgba(88, 61, 18, 0.72), rgba(244, 208, 111, 0.26))',
      4: 'linear-gradient(160deg, rgba(6, 31, 23, 0.96), rgba(17, 76, 61, 0.72), rgba(94, 212, 162, 0.26))',
      5: 'linear-gradient(160deg, rgba(10, 31, 54, 0.96), rgba(29, 78, 216, 0.55), rgba(95, 168, 246, 0.32))',
    },
  };

  const todayIso = formatDate(new Date());
  const todayMood = computed(() => {
    const entry = state.moodEntries[todayIso];
    return entry ? entry.mood : null;
  });

  function updateFavicon(moodValue) {
    if (typeof document === 'undefined') {
      return;
    }

    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'icon');
      document.head.appendChild(link);
    }

    const nextHref = faviconMap[moodValue] || faviconMap[3];
    if (link.getAttribute('href') !== nextHref) {
      link.setAttribute('href', nextHref);
      link.setAttribute('type', 'image/svg+xml');
    }
  }

  function updateMoodBackground(moodValue) {
    if (typeof document === 'undefined' || !document.body) {
      return;
    }

    const themeKey =
      state.theme === 'dark' || document.body.dataset.theme === 'dark' ? 'dark' : 'light';
    const themedGradients = moodBackgroundMap[themeKey] || moodBackgroundMap.light;
    const gradient = themedGradients[moodValue] || themedGradients[3] || moodBackgroundMap.light[3];

    document.body.style.setProperty('--moodflow-background', gradient);

    if (moodValue) {
      document.body.dataset.moodLevel = String(moodValue);
    } else {
      delete document.body.dataset.moodLevel;
    }
  }

  const weekDays = computed(() => getWeekDays(state));
  const analyticsViews = computed(() => getAnalyticsViews(state));
  const analytics = computed(() => {
    const views = analyticsViews.value;
    return views[state.analyticsView] || views.week;
  });
  const analyticsTitle = computed(() => {
    switch (state.analyticsView) {
      case 'month':
        return 'Analytics du mois';
      case 'year':
        return "Analytics de l'année";
      default:
        return 'Analytics de la semaine';
    }
  });
  const weekSummary = computed(() => analytics.value.summary);
  const summaryTitle = computed(() => {
    switch (state.analyticsView) {
      case 'month':
        return 'Résumé du mois';
      case 'year':
        return "Résumé de l'année";
      default:
        return 'Résumé de la semaine';
    }
  });
  const weekTitle = computed(() => getWeekTitle(state));
  const calendarMatrix = computed(() => getCalendarMatrix(state));
  const monthTitle = computed(() => getMonthTitle(state));
  const selectedDateLabel = computed(() => getSelectedDateLabel(state));
  const hasSelectedEntry = computed(() =>
    Boolean(state.selectedDate && state.moodEntries[state.selectedDate])
  );

  let systemThemeQuery = null;
  let removeSystemThemeListener = null;

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    // Keep state.theme aligned with the operating system when the system option is active.
    const applySystemTheme = (event) => {
      if (state.useSystemTheme) {
        state.theme = event.matches ? 'dark' : 'light';
      }
    };

    applySystemTheme(systemThemeQuery);

    if (typeof systemThemeQuery.addEventListener === 'function') {
      systemThemeQuery.addEventListener('change', applySystemTheme);
      removeSystemThemeListener = () =>
        systemThemeQuery.removeEventListener('change', applySystemTheme);
    } else if (typeof systemThemeQuery.addListener === 'function') {
      systemThemeQuery.addListener(applySystemTheme);
      removeSystemThemeListener = () => systemThemeQuery.removeListener(applySystemTheme);
    }

    window.addEventListener('beforeunload', () => {
      if (removeSystemThemeListener) {
        removeSystemThemeListener();
      }
    });
  }

  watch(
    () => state.theme,
    (theme) => {
      document.documentElement.setAttribute('data-color-scheme', theme);
      document.body.dataset.theme = theme;
      updateMoodBackground(todayMood.value);
      persistState();
    },
    { immediate: true }
  );

  watch(
    () => getWeekEntries(state),
    (entries) => {
      const newQuote = pickQuote(entries);
      quote.value = newQuote;
      state.quote = newQuote;
      persistState();
    },
    { immediate: true, deep: true }
  );

  watch(
    todayMood,
    (moodValue) => {
      updateFavicon(moodValue);
      updateMoodBackground(moodValue);
    },
    { immediate: true }
  );

  watch(
    () => state.showMoodModal || state.showCalendarModal,
    (locked) => {
      document.body.style.overflow = locked ? 'hidden' : '';
    },
    { immediate: true }
  );

  let toastTimeout = null;

  function showToast(message, duration = 3000) {
    state.toast.message = message;
    state.toast.visible = true;

    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    toastTimeout = window.setTimeout(() => {
      state.toast.visible = false;
    }, duration);
  }

  function openMoodModal(dateIso) {
    if (!dateIso) {
      return;
    }

    const target = parseDateFromIso(dateIso);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const targetStart = target
      ? new Date(target.getFullYear(), target.getMonth(), target.getDate())
      : null;

    if (!targetStart || targetStart.getTime() > todayStart.getTime()) {
      showToast("Impossible d'ajouter une humeur pour une journée future");
      return;
    }

    state.selectedDate = dateIso;
    const existing = state.moodEntries[dateIso];
    state.moodDraft.mood = existing ? existing.mood : null;
    state.moodDraft.note = existing ? existing.note : '';
    state.showMoodModal = true;
  }

  function closeMoodModal() {
    state.showMoodModal = false;
    state.selectedDate = null;
    state.moodDraft.mood = null;
    state.moodDraft.note = '';
  }

  function setMoodDraftMood(value) {
    state.moodDraft.mood = value;
  }

  function setMoodDraftNote(value) {
    state.moodDraft.note = value;
  }

  function saveSelectedMood() {
    if (!state.selectedDate) {
      showToast('Sélectionnez une date valide');
      return;
    }

    if (!state.moodDraft.mood) {
      showToast('Veuillez sélectionner une humeur');
      return;
    }

    saveMood(state, {
      date: state.selectedDate,
      mood: state.moodDraft.mood,
      note: state.moodDraft.note,
    });
    persistState();

    const dateLabel = getSelectedDateLabel(state);
    closeMoodModal();
    showToast(`Humeur sauvegardée pour ${dateLabel}`);

    const encouragement = getEncouragementMessage(state);
    if (encouragement) {
      window.setTimeout(() => {
        showToast(encouragement, 5000);
      }, 400);
    }
  }

  function deleteSelectedMood() {
    if (!state.selectedDate) {
      closeMoodModal();
      return;
    }

    deleteMood(state, state.selectedDate);
    persistState();
    closeMoodModal();
    showToast('Humeur supprimée');
  }

  function navigateWeekBy(direction) {
    navigateWeek(state, direction);
    persistState();
  }

  function navigateMonthBy(direction) {
    navigateMonth(state, direction);
    persistState();
  }

  function openCalendarModal() {
    state.showCalendarModal = true;
  }

  function closeCalendarModal() {
    state.showCalendarModal = false;
  }

  function focusDate(iso) {
    ensureWeekStartForDate(state, iso);
    const target = parseDateFromIso(iso);
    if (target) {
      state.currentMonth = new Date(target.getFullYear(), target.getMonth(), 1);
    }
    openMoodModal(iso);
    closeCalendarModal();
  }

  function toggleThemePreference() {
    if (state.useSystemTheme) {
      state.useSystemTheme = false;
      toggleTheme(state);
    } else {
      state.useSystemTheme = true;
      state.theme = getSystemTheme();
    }
    persistState();
  }

  function setPredictionCity(city) {
    state.prediction.city = city;
    persistState();
  }

  async function refreshPrediction() {
    const city = state.prediction.city.trim();
    if (!city) {
      showToast('Saisissez une ville pour lancer la prédiction');
      return;
    }

    state.prediction.status = 'loading';
    state.prediction.error = null;

    try {
      const forecast = await fetchCityForecast(city);
      
      // Entraîner les 3 modèles ML et sélectionner le meilleur
      const insights = trainAllModelsAndPredict(state, forecast);

      state.prediction.status = 'success';
      state.prediction.cityLabel = forecast.cityLabel;
      state.prediction.chart = insights.points;
      state.prediction.reasons = insights.reasons;
      state.prediction.baseline = insights.baseline;
      state.prediction.modelMetrics = insights.modelMetrics;
      state.prediction.allModels = insights.allModels;
      state.prediction.selectedModel = 'best';
      state.prediction.lastUpdated = new Date().toISOString();
      persistState();
      
      // Toast avec résultats
      showToast(`🏆 ${insights.modelMetrics.bestModelName} gagne avec R² = ${(insights.modelMetrics.r2 * 100).toFixed(1)}%`);
    } catch (error) {
      console.error(error);
      state.prediction.status = 'error';
      state.prediction.error = error instanceof Error ? error.message : 'Erreur inattendue';
      state.prediction.chart = null;
      state.prediction.reasons = [];
      state.prediction.baseline = null;
      state.prediction.modelMetrics = null;
      state.prediction.allModels = null;
      state.prediction.lastUpdated = null;
    }
  }
  
  function selectPredictionModel(modelName) {
    if (state.prediction.allModels && ['best', 'linear', 'knn', 'tree'].includes(modelName)) {
      state.prediction.selectedModel = modelName;
      
      // Mettre à jour les points affichés selon le modèle sélectionné
      if (modelName === 'best') {
        // Trouver le meilleur modèle
        const models = [
          { key: 'linear', data: state.prediction.allModels.linear },
          { key: 'knn', data: state.prediction.allModels.knn },
          { key: 'tree', data: state.prediction.allModels.tree }
        ];
        const best = models.reduce((best, curr) => curr.data.r2 > best.data.r2 ? curr : best);
        state.prediction.chart = best.data.predictions;
      } else {
        state.prediction.chart = state.prediction.allModels[modelName].predictions;
      }
    }
  }

  function changeAnalyticsPeriod(period) {
    setAnalyticsPeriod(state, period);
    persistState();
  }

  return {
    state,
    moodLevels,
    quote,
    weekDays,
    analytics,
    analyticsTitle,
    weekSummary,
    summaryTitle,
    weekTitle,
    calendarMatrix,
    monthTitle,
    selectedDateLabel,
    hasSelectedEntry,
    openMoodModal,
    closeMoodModal,
    setMoodDraftMood,
    setMoodDraftNote,
    saveSelectedMood,
    deleteSelectedMood,
    navigateWeekBy,
    navigateMonthBy,
    openCalendarModal,
    closeCalendarModal,
    focusDate,
    toggleTheme: toggleThemePreference,
    showToast,
    setPredictionCity,
    refreshPrediction,
    selectPredictionModel,
    changeAnalyticsPeriod,
  };
}
