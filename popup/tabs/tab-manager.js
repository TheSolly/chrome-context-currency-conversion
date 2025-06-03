/**
 * Tab Manager - Handles tab navigation and coordination between different tab modules
 */

// Import all tab modules
import { SettingsTab } from './settings-tab.js';
import { HistoryTab } from './history-tab.js';
import { FavoritesTab } from './favorites-tab.js';
import { AlertsTab } from './alerts-tab.js';
import { SubscriptionTab } from './subscription-tab.js';

export class TabManager {
  constructor() {
    this.currentActiveTab = 'settings';
    this.tabs = {};
    this.initialized = false;
  }

  /**
   * Initialize all tabs and set up navigation
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize tab instances
      this.tabs.settings = new SettingsTab();
      this.tabs.history = new HistoryTab();
      this.tabs.favorites = new FavoritesTab();
      this.tabs.alerts = new AlertsTab();
      this.tabs.subscription = new SubscriptionTab();

      // Initialize each tab
      await Promise.all([
        this.tabs.settings.initialize(),
        this.tabs.history.initialize(),
        this.tabs.favorites.initialize(),
        this.tabs.alerts.initialize(),
        this.tabs.subscription.initialize()
      ]);

      // Setup tab navigation
      this.setupTabNavigation();

      // Set initial active tab
      this.switchTab('settingsPanel');

      this.initialized = true;
      console.log('✅ Tab manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize tab manager:', error);
      throw error;
    }
  }

  /**
   * Setup tab navigation event listeners
   */
  setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    console.log(
      `🔧 Setting up navigation for ${tabButtons.length} tab buttons`
    );

    tabButtons.forEach((button, index) => {
      const targetPanel = button.getAttribute('aria-controls');
      console.log(`📋 Tab button ${index}: ${button.id} -> ${targetPanel}`);

      button.addEventListener('click', e => {
        e.preventDefault();
        console.log(`🖱️ Tab clicked: ${button.id} -> ${targetPanel}`);
        if (targetPanel) {
          this.switchTab(targetPanel);
        }
      });
    });
  }

  /**
   * Switch to a specific tab
   */
  async switchTab(targetPanelId) {
    try {
      console.log(`🔄 Switching to tab: ${targetPanelId}`);
      const tabButtons = document.querySelectorAll('.tab-button');
      const tabPanels = document.querySelectorAll('.tab-panel');
      console.log(
        `📋 Found ${tabButtons.length} buttons, ${tabPanels.length} panels`
      );

      // Update button states
      tabButtons.forEach(button => {
        const isActive = button.getAttribute('aria-controls') === targetPanelId;
        button.classList.toggle('active', isActive);
        button.classList.toggle('tab-active', isActive);
        button.setAttribute('aria-selected', isActive.toString());
        button.setAttribute('tabindex', isActive ? '0' : '-1');
      });

      // Update panel visibility
      tabPanels.forEach(panel => {
        const isActive = panel.id === targetPanelId;
        panel.classList.toggle('hidden', !isActive);
        panel.classList.toggle('active', isActive);
        console.log(`📄 Panel ${panel.id}: ${isActive ? 'visible' : 'hidden'}`);
      });

      // Update current active tab
      this.currentActiveTab = targetPanelId.replace('Panel', '');

      // Load content for specific tabs
      await this.loadTabContent(targetPanelId);

      console.log(`📋 Switched to tab: ${this.currentActiveTab}`);
    } catch (error) {
      console.error(`❌ Failed to switch to tab ${targetPanelId}:`, error);
    }
  }

  /**
   * Load content for specific tabs when they become active
   */
  async loadTabContent(targetPanelId) {
    try {
      switch (targetPanelId) {
        case 'historyPanel':
          await this.tabs.history.loadContent();
          break;
        case 'favoritesPanel':
          await this.tabs.favorites.loadContent();
          break;
        case 'alertsPanel':
          await this.tabs.alerts.loadContent();
          break;
        case 'subscriptionPanel':
          await this.tabs.subscription.loadContent();
          break;
        case 'settingsPanel':
          await this.tabs.settings.loadContent();
          break;
      }
    } catch (error) {
      console.error(`❌ Failed to load content for ${targetPanelId}:`, error);
    }
  }

  /**
   * Get the currently active tab instance
   */
  getActiveTab() {
    return this.tabs[this.currentActiveTab];
  }

  /**
   * Get a specific tab instance
   */
  getTab(tabName) {
    return this.tabs[tabName];
  }

  /**
   * Refresh all tabs
   */
  async refreshAllTabs() {
    try {
      await Promise.all(Object.values(this.tabs).map(tab => tab.refresh?.()));
    } catch (error) {
      console.error('❌ Failed to refresh tabs:', error);
    }
  }

  /**
   * Update all tabs with new settings
   */
  async updateTabsWithSettings(newSettings) {
    try {
      await Promise.all(
        Object.values(this.tabs).map(tab => tab.updateSettings?.(newSettings))
      );
    } catch (error) {
      console.error('❌ Failed to update tabs with settings:', error);
    }
  }

  /**
   * Handle global events that affect multiple tabs
   */
  handleGlobalEvent(eventType, data) {
    Object.values(this.tabs).forEach(tab => {
      if (tab.handleGlobalEvent) {
        tab.handleGlobalEvent(eventType, data);
      }
    });
  }
}
