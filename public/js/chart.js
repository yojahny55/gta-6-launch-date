// GTA 6 Tracker - Chart Visualization Module
// Story 3.4: Optional Chart Visualization Toggle
// Implements lazy-loaded Chart.js histogram with 30-day buckets

/**
 * Chart Configuration Constants
 * AC: Chart.js lazy-loaded (<50KB), 30-day buckets
 */
const BUCKET_DAYS = 30; // Days per histogram bucket
const CHART_CDN_URL = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
// Using latest v3.x annotation plugin (compatible with Chart.js v4)
const ANNOTATION_PLUGIN_CDN_URL = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3/dist/chartjs-plugin-annotation.min.js';

/**
 * Track Chart.js module state
 */
let chartLibraryLoaded = false;
let chartInstance = null;
let isChartExpanded = false;

/**
 * DOM Elements (cached on init)
 */
let chartElements = null;

/**
 * Initialize and cache chart DOM elements
 */
function initChartElements() {
  chartElements = {
    toggleBtn: document.getElementById('chart-toggle-btn'),
    toggleText: document.getElementById('chart-toggle-text'),
    container: document.getElementById('chart-container'),
    loading: document.getElementById('chart-loading'),
    canvas: document.getElementById('prediction-chart'),
    dataTable: document.getElementById('chart-data-table')
  };
}

/**
 * Calculate 30-day histogram buckets from prediction data
 * AC: 30-day buckets from min to max date
 *
 * @param {object} stats - Stats object with min, max dates
 * @param {Array} predictions - Array of prediction objects {predicted_date, count}
 * @returns {Array<{startDate: string, endDate: string, count: number, label: string}>}
 */
function prepareHistogramData(stats, predictions = []) {
  const buckets = [];

  // Parse min and max dates
  const minDate = new Date(stats.min);
  const maxDate = new Date(stats.max);

  // Calculate number of buckets needed
  const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
  const numBuckets = Math.ceil(totalDays / BUCKET_DAYS);

  // Create buckets
  let currentDate = new Date(minDate);

  for (let i = 0; i < numBuckets; i++) {
    const bucketStart = new Date(currentDate);
    const bucketEnd = new Date(currentDate);
    bucketEnd.setDate(bucketEnd.getDate() + BUCKET_DAYS - 1);

    // Don't exceed max date
    if (bucketEnd > maxDate) {
      bucketEnd.setTime(maxDate.getTime());
    }

    // Format dates for bucket
    const startDateStr = bucketStart.toISOString().split('T')[0];
    const endDateStr = bucketEnd.toISOString().split('T')[0];

    // Create label (e.g., "Jan 2027")
    const label = bucketStart.toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric'
    });

    buckets.push({
      startDate: startDateStr,
      endDate: endDateStr,
      count: 0, // Will be populated by counting predictions
      label
    });

    // Move to next bucket
    currentDate.setDate(currentDate.getDate() + BUCKET_DAYS);
  }

  // Count predictions in each bucket (if predictions data provided)
  if (predictions && predictions.length > 0) {
    predictions.forEach(pred => {
      const predDate = new Date(pred.predicted_date);

      // Find matching bucket
      const bucket = buckets.find(b => {
        const start = new Date(b.startDate);
        const end = new Date(b.endDate);
        return predDate >= start && predDate <= end;
      });

      if (bucket) {
        bucket.count += (pred.count || 1);
      }
    });
  }

  return buckets;
}

/**
 * Load Chart.js library dynamically (lazy loading)
 * AC: Only loads library when user clicks toggle (first time)
 *
 * Updated: Now loads annotation plugin for median line marker
 *
 * @returns {Promise<boolean>} True if loaded successfully
 */
async function loadChartLibrary() {
  if (chartLibraryLoaded) {
    console.log('Chart.js already loaded');
    return true;
  }

  try {
    console.log('Loading Chart.js and annotation plugin from CDN...');

    // Load Chart.js from CDN
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = CHART_CDN_URL;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    // Wait for Chart global to be available
    if (typeof Chart === 'undefined') {
      throw new Error('Chart.js failed to initialize');
    }

    console.log('Chart.js loaded, now loading annotation plugin...');

    // Load annotation plugin from CDN
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = ANNOTATION_PLUGIN_CDN_URL;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    // Debug: Check what globals are available
    console.log('Checking for annotation plugin...', {
      hasChartAnnotation: typeof window.ChartAnnotation !== 'undefined',
      hasAnnotationPlugin: typeof window.annotationPlugin !== 'undefined',
      chartRegistry: !!Chart.registry,
      registryPlugins: Chart.registry ? Chart.registry.plugins : null
    });

    // Annotation plugin auto-registers in browser environment with UMD build
    // Verify plugin is available in Chart.registry.plugins
    const annotationRegistered = Chart.registry?.plugins?.get('annotation');

    if (!annotationRegistered) {
      console.log('Attempting manual registration...');
      // Fallback: Try manual registration if available as global
      // Try all possible global variable names
      if (typeof window.ChartAnnotation !== 'undefined') {
        Chart.register(window.ChartAnnotation);
        console.log('✓ Registered via window.ChartAnnotation');
      } else if (window.chartjs?.AnnotationPlugin) {
        Chart.register(window.chartjs.AnnotationPlugin);
        console.log('✓ Registered via window.chartjs.AnnotationPlugin');
      } else if (typeof window['chartjs-plugin-annotation'] !== 'undefined') {
        Chart.register(window['chartjs-plugin-annotation']);
        console.log('✓ Registered via window["chartjs-plugin-annotation"]');
      } else {
        // List all Chart-related globals for debugging
        const chartGlobals = Object.keys(window).filter(k => k.toLowerCase().includes('chart') || k.toLowerCase().includes('annotation'));
        console.warn('⚠️ Annotation plugin not found. Available Chart-related globals:', chartGlobals);
        console.warn('The median line may not appear. Plugin should still work if it auto-registered.');
      }
    } else {
      console.log('✓ Annotation plugin already registered:', annotationRegistered);
    }

    console.log('Chart.js and annotation plugin loaded successfully');

    chartLibraryLoaded = true;
    return true;
  } catch (error) {
    console.error('Failed to load Chart.js or annotation plugin:', error);
    return false;
  }
}

/**
 * Render Chart.js histogram
 * AC: X-axis: Date range, Y-axis: Prediction count
 * AC: Median marked with vertical line
 * AC: User's prediction highlighted (if available)
 *
 * @param {object} config - Chart configuration {buckets, medianDate, userPrediction?, theme}
 */
function renderChart(config) {
  if (!chartElements || !chartElements.canvas) {
    console.error('Chart canvas element not found');
    return;
  }

  const { buckets, medianDate, userPrediction, theme = 'dark' } = config;

  // Destroy existing chart instance if exists
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  // Prepare dataset
  const labels = buckets.map(b => b.label);
  const data = buckets.map(b => b.count);

  // Find median bucket index for highlighting
  let medianBucketIndex = -1;
  if (medianDate) {
    const median = new Date(medianDate);
    medianBucketIndex = buckets.findIndex(b => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      return median >= start && median <= end;
    });
  }

  // Find user prediction bucket index for highlighting
  let userBucketIndex = -1;
  if (userPrediction) {
    const userDate = new Date(userPrediction);
    userBucketIndex = buckets.findIndex(b => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      return userDate >= start && userDate <= end;
    });
  }

  // Create background colors (Pink for 2026, Purple for others, Blue for user)
  const backgroundColors = buckets.map((bucket, index) => {
    if (index === userBucketIndex) {
      return '#0ea5e9'; // gta-blue for user's bucket
    }
    // Check if bucket is in 2026
    if (bucket.startDate.includes('2026') || bucket.endDate.includes('2026')) {
      return '#db2777'; // gta-pink
    }
    return '#7c3aed'; // gta-purple
  });

  // Chart.js configuration
  const ctx = chartElements.canvas.getContext('2d');

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Number of Predictions',
        data: data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors,
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: false // Title handled by HTML
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function (context) {
              const bucket = buckets[context.dataIndex];
              return [
                `Count: ${context.parsed.y}`,
                `Period: ${bucket.startDate} to ${bucket.endDate}`
              ];
            }
          }
        },
        // Add median line annotation
        annotation: medianBucketIndex !== -1 ? {
          annotations: {
            medianLine: {
              type: 'line',
              xMin: medianBucketIndex,
              xMax: medianBucketIndex,
              borderColor: '#db2777', // gta-pink
              borderWidth: 2,
              borderDash: [5, 5],
              label: {
                display: true,
                content: 'Median',
                position: 'start',
                backgroundColor: '#db2777',
                color: '#ffffff',
                font: {
                  size: 12,
                  weight: 'bold',
                  family: 'Inter'
                },
                padding: 6,
                borderRadius: 4
              }
            }
          }
        } : undefined
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            color: '#94a3b8',
            font: {
              family: 'Inter',
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#334155',
            drawBorder: false
          },
          ticks: {
            color: '#94a3b8',
            font: {
              family: 'Inter',
              size: 11
            },
            precision: 0
          }
        }
      }
    }
  });

  console.log('Chart rendered successfully');
}

/**
 * Create accessible data table alternative
 * AC: Data table alternative available for screen readers
 *
 * @param {Array} buckets - Histogram buckets
 */
function createDataTable(buckets) {
  if (!chartElements || !chartElements.dataTable) {
    return;
  }

  // Clear existing table
  chartElements.dataTable.innerHTML = '';

  // Create table element
  const table = document.createElement('table');
  table.setAttribute('role', 'table');

  // Create caption
  const caption = document.createElement('caption');
  caption.textContent = 'Prediction Distribution Data';
  table.appendChild(caption);

  // Create header row
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.setAttribute('role', 'row');

  const headers = ['Date Range', 'Number of Predictions'];
  headers.forEach(headerText => {
    const th = document.createElement('th');
    th.setAttribute('role', 'columnheader');
    th.textContent = headerText;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create body rows
  const tbody = document.createElement('tbody');

  buckets.forEach(bucket => {
    const row = document.createElement('tr');
    row.setAttribute('role', 'row');

    // Date range cell
    const dateCell = document.createElement('td');
    dateCell.setAttribute('role', 'cell');
    dateCell.textContent = `${bucket.startDate} to ${bucket.endDate}`;
    row.appendChild(dateCell);

    // Count cell
    const countCell = document.createElement('td');
    countCell.setAttribute('role', 'cell');
    countCell.textContent = bucket.count.toString();
    row.appendChild(countCell);

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  chartElements.dataTable.appendChild(table);

  console.log('Data table created for accessibility');
}

/**
 * Toggle chart visibility with animation
 * AC: Toggle button changes text ("Show" <-> "Hide")
 * AC: Chart expands with smooth animation
 *
 * @returns {Promise<void>}
 */
async function toggleChart() {
  if (!chartElements) {
    initChartElements();
  }

  if (!isChartExpanded) {
    // Expanding: Show loading, load Chart.js, render chart
    console.log('Expanding chart...');

    // Update button text and ARIA (if toggle button exists - old UI)
    if (chartElements.toggleText && chartElements.toggleBtn) {
      chartElements.toggleText.textContent = 'Hide Chart';
      chartElements.toggleBtn.setAttribute('aria-expanded', 'true');
      chartElements.toggleBtn.setAttribute('aria-label', 'Hide prediction distribution chart');
    }

    // Show container with loading indicator
    if (chartElements.container) {
      chartElements.container.classList.remove('hidden');
    }
    if (chartElements.loading) {
      chartElements.loading.classList.remove('hidden');
    }
    if (chartElements.canvas) {
      chartElements.canvas.classList.add('hidden');
    }

    // Load Chart.js library (lazy loading)
    const loaded = await loadChartLibrary();

    if (!loaded) {
      // Failed to load Chart.js
      chartElements.loading.innerHTML = `
        <div class="alert alert-error shadow-lg">
          <svg class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Failed to load chart library. Please try again.</span>
        </div>
      `;
      return;
    }

    // Fetch stats and predictions data for chart
    try {
      // Fetch both stats and predictions in parallel (Story 3.4b)
      const [statsResponse, predictionsResponse] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/predictions')
      ]);

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch stats');
      }

      const statsResult = await statsResponse.json();
      const stats = statsResult.data || statsResult;

      // Fetch prediction distribution data (Story 3.4b)
      // Falls back to empty array if endpoint fails (graceful degradation)
      let predictionData = [];
      if (predictionsResponse.ok) {
        const predictionsResult = await predictionsResponse.json();
        predictionData = predictionsResult.data || [];
        console.log('Predictions data loaded', {
          total: predictionsResult.total_predictions,
          unique_dates: predictionData.length
        });
      } else {
        console.warn('Predictions endpoint failed, showing empty chart');
      }

      // Prepare histogram data with real prediction counts
      const buckets = prepareHistogramData(stats, predictionData);

      // Get user's prediction from cookie (if exists)
      const userPrediction = window.userLastPrediction || null;

      // Detect theme from HTML attribute with validation
      const themeAttr = document.documentElement.getAttribute('data-theme');
      const theme = (themeAttr === 'light' || themeAttr === 'dark') ? themeAttr : 'dark';

      // Render chart
      renderChart({
        buckets,
        medianDate: stats.median,
        userPrediction,
        theme
      });

      // Create accessible data table
      createDataTable(buckets);

      // Hide loading, show canvas
      if (chartElements.loading) {
        chartElements.loading.classList.add('hidden');
      }
      if (chartElements.canvas) {
        chartElements.canvas.classList.remove('hidden');
      }

      isChartExpanded = true;

      console.log('Chart expanded successfully');
    } catch (error) {
      console.error('Failed to render chart:', error);

      if (chartElements.loading) {
        chartElements.loading.innerHTML = `
          <div class="alert alert-error shadow-lg">
            <svg class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Failed to render chart. Please try again.</span>
          </div>
        `;
      }
    }
  } else {
    // Collapsing: Hide chart
    console.log('Collapsing chart...');

    // Update button text and ARIA (if toggle button exists - old UI)
    if (chartElements.toggleText && chartElements.toggleBtn) {
      chartElements.toggleText.textContent = 'Show Prediction Distribution';
      chartElements.toggleBtn.setAttribute('aria-expanded', 'false');
      chartElements.toggleBtn.setAttribute('aria-label', 'Show prediction distribution chart');
    }

    // Hide container with smooth animation
    if (chartElements.container) {
      chartElements.container.classList.add('hidden');
    }

    isChartExpanded = false;

    console.log('Chart collapsed successfully');
  }
}

/**
 * Initialize chart module
 * Auto-loads chart if container exists and has 50+ predictions
 */
async function initChart() {
  initChartElements();

  // Check if we have enough predictions to show the chart (minimum 50)
  try {
    const response = await fetch('/api/stats');
    if (!response.ok) {
      console.warn('Failed to fetch stats for chart threshold check');
      return;
    }

    const result = await response.json();
    const stats = result.data || result;
    const totalPredictions = stats.total || 0;

    console.log(`Chart init: ${totalPredictions} predictions (threshold: 50)`);

    // Only show chart if we have 50+ predictions
    if (totalPredictions < 50) {
      console.log('Not enough predictions to show chart (need 50)');
      if (chartElements && chartElements.container) {
        chartElements.container.classList.add('hidden');
      }
      return;
    }

    // Auto-load chart if canvas exists (new UI behavior)
    if (chartElements && chartElements.canvas) {
      // Check if already loaded or loading to prevent double-init
      if (!isChartExpanded) {
        toggleChart(); // This function handles loading and rendering
      }
    } else if (chartElements && chartElements.toggleBtn) {
      // Fallback for old UI with toggle button
      chartElements.toggleBtn.addEventListener('click', toggleChart);
      console.log('Chart toggle initialized');
    }
  } catch (error) {
    console.error('Error checking prediction count for chart:', error);
  }
}

// Initialize chart module on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChart);
} else {
  initChart();
}

// Make initChart available globally for submission.js to trigger after threshold
window.initChart = initChart;

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    prepareHistogramData,
    loadChartLibrary,
    renderChart,
    createDataTable,
    toggleChart,
    initChart
  };
}
