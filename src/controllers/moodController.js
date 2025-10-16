import { reactive, computed, ref, watch } from 'vue';
import {
  moodLevels,
  createInitialState,
  loadSampleData,
  getWeekDays,
  computeAnalytics,
  pickQuote,
  getWeekTitle,
  getCalendarMatrix,
  getMonthTitle,
  navigateWeek,
  navigateMonth,
  toggleTheme,
  saveMood,
  deleteMood,
  getSelectedDateLabel,
  ensureWeekStartForDate,
  getEncouragementMessage,
  getWeekEntries,
  parseDateFromIso,
  getSystemTheme
} from '../models/moodModel';

export function createMoodController() {
  const initialTheme = getSystemTheme();
  const state = reactive(createInitialState(initialTheme, true));
  loadSampleData(state);

  const quote = ref(state.quote);

  const weekDays = computed(() => getWeekDays(state));
  const analytics = computed(() => computeAnalytics(state, weekDays.value));
  const weekSummary = computed(() => analytics.value.summary);
  const weekTitle = computed(() => getWeekTitle(state));
  const calendarMatrix = computed(() => getCalendarMatrix(state));
  const monthTitle = computed(() => getMonthTitle(state));
  const selectedDateLabel = computed(() => getSelectedDateLabel(state));
  const hasSelectedEntry = computed(() => Boolean(state.selectedDate && state.moodEntries[state.selectedDate]));

  let systemThemeQuery = null;
  let removeSystemThemeListener = null;

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    // Keep state.theme aligned with the operating system when the system option is active.
    const applySystemTheme = event => {
      if (state.useSystemTheme) {
        state.theme = event.matches ? 'dark' : 'light';
      }
    };

    applySystemTheme(systemThemeQuery);

    if (typeof systemThemeQuery.addEventListener === 'function') {
      systemThemeQuery.addEventListener('change', applySystemTheme);
      removeSystemThemeListener = () => systemThemeQuery.removeEventListener('change', applySystemTheme);
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
    theme => {
      document.documentElement.setAttribute('data-color-scheme', theme);
      document.body.dataset.theme = theme;
    },
    { immediate: true }
  );

  watch(
    () => getWeekEntries(state),
    entries => {
      const newQuote = pickQuote(entries);
      quote.value = newQuote;
      state.quote = newQuote;
    },
    { immediate: true, deep: true }
  );

  watch(
    () => state.showMoodModal || state.showCalendarModal,
    locked => {
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
      note: state.moodDraft.note
    });

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
    closeMoodModal();
    showToast('Humeur supprimée');
  }

  function navigateWeekBy(direction) {
    navigateWeek(state, direction);
  }

  function navigateMonthBy(direction) {
    navigateMonth(state, direction);
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
  }

  return {
    state,
    moodLevels,
    quote,
    weekDays,
    analytics,
    weekSummary,
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
    showToast
  };
}
