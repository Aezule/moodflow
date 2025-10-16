<script setup>
import { computed, inject } from 'vue';

const controller = inject('controller');

if (!controller) {
  throw new Error('Controller injection missing in HeaderBar');
}

const themeIcon = computed(() => (controller.state.theme === 'dark' ? '🌙' : '☀️'));

const toggleTheme = () => {
  controller.toggleTheme();
};

const openCalendar = () => {
  controller.openCalendarModal();
};
</script>

<template>
  <header class="header">
    <div class="container">
      <div class="header__content">
        <h1 class="header__title">
          <span class="header__emoji">🌈</span>
          MoodFlow+
        </h1>
        <div class="header__controls">
          <button class="btn btn--secondary theme-toggle" @click="toggleTheme">
            <span class="theme-icon">{{ themeIcon }}</span>
          </button>
          <button class="btn btn--outline" @click="openCalendar">
            📅 Calendrier
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
