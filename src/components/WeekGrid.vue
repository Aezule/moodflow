<script setup>
import { inject } from 'vue';

const props = defineProps({
  days: {
    type: Array,
    default: () => [],
  },
});

const controller = inject('controller');

if (!controller) {
  throw new Error('Controller injection missing in WeekGrid');
}

const openDay = (day) => {
  if (day.isFuture) {
    controller.showToast?.("Impossible d'ajouter une humeur pour une journée future");
    return;
  }

  controller.openMoodModal(day.iso);
};

const getCardStyle = (day) => {
  if (!day.entry) {
    return null;
  }
  return {
    background: `linear-gradient(135deg, var(--color-surface) 0%, ${day.entry.color}10 100%)`,
  };
};
</script>

<template>
  <section class="week-grid">
    <article
      v-for="day in props.days"
      :key="day.iso"
      class="day-card"
      :class="{
        'day-card--today': day.isToday,
        'day-card--disabled': day.isFuture,
      }"
      :style="getCardStyle(day)"
      role="button"
      :tabindex="day.isFuture ? -1 : 0"
      :aria-disabled="day.isFuture ? 'true' : 'false'"
      @click="openDay(day)"
      @keydown.enter.prevent="openDay(day)"
      @keydown.space.prevent="openDay(day)"
    >
      <div class="day-card__header">
        <div>
          <div class="day-card__day">{{ day.dayName }}</div>
          <div class="day-card__date">{{ day.displayDate }}</div>
        </div>
        <span v-if="day.isToday" style="color: var(--color-primary); font-weight: bold"
          >Aujourd'hui</span
        >
      </div>
      <div class="day-card__mood">
        <template v-if="day.entry">
          <div class="mood-display">
            <div class="mood-emoji">{{ day.entry.emoji }}</div>
            <div class="mood-label">{{ day.entry.label }}</div>
          </div>
        </template>
        <template v-else>
          <div class="add-mood">
            <div class="add-mood__icon">+</div>
            <div>Ajouter humeur</div>
          </div>
        </template>
      </div>
      <div v-if="day.entry && day.entry.note" class="day-card__note">
        {{ day.entry.note }}
      </div>
    </article>
  </section>
</template>
