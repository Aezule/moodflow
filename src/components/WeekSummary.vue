<script setup>
const props = defineProps({
  summary: {
    type: String,
    default: ''
  }
});
</script>

<template>
  <section class="week-summary">
    <div class="summary-card">
      <h3>Résumé de la semaine</h3>
      <p class="summary-text">{{ props.summary }}</p>
    </div>
  </section>
</template>
