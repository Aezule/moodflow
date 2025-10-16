<script setup>
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
  analytics: {
    type: Object,
    default: () => ({})
  }
});

const controller = inject('controller', null);
const moodLevels = controller ? controller.moodLevels : {};

const stats = computed(() => props.analytics || {});
const moodCanvas = ref(null);
const barCanvas = ref(null);

let moodChart = null;
let barChart = null;
let stopWatch = null;

const destroyCharts = () => {
  if (moodChart) {
    moodChart.destroy();
    moodChart = null;
  }
  if (barChart) {
    barChart.destroy();
    barChart = null;
  }
};

const renderCharts = analytics => {
  if (!moodCanvas.value || !barCanvas.value) {
    return;
  }

  const data = analytics?.chartData;
  if (!data || !data.line || !data.bar) {
    destroyCharts();
    return;
  }

  destroyCharts();

  moodChart = new Chart(moodCanvas.value.getContext('2d'), {
    type: 'line',
    data: {
      labels: data.line.labels,
      datasets: [
        {
          label: "Évolution de l'humeur",
          data: data.line.data,
          borderColor: '#1FB8CD',
          backgroundColor: 'rgba(31, 184, 205, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: data.line.colors,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => {
              const value = context.parsed.y;
              const mood = value ? moodLevels?.[value] : null;
              if (mood) {
                return `${mood.emoji} ${mood.label}`;
              }
              return value ? value.toString() : "Pas d'humeur";
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 0.5,
          max: 5.5,
          ticks: {
            stepSize: 1,
            callback: value => {
              const mood = moodLevels?.[value];
              return mood ? mood.emoji : '';
            }
          },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });

  barChart = new Chart(barCanvas.value.getContext('2d'), {
    type: 'bar',
    data: {
      labels: data.bar.labels,
      datasets: [
        {
          label: 'Nombre de jours',
          data: data.bar.data,
          backgroundColor: data.bar.backgroundColors,
          borderColor: data.bar.borderColors,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: context => {
              const index = context[0]?.dataIndex;
              if (index == null) {
                return '';
              }
              const moodValue = index + 1;
              const mood = moodLevels?.[moodValue];
              return mood ? mood.label : '';
            },
            label: context => {
              const count = context.parsed.y;
              return `${count} jour${count > 1 ? 's' : ''}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
};

onMounted(() => {
  renderCharts(props.analytics || {});
  stopWatch = watch(
    () => props.analytics,
    analytics => {
      renderCharts(analytics || {});
    },
    { deep: true }
  );
});

onBeforeUnmount(() => {
  if (stopWatch) {
    stopWatch();
    stopWatch = null;
  }
  destroyCharts();
});
</script>

<template>
  <section class="analytics">
    <h3 class="analytics__title">Analytics de la semaine</h3>
    <div class="analytics__grid">
      <div class="analytics__stats">
        <div class="stat-card">
          <div class="stat-card__icon">📊</div>
          <div class="stat-card__content">
            <h4>Moyenne</h4>
            <span class="stat-value">{{ stats.averageLabel }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon">🌟</div>
          <div class="stat-card__content">
            <h4>Meilleur jour</h4>
            <span class="stat-value">{{ stats.bestDayLabel }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon">💙</div>
          <div class="stat-card__content">
            <h4>Jours enregistrés</h4>
            <span class="stat-value">{{ stats.recordedDaysLabel }}</span>
          </div>
        </div>
      </div>
      <div class="analytics__charts">
        <div class="chart-container">
          <canvas ref="moodCanvas"></canvas>
        </div>
        <div class="chart-container">
          <canvas ref="barCanvas"></canvas>
        </div>
      </div>
    </div>
  </section>
</template>
