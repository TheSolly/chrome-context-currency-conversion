/**
 * Ad A/B Testing Analysis Tool
 * A utility for visualizing and analyzing A/B testing results for advertisements
 */

import { adManager } from './ad-manager.js';

export class AdTestingAnalyzer {
  constructor() {
    this.testData = null;
    this.container = null;
    this.chart = null;
  }

  /**
   * Initialize the analyzer with a container element
   * @param {HTMLElement} container - The container to render the analysis in
   */
  initialize(container) {
    this.container = container;

    // Create basic structure
    this.container.innerHTML = `
      <div class="ad-testing-analyzer">
        <h3 class="text-lg font-medium mb-2">Ad A/B Testing Results</h3>
        <div class="text-sm text-gray-600 mb-3">
          Performance metrics for advertisement variants
        </div>
        
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-title">Impressions</div>
            <div class="metric-values">
              <div class="variant-a">
                <span class="variant-label">A:</span>
                <span class="variant-value" id="impressions-a">0</span>
              </div>
              <div class="variant-b">
                <span class="variant-label">B:</span>
                <span class="variant-value" id="impressions-b">0</span>
              </div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-title">Clicks</div>
            <div class="metric-values">
              <div class="variant-a">
                <span class="variant-label">A:</span>
                <span class="variant-value" id="clicks-a">0</span>
              </div>
              <div class="variant-b">
                <span class="variant-label">B:</span>
                <span class="variant-value" id="clicks-b">0</span>
              </div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-title">CTR (%)</div>
            <div class="metric-values">
              <div class="variant-a">
                <span class="variant-label">A:</span>
                <span class="variant-value" id="ctr-a">0.00%</span>
              </div>
              <div class="variant-b">
                <span class="variant-label">B:</span>
                <span class="variant-value" id="ctr-b">0.00%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="chart-container" id="ab-test-chart">
          <div class="chart-bar-container">
            <div class="chart-label">CTR</div>
            <div class="chart-bars">
              <div class="chart-bar variant-a-bar" style="width: 0%">
                <span class="chart-bar-label">A</span>
                <span class="chart-bar-value">0.00%</span>
              </div>
              <div class="chart-bar variant-b-bar" style="width: 0%">
                <span class="chart-bar-label">B</span>
                <span class="chart-bar-value">0.00%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="ab-test-conclusion">
          <div class="conclusion-title">Analysis:</div>
          <div class="conclusion-text" id="test-conclusion">
            Insufficient data to determine a winning variant.
          </div>
        </div>
        
        <style>
          .ad-testing-analyzer {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 16px;
            margin-top: 16px;
          }
          
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 16px;
          }
          
          .metric-card {
            background-color: white;
            border-radius: 6px;
            padding: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .metric-title {
            font-weight: 500;
            font-size: 14px;
            margin-bottom: 8px;
          }
          
          .metric-values {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          
          .variant-a, .variant-b {
            display: flex;
            justify-content: space-between;
          }
          
          .variant-label {
            font-weight: 500;
            color: #555;
          }
          
          .variant-value {
            font-family: monospace;
          }
          
          .chart-container {
            background-color: white;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .chart-bar-container {
            margin-bottom: 8px;
          }
          
          .chart-label {
            font-weight: 500;
            margin-bottom: 4px;
          }
          
          .chart-bars {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .chart-bar {
            height: 24px;
            background-color: #4285f4;
            border-radius: 3px;
            position: relative;
            color: white;
            display: flex;
            align-items: center;
            padding: 0 8px;
            box-sizing: border-box;
            transition: width 0.5s ease;
            min-width: 60px;
          }
          
          .chart-bar-label {
            font-weight: 600;
            margin-right: 8px;
          }
          
          .chart-bar-value {
            margin-left: auto;
            font-family: monospace;
          }
          
          .variant-a-bar {
            background-color: #4285f4;
          }
          
          .variant-b-bar {
            background-color: #ea4335;
          }
          
          .ab-test-conclusion {
            background-color: white;
            border-radius: 6px;
            padding: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .conclusion-title {
            font-weight: 500;
            margin-bottom: 4px;
          }
          
          .conclusion-text {
            font-size: 14px;
            color: #555;
          }
        </style>
      </div>
    `;

    // Load data
    this.loadData();
  }

  /**
   * Load A/B testing data
   */
  async loadData() {
    try {
      // Get results from ad manager
      this.testData = adManager.getAbTestResults();

      // Update the UI with the data
      this.updateUI();

      console.log('✅ A/B testing data loaded:', this.testData);
    } catch (error) {
      console.error('❌ Failed to load A/B testing data:', error);
    }
  }

  /**
   * Update the UI with current data
   */
  updateUI() {
    if (!this.testData) return;

    const { impressions, clicks, ctr } = this.testData;

    // Update impressions
    document.getElementById('impressions-a').textContent =
      impressions.A.toLocaleString();
    document.getElementById('impressions-b').textContent =
      impressions.B.toLocaleString();

    // Update clicks
    document.getElementById('clicks-a').textContent = clicks.A.toLocaleString();
    document.getElementById('clicks-b').textContent = clicks.B.toLocaleString();

    // Update CTR
    document.getElementById('ctr-a').textContent = ctr.A.toFixed(2) + '%';
    document.getElementById('ctr-b').textContent = ctr.B.toFixed(2) + '%';

    // Update chart
    const maxCtr = Math.max(ctr.A, ctr.B, 0.1); // Minimum 0.1% to avoid division by zero
    const variantAWidth = Math.max((ctr.A / maxCtr) * 100, 5); // Minimum width for visibility
    const variantBWidth = Math.max((ctr.B / maxCtr) * 100, 5); // Minimum width for visibility

    const variantABar = document.querySelector('.variant-a-bar');
    const variantBBar = document.querySelector('.variant-b-bar');

    variantABar.style.width = `${variantAWidth}%`;
    variantBBar.style.width = `${variantBWidth}%`;

    variantABar.querySelector('.chart-bar-value').textContent =
      ctr.A.toFixed(2) + '%';
    variantBBar.querySelector('.chart-bar-value').textContent =
      ctr.B.toFixed(2) + '%';

    // Update conclusion
    const conclusionText = document.getElementById('test-conclusion');

    if (impressions.A < 100 || impressions.B < 100) {
      conclusionText.textContent =
        'Insufficient data to determine a winning variant. Continue testing.';
    } else if (Math.abs(ctr.A - ctr.B) < 0.5) {
      conclusionText.textContent =
        'No significant difference between variants. Consider testing new variants.';
    } else if (ctr.A > ctr.B) {
      const improvement = (((ctr.A - ctr.B) / ctr.B) * 100).toFixed(1);
      conclusionText.textContent = `Variant A outperforms Variant B by ${improvement}%. Consider using Variant A.`;
    } else {
      const improvement = (((ctr.B - ctr.A) / ctr.A) * 100).toFixed(1);
      conclusionText.textContent = `Variant B outperforms Variant A by ${improvement}%. Consider using Variant B.`;
    }
  }

  /**
   * Add a test result viewer to a container
   * @param {HTMLElement} container - The container to add the viewer to
   */
  static addToContainer(container) {
    const analyzer = new AdTestingAnalyzer();
    analyzer.initialize(container);
    return analyzer;
  }
}

export default AdTestingAnalyzer;
