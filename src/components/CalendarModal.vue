<script setup>
import { computed, inject } from 'vue';

const props = defineProps({
  matrix: {
    type: Array,
    default: () => []
  },
  monthTitle: {
    type: String,
    default: ''
  }
});

const controller = inject('controller');

if (!controller) {
  throw new Error('Controller injection missing in CalendarModal');
}

const show = computed(() => controller.state.showCalendarModal);
const flatDays = computed(() => (Array.isArray(props.matrix) ? props.matrix.flat() : []));

const close = () => {
  controller.closeCalendarModal();
};

const prevMonth = () => {
  controller.navigateMonthBy(-1);
};

const nextMonth = () => {
  controller.navigateMonthBy(1);
};

const selectDay = day => {
  if (!day || !day.iso) {
    return;
  }
  controller.focusDate(day.iso);
};

const dayClasses = day => {
  const classes = ['calendar-day'];
  if (!day.isCurrentMonth) {
    classes.push('other-month');
  }
  if (day.isToday) {
    classes.push('today');
  }
  if (day.hasMood) {
    classes.push('has-mood');
  }
  return classes.join(' ');
};
</script>

<template>
  <div v-if="show" class="modal-overlay show" @click.self="close">
    <div class="modal modal--large">
      <div class="modal__header">
        <h3>Calendrier mensuel</h3>
        <button class="modal__close" @click="close">×</button>
      </div>
      <div class="modal__content">
        <div class="calendar-nav">
          <button class="btn btn--secondary" @click="prevMonth">← Mois précédent</button>
          <h4>{{ props.monthTitle }}</h4>
          <button class="btn btn--secondary" @click="nextMonth">Mois suivant →</button>
        </div>
        <div class="calendar-grid">
          <div class="calendar-header">
            <div class="calendar-weekday">Lun</div>
            <div class="calendar-weekday">Mar</div>
            <div class="calendar-weekday">Mer</div>
            <div class="calendar-weekday">Jeu</div>
            <div class="calendar-weekday">Ven</div>
            <div class="calendar-weekday">Sam</div>
            <div class="calendar-weekday">Dim</div>
          </div>
          <div
            v-for="day in flatDays"
            :key="`${day.iso}-${day.label}`"
            :class="dayClasses(day)"
            @click="selectDay(day)"
          >
            {{ day.label }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
