<script setup>
const props = defineProps({
  quote: {
    type: String,
    default: ''
  }
});
</script>

<template>
  <section class="quote-section">
    <div class="container">
      <div class="quote-card">
        <p class="quote-text">{{ props.quote }}</p>
      </div>
    </div>
  </section>
</template>
