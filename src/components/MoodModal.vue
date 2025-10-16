<script setup>
import { computed, inject } from 'vue';

const controller = inject('controller');

if (!controller) {
  throw new Error('Controller injection missing in MoodModal');
}

const state = controller.state;
const moodOptions = Object.values(controller.moodLevels);

const show = computed(() => state.showMoodModal);
const selectedMood = computed(() => state.moodDraft.mood);
const note = computed({
  get: () => state.moodDraft.note,
  set: value => controller.setMoodDraftNote(value)
});
const dateLabel = controller.selectedDateLabel;
const hasEntry = controller.hasSelectedEntry;

const close = () => {
  controller.closeMoodModal();
};

const save = () => {
  controller.saveSelectedMood();
};

const remove = () => {
  controller.deleteSelectedMood();
};

const selectMood = value => {
  controller.setMoodDraftMood(value);
};
</script>

<template>
  <div v-if="show" class="modal-overlay show" @click.self="close">
    <div class="modal">
      <div class="modal__header">
        <h3>Comment vous sentez-vous ?</h3>
        <button class="modal__close" @click="close">×</button>
      </div>
      <div class="modal__content">
        <p class="modal__date">{{ dateLabel }}</p>
        <div class="mood-selector">
          <div
            v-for="mood in moodOptions"
            :key="mood.value"
            class="mood-option"
            :class="{ selected: selectedMood === mood.value }"
            tabindex="0"
            role="button"
            @click="selectMood(mood.value)"
            @keydown.enter.prevent="selectMood(mood.value)"
            @keydown.space.prevent="selectMood(mood.value)"
          >
            <div class="mood-option__emoji">{{ mood.emoji }}</div>
            <div class="mood-option__label">{{ mood.label }}</div>
          </div>
        </div>
        <div class="note-section">
          <label class="form-label" for="moodNote">Note personnelle (optionnelle)</label>
          <textarea
            id="moodNote"
            class="form-control"
            placeholder="Décrivez votre journée, vos pensées..."
            v-model="note"
          ></textarea>
        </div>
        <div class="modal__actions">
          <button class="btn btn--secondary" @click="close">Annuler</button>
          <button class="btn btn--primary" @click="save">Enregistrer</button>
          <button class="btn btn--outline" v-if="hasEntry" @click="remove">Supprimer</button>
        </div>
      </div>
    </div>
  </div>
</template>
