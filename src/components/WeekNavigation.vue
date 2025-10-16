<script setup>
import { inject } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: ''
  }
});

const controller = inject('controller');

if (!controller) {
  throw new Error('Controller injection missing in WeekNavigation');
}

const prevWeek = () => {
  controller.navigateWeekBy(-1);
};

const nextWeek = () => {
  controller.navigateWeekBy(1);
};
</script>

<template>
  <nav class="week-nav">
    <div class="container">
      <div class="week-nav__content">
        <button class="btn btn--secondary" @click="prevWeek">← Semaine précédente</button>
        <h2 class="week-nav__title">{{ props.title }}</h2>
        <button class="btn btn--secondary" @click="nextWeek">Semaine suivante →</button>
      </div>
    </div>
  </nav>
</template>
