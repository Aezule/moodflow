<script setup>
import { provide } from 'vue';
import HeaderBar from './components/HeaderBar.vue';
import WeekNavigation from './components/WeekNavigation.vue';
import QuoteSection from './components/QuoteSection.vue';
import WeekGrid from './components/WeekGrid.vue';
import AnalyticsSection from './components/AnalyticsSection.vue';
import WeekSummary from './components/WeekSummary.vue';
import MoodModal from './components/MoodModal.vue';
import CalendarModal from './components/CalendarModal.vue';
import ToastMessage from './components/ToastMessage.vue';
import { createMoodController } from './controllers/moodController';

const controller = createMoodController();
provide('controller', controller);

const weekTitle = controller.weekTitle;
const weekDays = controller.weekDays;
const quote = controller.quote;
const analytics = controller.analytics;
const analyticsTitle = controller.analyticsTitle;
const weekSummary = controller.weekSummary;
const summaryTitle = controller.summaryTitle;
const calendarMatrix = controller.calendarMatrix;
const monthTitle = controller.monthTitle;
</script>

<template>
  <div class="app-shell">
    <HeaderBar />
    <WeekNavigation :title="weekTitle" />
    <QuoteSection :quote="quote" />
    <main class="main">
      <div class="container">
        <WeekGrid :days="weekDays" />
        <AnalyticsSection :analytics="analytics" :title="analyticsTitle" />
        <WeekSummary :title="summaryTitle" :summary="weekSummary" />
      </div>
    </main>
    <MoodModal />
    <CalendarModal :matrix="calendarMatrix" :month-title="monthTitle" />
    <ToastMessage />
  </div>
</template>
