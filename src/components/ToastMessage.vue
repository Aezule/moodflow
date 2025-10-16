<script setup>
import { computed, inject } from 'vue';

const controller = inject('controller');

if (!controller) {
  throw new Error('Controller injection missing in ToastMessage');
}

const state = controller.state;
const show = computed(() => state.toast.visible);
const message = computed(() => state.toast.message);
</script>

<template>
  <div class="toast" :class="{ show }">
    <span class="toast__message">{{ message }}</span>
  </div>
</template>
