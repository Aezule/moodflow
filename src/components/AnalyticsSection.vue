<script setup>
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
  analytics: {
    type: Object,
    default: () => ({}),
  },
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
const selectedModelTab = ref('best'); // 'best', 'linear', 'knn', 'tree'
const showDetails = ref(false); // Afficher détails techniques

const prediction = computed(() => {
  return controller && controller.state && controller.state.prediction
    ? controller.state.prediction
    : {};
});

const currentModelData = computed(() => {
  if (!prediction.value.allModels) return null;
  
  if (selectedModelTab.value === 'best') {
    // Retourner le meilleur
    const models = [
      { key: 'linear', ...prediction.value.allModels.linear },
      { key: 'knn', ...prediction.value.allModels.knn },
      { key: 'tree', ...prediction.value.allModels.tree }
    ];
    return models.reduce((best, curr) => curr.r2 > best.r2 ? curr : best);
  }
  
  return prediction.value.allModels[selectedModelTab.value];
});

let moodChart = null;
let barChart = null;
let stopWatch = null;

const changePeriod = (period) => {
  if (period === 'prediction') {
    showPrediction.value = true;
    // Pré-remplir la ville si elle existe
    if (controller?.state?.prediction?.city) {
      cityInput.value = controller.state.prediction.city;
    }
    destroyCharts();
    renderPredictionChart();
    return;
  }

  showPrediction.value = false;
  destroyCharts();
  if (controller?.changeAnalyticsPeriod) {
    controller.changeAnalyticsPeriod(period);
  }
  renderCharts(props.analytics || {});
};

const loadPrediction = async () => {
  if (!cityInput.value.trim()) {
    predictionError.value = 'Veuillez entrer une ville';
    return;
  }

  predictionLoading.value = true;
  predictionError.value = '';
  selectedModelTab.value = 'best'; // Reset à meilleur

  try {
    if (controller.setPredictionCity) {
      controller.setPredictionCity(cityInput.value);
    }

    if (controller.refreshPrediction) {
      await controller.refreshPrediction(); // Toujours ML maintenant
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

const changeModel = (modelName) => {
  selectedModelTab.value = modelName;
  if (controller.selectPredictionModel) {
    controller.selectPredictionModel(modelName);
  }
  renderPredictionChart();
};

const periodTitle = computed(() => {
  if (showPrediction.value) {
    return "🔮 Prédiction d'humeur (7 jours)";
  }
  const titles = {
    week: 'Analytics de la semaine',
    month: 'Analytics du mois',
    year: "Analytics de l'année",
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
      labels: predData.map((p) => p.label),
      datasets: [
        {
          label: "Prédiction d'humeur",
          data: predData.map((p) => p.mood),
          borderColor: '#6c5ce7',
          backgroundColor: 'rgba(108, 92, 231, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 8,
          pointHoverRadius: 10,
          pointBackgroundColor: predData.map((p) => p.moodLevel.color),
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (context) => {
              const index = context[0]?.dataIndex;
              const point = predData[index];
              return `${point.label} - ${point.weather.icon} ${point.weather.label}`;
            },
            label: (context) => {
              const index = context.dataIndex;
              const point = predData[index];
              return [
                `${point.moodLevel.emoji} ${point.moodLevel.label}`,
                `Température: ${point.temp.min}°C - ${point.temp.max}°C`,
                point.weather.tooltip,
              ];
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 0.5,
          max: 5.5,
          ticks: {
            stepSize: 1,
            callback: (value) => {
              const mood = moodLevels?.[Math.round(value)];
              return mood ? mood.emoji : '';
            },
          },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
        x: {
          grid: { display: false },
        },
      },
    },
  });

  // Graphique en barres : Impact météo
  const weatherImpacts = [
    { label: '☀️ Soleil', value: 0.6, color: 'rgba(255, 215, 0, 0.5)' },
    { label: '⛅ Nuageux', value: 0.3, color: 'rgba(135, 206, 250, 0.5)' },
    { label: '☁️ Couvert', value: -0.1, color: 'rgba(169, 169, 169, 0.5)' },
    { label: '🌧️ Pluie', value: -0.4, color: 'rgba(65, 105, 225, 0.5)' },
    { label: '⛈️ Orages', value: -0.6, color: 'rgba(75, 0, 130, 0.5)' },
  ];

  barChart = new Chart(barCanvas.value.getContext('2d'), {
    type: 'bar',
    data: {
      labels: weatherImpacts.map((w) => w.label),
      datasets: [
        {
          label: "Impact sur l'humeur",
          data: weatherImpacts.map((w) => w.value),
          backgroundColor: weatherImpacts.map((w) => w.color),
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y;
              return `Impact: ${value > 0 ? '+' : ''}${value}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
        x: {
          grid: { display: false },
        },
      },
    },
  });
};

const renderCharts = (analytics) => {
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
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y;
              const mood = value ? moodLevels?.[value] : null;
              if (mood) {
                return `${mood.emoji} ${mood.label}`;
              }
              return value ? value.toString() : "Pas d'humeur";
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 0.5,
          max: 5.5,
          ticks: {
            stepSize: 1,
            callback: (value) => {
              const mood = moodLevels?.[value];
              return mood ? mood.emoji : '';
            },
          },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
        x: {
          grid: { display: false },
        },
      },
    },
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
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (context) => {
              const index = context[0]?.dataIndex;
              if (index == null) {
                return '';
              }
              const moodValue = index + 1;
              const mood = moodLevels?.[moodValue];
              return mood ? mood.label : '';
            },
            label: (context) => {
              const count = context.parsed.y;
              return `${count} jour${count > 1 ? 's' : ''}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
        x: {
          grid: { display: false },
        },
      },
    },
  });
};

onMounted(() => {
  renderCharts(props.analytics || {});
  stopWatch = watch(
    () => props.analytics,
    (analytics) => {
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
        <button class="btn btn--primary" :disabled="predictionLoading" @click="loadPrediction">
          {{ predictionLoading ? '⏳ Entraînement des 3 modèles...' : '🤖 Lancer les prédictions ML' }}
        </button>
      </div>

      <!-- Message d'erreur -->
      <div v-if="predictionError" class="prediction-error">❌ {{ predictionError }}</div>

      <!-- Informations sur la prédiction -->
      <div v-if="prediction.status === 'success' && prediction.cityLabel" class="prediction-info">
        <div class="prediction-info__city">
          📍 Prévisions pour <strong>{{ prediction.cityLabel }}</strong>
        </div>
        
        <!-- Explication simple -->
        <div class="prediction-explanation">
          <p class="explanation-text">
            🔮 <strong>Notre intelligence artificielle</strong> a analysé <strong>{{ prediction.modelMetrics?.trainingSize || 501 }} jours</strong> 
            de données pour prédire votre humeur sur les 7 prochains jours, en tenant compte de 
            <strong>la météo</strong> ☁️, <strong>vos habitudes</strong> 📅 et <strong>les saisons</strong> 🌸.
          </p>
          <div class="prediction-confidence">
            <div class="confidence-bar">
              <div class="confidence-fill" :style="{ width: `${(prediction.modelMetrics?.r2 || 0) * 100}%` }"></div>
            </div>
            <div class="confidence-label">
              <strong>Fiabilité de la prédiction :</strong> 
              <span class="confidence-value">{{ ((prediction.modelMetrics?.r2 || 0) * 100).toFixed(0) }}%</span>
              <span class="confidence-desc">
                {{ prediction.modelMetrics?.r2 > 0.8 ? '🌟 Excellente' : prediction.modelMetrics?.r2 > 0.6 ? '👍 Bonne' : '✅ Correcte' }}
              </span>
            </div>
          </div>
        </div>
        
        <div v-if="prediction.baseline" class="prediction-info__baseline">
          <span class="baseline-label">Votre humeur habituelle :</span>
          <span class="baseline-value"
            >{{ prediction.baseline.emoji }} {{ prediction.baseline.label }}</span
          >
        </div>

        <!-- Onglets de sélection de modèle -->
        <div v-if="prediction.allModels" class="model-tabs">
          <div class="model-tabs__header">
            <button
              class="model-tab"
              :class="{ 'model-tab--active': selectedModelTab === 'best' }"
              @click="changeModel('best')"
            >
              <span class="model-tab__icon">🏆</span>
              <span class="model-tab__label">Meilleure prédiction</span>
            </button>
            <button
              class="model-tab"
              :class="{ 'model-tab--active': selectedModelTab === 'linear' }"
              @click="changeModel('linear')"
            >
              <span class="model-tab__icon">📈</span>
              <span class="model-tab__label">Analyse par tendances</span>
            </button>
            <button
              class="model-tab"
              :class="{ 'model-tab--active': selectedModelTab === 'knn' }"
              @click="changeModel('knn')"
            >
              <span class="model-tab__icon">🎯</span>
              <span class="model-tab__label">Jours similaires</span>
            </button>
            <button
              class="model-tab"
              :class="{ 'model-tab--active': selectedModelTab === 'tree' }"
              @click="changeModel('tree')"
            >
              <span class="model-tab__icon">🌳</span>
              <span class="model-tab__label">Scénarios</span>
            </button>
          </div>

          <!-- Informations du modèle sélectionné (version simple) -->
          <div v-if="currentModelData" class="model-details">
            <div class="model-details__description">
              <div v-if="selectedModelTab === 'best'" class="model-explainer">
                <h5>🏆 Meilleure prédiction automatique</h5>
                <p>L'IA a testé 3 méthodes différentes et a sélectionné celle qui est la plus précise pour vous : <strong>{{ currentModelData.name }}</strong></p>
                <div class="accuracy-badge">
                  <span class="badge-label">Précision :</span>
                  <span class="badge-value">{{ (currentModelData.r2 * 100).toFixed(0) }}%</span>
                </div>
              </div>
              
              <div v-if="selectedModelTab === 'linear'" class="model-explainer">
                <h5>📈 Analyse par tendances</h5>
                <p>Cette méthode identifie les <strong>tendances générales</strong> : par exemple, si vous êtes généralement plus heureux le vendredi ou quand il fait beau.</p>
                <p class="method-detail">💡 Comme tracer une ligne qui suit vos humeurs dans le temps</p>
              </div>
              
              <div v-if="selectedModelTab === 'knn'" class="model-explainer">
                <h5>🎯 Jours similaires</h5>
                <p>Cette méthode cherche dans votre historique les <strong>5 jours les plus similaires</strong> (même jour de semaine, même météo...) et prédit que vous vous sentirez pareil.</p>
                <p class="method-detail">💡 Comme se souvenir "la dernière fois qu'il pleuvait un lundi, je me sentais..."</p>
              </div>
              
              <div v-if="selectedModelTab === 'tree'" class="model-explainer">
                <h5>🌳 Scénarios</h5>
                <p>Cette méthode crée des <strong>scénarios</strong> : "Si il fait beau ET c'est le weekend, alors vous serez heureux. Si il pleut ET c'est lundi, alors vous serez moins bien."</p>
                <p class="method-detail">💡 Comme un arbre de décisions basé sur votre vécu</p>
              </div>
            </div>
            
            <div class="model-quick-stats">
              <div class="quick-stat">
                <span class="quick-stat__icon">📊</span>
                <div class="quick-stat__content">
                  <div class="quick-stat__label">Précision</div>
                  <div class="quick-stat__value">{{ (currentModelData.r2 * 100).toFixed(0) }}%</div>
                </div>
              </div>
              <div class="quick-stat">
                <span class="quick-stat__icon">⚡</span>
                <div class="quick-stat__content">
                  <div class="quick-stat__label">Marge d'erreur</div>
                  <div class="quick-stat__value">±{{ currentModelData.rmse.toFixed(1) }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Bouton pour afficher détails techniques -->
          <div class="details-toggle">
            <button class="btn btn--outline btn--sm" @click="showDetails = !showDetails">
              {{ showDetails ? '🔼 Masquer les détails techniques' : '🔽 Voir les détails techniques' }}
            </button>
          </div>
        </div>

        <!-- Détails techniques (masqués par défaut) -->
        <div v-if="showDetails && prediction.allModels" class="ml-comparison">
          <h4>🔬 Détails techniques pour les curieux :</h4>
          
          <div class="tech-intro">
            <p>L'intelligence artificielle a testé <strong>3 algorithmes différents</strong> pour trouver le plus précis. 
            Voici leurs performances :</p>
          </div>
          
          <div class="comparison-cards">
            <div 
              class="comparison-card"
              :class="{ 'comparison-card--best': prediction.allModels.linear.r2 === Math.max(prediction.allModels.linear.r2, prediction.allModels.knn.r2, prediction.allModels.tree.r2) }"
            >
              <div class="comparison-card__header">
                <span class="comparison-card__icon">📈</span>
                <span class="comparison-card__name">Analyse par tendances</span>
                <span v-if="prediction.allModels.linear.r2 === Math.max(prediction.allModels.linear.r2, prediction.allModels.knn.r2, prediction.allModels.tree.r2)" class="winner-badge">🏆 Gagnant</span>
              </div>
              <div class="comparison-card__score">
                <div class="score-bar">
                  <div class="score-fill" :style="{ width: `${prediction.allModels.linear.r2 * 100}%` }"></div>
                </div>
                <div class="score-value">{{ (prediction.allModels.linear.r2 * 100).toFixed(1) }}% de précision</div>
              </div>
              <div class="comparison-card__details">
                <span>Erreur : ±{{ prediction.allModels.linear.rmse.toFixed(2) }}</span>
                <span class="tech-detail">(Régression Linéaire)</span>
              </div>
            </div>
            
            <div 
              class="comparison-card"
              :class="{ 'comparison-card--best': prediction.allModels.knn.r2 === Math.max(prediction.allModels.linear.r2, prediction.allModels.knn.r2, prediction.allModels.tree.r2) }"
            >
              <div class="comparison-card__header">
                <span class="comparison-card__icon">🎯</span>
                <span class="comparison-card__name">Jours similaires</span>
                <span v-if="prediction.allModels.knn.r2 === Math.max(prediction.allModels.linear.r2, prediction.allModels.knn.r2, prediction.allModels.tree.r2)" class="winner-badge">🏆 Gagnant</span>
              </div>
              <div class="comparison-card__score">
                <div class="score-bar">
                  <div class="score-fill" :style="{ width: `${prediction.allModels.knn.r2 * 100}%` }"></div>
                </div>
                <div class="score-value">{{ (prediction.allModels.knn.r2 * 100).toFixed(1) }}% de précision</div>
              </div>
              <div class="comparison-card__details">
                <span>Erreur : ±{{ prediction.allModels.knn.rmse.toFixed(2) }}</span>
                <span class="tech-detail">(K-Nearest Neighbors)</span>
              </div>
            </div>
            
            <div 
              class="comparison-card"
              :class="{ 'comparison-card--best': prediction.allModels.tree.r2 === Math.max(prediction.allModels.linear.r2, prediction.allModels.knn.r2, prediction.allModels.tree.r2) }"
            >
              <div class="comparison-card__header">
                <span class="comparison-card__icon">🌳</span>
                <span class="comparison-card__name">Scénarios</span>
                <span v-if="prediction.allModels.tree.r2 === Math.max(prediction.allModels.linear.r2, prediction.allModels.knn.r2, prediction.allModels.tree.r2)" class="winner-badge">🏆 Gagnant</span>
              </div>
              <div class="comparison-card__score">
                <div class="score-bar">
                  <div class="score-fill" :style="{ width: `${prediction.allModels.tree.r2 * 100}%` }"></div>
                </div>
                <div class="score-value">{{ (prediction.allModels.tree.r2 * 100).toFixed(1) }}% de précision</div>
              </div>
              <div class="comparison-card__details">
                <span>Erreur : ±{{ prediction.allModels.tree.rmse.toFixed(2) }}</span>
                <span class="tech-detail">(Decision Tree)</span>
              </div>
            </div>
          </div>
          
          <div class="comparison-note">
            💡 <strong>Plus le pourcentage est élevé, plus la prédiction est fiable.</strong> 
            L'algorithme gagnant est utilisé automatiquement pour vos prédictions.
          </div>
        </div>
        
        <!-- Feature importances pour le modèle linéaire (détails techniques) -->
        <div v-if="showDetails && selectedModelTab === 'linear' && prediction.allModels?.linear?.featureImportances" class="ml-metrics">
          <h4>🎯 Coefficients de régression linéaire :</h4>
          
          <div class="feature-importance">
            <div class="feature-bars">
              <div
                v-for="(feature, index) in prediction.allModels.linear.featureImportances"
                :key="index"
                class="feature-bar"
              >
                <div class="feature-name">{{ index + 1 }}. {{ feature.name }}</div>
                <div class="feature-visual">
                  <div
                    class="feature-fill"
                    :style="{ width: `${(feature.impact / prediction.allModels.linear.featureImportances[0].impact) * 100}%` }"
                  ></div>
                  <span class="feature-coef">{{ feature.value > 0 ? '+' : '' }}{{ feature.value.toFixed(3) }}</span>
                </div>
              </div>
            </div>
          </div>
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
