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

const selectedPeriod = computed(() => {
  return controller && controller.state ? controller.state.analyticsPeriod : 'week';
});

// États pour la prédiction
const cityInput = ref('');
const predictionLoading = ref(false);
const predictionError = ref('');
const showPrediction = ref(false);

const prediction = computed(() => {
  return controller && controller.state && controller.state.prediction ? controller.state.prediction : {};
});

let moodChart = null;
let barChart = null;
let stopWatch = null;

const changePeriod = (period) => {
  if (period === 'prediction') {
    showPrediction.value = true;
    // Pré-remplir la ville si elle existe
    if (controller.state.prediction?.city) {
      cityInput.value = controller.state.prediction.city;
    }
    return;
  }
  
  showPrediction.value = false;
  if (controller && controller.changeAnalyticsPeriod) {
    controller.changeAnalyticsPeriod(period);
  }
};

const loadPrediction = async () => {
  if (!cityInput.value.trim()) {
    predictionError.value = 'Veuillez entrer une ville';
    return;
  }

  predictionLoading.value = true;
  predictionError.value = '';

  try {
    if (controller.setPredictionCity) {
      controller.setPredictionCity(cityInput.value);
    }
    
    if (controller.refreshPrediction) {
      await controller.refreshPrediction();
    }

    if (controller.state.prediction?.status === 'error') {
      predictionError.value = controller.state.prediction.error;
    } else if (controller.state.prediction?.status === 'success') {
      // Forcer le re-rendu du graphique
      renderPredictionChart();
    }
  } catch (error) {
    predictionError.value = 'Erreur lors de la prédiction';
    console.error(error);
  } finally {
    predictionLoading.value = false;
  }
};

const periodTitle = computed(() => {
  if (showPrediction.value) {
    return '🔮 Prédiction d\'humeur (7 jours)';
  }
  const titles = {
    week: 'Analytics de la semaine',
    month: 'Analytics du mois',
    year: 'Analytics de l\'année'
  };
  return titles[selectedPeriod.value] || 'Analytics de la semaine';
});

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

const renderPredictionChart = () => {
  if (!moodCanvas.value || !barCanvas.value) {
    return;
  }

  destroyCharts();

  const predData = prediction.value.chart || [];
  
  if (predData.length === 0) {
    return;
  }

  moodChart = new Chart(moodCanvas.value.getContext('2d'), {
    type: 'line',
    data: {
      labels: predData.map(p => p.label),
      datasets: [{
        label: "Prédiction d'humeur",
        data: predData.map(p => p.mood),
        borderColor: '#6c5ce7',
        backgroundColor: 'rgba(108, 92, 231, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 8,
        pointHoverRadius: 10,
        pointBackgroundColor: predData.map(p => p.moodLevel.color),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }]
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
              const point = predData[index];
              return `${point.label} - ${point.weather.icon} ${point.weather.label}`;
            },
            label: context => {
              const index = context.dataIndex;
              const point = predData[index];
              return [
                `${point.moodLevel.emoji} ${point.moodLevel.label}`,
                `Température: ${point.temp.min}°C - ${point.temp.max}°C`,
                point.weather.tooltip
              ];
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
              const mood = moodLevels?.[Math.round(value)];
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

  // Graphique en barres : Impact météo
  const weatherImpacts = [
    { label: '☀️ Soleil', value: 0.6, color: 'rgba(255, 215, 0, 0.5)' },
    { label: '⛅ Nuageux', value: 0.3, color: 'rgba(135, 206, 250, 0.5)' },
    { label: '☁️ Couvert', value: -0.1, color: 'rgba(169, 169, 169, 0.5)' },
    { label: '🌧️ Pluie', value: -0.4, color: 'rgba(65, 105, 225, 0.5)' },
    { label: '⛈️ Orages', value: -0.6, color: 'rgba(75, 0, 130, 0.5)' }
  ];

  barChart = new Chart(barCanvas.value.getContext('2d'), {
    type: 'bar',
    data: {
      labels: weatherImpacts.map(w => w.label),
      datasets: [{
        label: 'Impact sur l\'humeur',
        data: weatherImpacts.map(w => w.value),
        backgroundColor: weatherImpacts.map(w => w.color),
        borderRadius: 8
      }]
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
              return `Impact: ${value > 0 ? '+' : ''}${value}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
};

const renderCharts = analytics => {
  if (!moodCanvas.value || !barCanvas.value) {
    return;
  }

  // Mode prédiction
  if (showPrediction.value && prediction.value.chart) {
    renderPredictionChart();
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
    <div class="analytics__header">
      <h3 class="analytics__title">{{ periodTitle }}</h3>
      <div class="period-switch">
        <button 
          class="period-switch__btn" 
          :class="{ 'period-switch__btn--active': selectedPeriod === 'week' && !showPrediction }"
          @click="changePeriod('week')"
        >
          Semaine
        </button>
        <button 
          class="period-switch__btn" 
          :class="{ 'period-switch__btn--active': selectedPeriod === 'month' && !showPrediction }"
          @click="changePeriod('month')"
        >
          Mois
        </button>
        <button 
          class="period-switch__btn" 
          :class="{ 'period-switch__btn--active': selectedPeriod === 'year' && !showPrediction }"
          @click="changePeriod('year')"
        >
          Année
        </button>
        <button 
          class="period-switch__btn period-switch__btn--prediction" 
          :class="{ 'period-switch__btn--active': showPrediction }"
          @click="changePeriod('prediction')"
        >
          🔮 Prédiction
        </button>
      </div>
    </div>

    <!-- Section saisie ville pour prédiction -->
    <div v-if="showPrediction" class="prediction-input">
      <div class="prediction-input__field">
        <input 
          v-model="cityInput"
          type="text" 
          placeholder="Entrez votre ville (ex: Paris, Lyon, Marseille...)"
          class="city-input"
          @keyup.enter="loadPrediction"
        />
        <button 
          @click="loadPrediction" 
          class="btn btn--primary"
          :disabled="predictionLoading"
        >
          {{ predictionLoading ? '⏳ Chargement...' : '🔮 Prédire mon humeur' }}
        </button>
      </div>
      
      <!-- Message d'erreur -->
      <div v-if="predictionError" class="prediction-error">
        ❌ {{ predictionError }}
      </div>

      <!-- Informations sur la prédiction -->
      <div v-if="prediction.status === 'success' && prediction.cityLabel" class="prediction-info">
        <div class="prediction-info__city">
          📍 Prévisions pour <strong>{{ prediction.cityLabel }}</strong>
        </div>
        <div class="prediction-info__baseline" v-if="prediction.baseline">
          <span class="baseline-label">Votre humeur de référence :</span>
          <span class="baseline-value">{{ prediction.baseline.emoji }} {{ prediction.baseline.label }}</span>
        </div>
        <div class="prediction-info__reasons" v-if="prediction.reasons && prediction.reasons.length">
          <h4>💡 Analyse :</h4>
          <ul>
            <li v-for="(reason, index) in prediction.reasons" :key="index">{{ reason }}</li>
          </ul>
        </div>
      </div>
    </div>

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
            <h4>Meilleur {{ selectedPeriod === 'year' ? 'mois' : 'jour' }}</h4>
            <span class="stat-value">{{ stats.bestDayLabel }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon">💙</div>
          <div class="stat-card__content">
            <h4>{{ selectedPeriod === 'year' ? 'Mois' : 'Jours' }} enregistrés</h4>
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
