<script setup>
const props = defineProps({
  summary: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: 'Résumé'
  }
});
</script>

<template>
  <section class="week-summary">
    <div class="summary-card">
      <h3>{{ props.title }}</h3>
      <p class="summary-text">{{ props.summary }}</p>
    </div>
  </section>
</template>
