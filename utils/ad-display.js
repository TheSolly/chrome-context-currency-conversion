/**
 * Ad Display Components for Chrome Currency Conversion Extension
 * Handles rendering of ads in different locations and formats
 */

import { adManager } from './ad-manager.js';

class AdDisplay {
  /**
   * Create and insert an ad element at a specified location
   * @param {string} location - UI location (popup, history, etc.)
   * @param {string} position - Position within the location (bottom, sidebar, etc.)
   * @param {HTMLElement} container - Container element to insert the ad into
   * @returns {HTMLElement|null} - The created ad element or null if no ad should be shown
   */
  createAdElement(location, position, container) {
    // Check if we should show an ad at this location and position
    const adConfig = adManager.getAd(location, position);
    if (!adConfig) return null;

    // Create ad container
    const adElement = document.createElement('div');
    adElement.className = `ad-container ad-format-${adConfig.format} ad-position-${position}`;
    adElement.id = adConfig.container;
    adElement.setAttribute('aria-label', 'Advertisement');
    adElement.setAttribute('role', 'complementary');

    // Create ad label (for transparency and compliance)
    const adLabel = document.createElement('div');
    adLabel.className = 'ad-label';
    adLabel.textContent = 'Advertisement';
    adElement.appendChild(adLabel);

    // Create ad content container
    const adContent = document.createElement('div');
    adContent.className = 'ad-content';
    adElement.appendChild(adContent);

    // Add event listener for tracking clicks
    adElement.addEventListener('click', () => {
      adManager.trackAdClick(location, position);
    });

    // Apply format-specific styling
    this.applyAdStyle(adElement, adConfig.format, position);

    // Attach to container
    container.appendChild(adElement);

    // Load ad content (this would normally be calling the ad network's API)
    this.loadAdContent(adContent, adConfig);

    return adElement;
  }

  /**
   * Apply styling to ad element based on format and position
   * @param {HTMLElement} element - The ad element
   * @param {string} format - Ad format (banner, native, etc.)
   * @param {string} position - Ad position (bottom, sidebar, etc.)
   */
  applyAdStyle(element, format, position) {
    // Base styles for all ads
    element.style.boxSizing = 'border-box';
    element.style.borderRadius = '8px';
    element.style.overflow = 'hidden';
    element.style.margin = '8px 0';
    element.style.backgroundColor = '#f9f9f9';
    element.style.border = '1px solid #e0e0e0';

    // Format-specific styles
    switch (format) {
      case 'banner':
        element.style.width = '100%';
        element.style.height = '90px';
        break;
      case 'native':
        element.style.width = '100%';
        element.style.minHeight = '120px';
        element.style.padding = '12px';
        break;
      case 'interstitial':
        // Interstitials are handled differently - they're full screen overlays
        element.style.position = 'fixed';
        element.style.top = '0';
        element.style.left = '0';
        element.style.width = '100%';
        element.style.height = '100%';
        element.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        element.style.zIndex = '9999';
        break;
    }

    // Position-specific styles
    switch (position) {
      case 'bottom':
        element.style.marginTop = 'auto';
        break;
      case 'sidebar':
        element.style.marginLeft = '8px';
        element.style.width = '160px';
        break;
      case 'betweenItems':
        element.style.margin = '16px 0';
        break;
    }

    // Style for ad label
    const adLabel = element.querySelector('.ad-label');
    if (adLabel) {
      adLabel.style.fontSize = '10px';
      adLabel.style.textTransform = 'uppercase';
      adLabel.style.color = '#888';
      adLabel.style.marginBottom = '4px';
    }
  }

  /**
   * Load ad content from the ad network
   * @param {HTMLElement} container - The ad content container
   * @param {Object} config - Ad configuration
   */
  loadAdContent(container, config) {
    // In a real implementation, this would integrate with the ad network's API
    // For now, we'll create a placeholder ad

    if (config.format === 'banner') {
      // Simple banner ad
      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: linear-gradient(135deg, #f0f0f0, #e0e0e0);">
          <span style="font-size: 14px; color: #555;">
            ${config.network} Banner Ad - ${config.variant ? `Variant ${config.variant}` : 'Standard'}
          </span>
        </div>
      `;
    } else if (config.format === 'native') {
      // Native ad with more content
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; height: 100%;">
          <div style="font-weight: bold; margin-bottom: 8px; color: #333;">
            Premium Currency Tools
          </div>
          <div style="font-size: 12px; color: #555; margin-bottom: 8px;">
            Enhance your currency conversion experience with professional tools.
          </div>
          <div style="font-size: 12px; color: #007bff; cursor: pointer;">
            Learn More
          </div>
          <div style="font-size: 10px; color: #999; margin-top: 8px;">
            ${config.network} - ${config.variant ? `Variant ${config.variant}` : 'Standard'}
          </div>
        </div>
      `;
    }
  }

  /**
   * Create an interstitial ad (full screen overlay)
   * @param {string} reason - Reason for showing the interstitial
   * @returns {HTMLElement|null} - The created interstitial element or null if none should be shown
   */
  createInterstitialAd(reason) {
    try {
      // Only show interstitials to non-premium users
      const adConfig = adManager.getAd('interstitial', 'fullscreen');
      if (!adConfig) {
        console.log('No interstitial ad config available');
        return null;
      }

      // Create interstitial container
      const interstitial = document.createElement('div');
      interstitial.className = 'ad-interstitial';
      interstitial.id = 'ad-interstitial';

      // Style the interstitial
      interstitial.style.position = 'fixed';
      interstitial.style.top = '0';
      interstitial.style.left = '0';
      interstitial.style.width = '100%';
      interstitial.style.height = '100%';
      interstitial.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      interstitial.style.zIndex = '9999';
      interstitial.style.display = 'flex';
      interstitial.style.flexDirection = 'column';
      interstitial.style.alignItems = 'center';
      interstitial.style.justifyContent = 'center';

      // Create close button
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close Ad';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '16px';
      closeButton.style.right = '16px';
      closeButton.style.padding = '8px 16px';
      closeButton.style.background = '#007bff';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '4px';
      closeButton.style.cursor = 'pointer';

      // Create ad content
      const adContent = document.createElement('div');
      adContent.style.width = '80%';
      adContent.style.maxWidth = '600px';
      adContent.style.padding = '24px';
      adContent.style.backgroundColor = 'white';
      adContent.style.borderRadius = '8px';
      adContent.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';

      // Add content to interstitial
      interstitial.appendChild(closeButton);
      interstitial.appendChild(adContent);

      // Close button functionality
      closeButton.addEventListener('click', () => {
        if (document.body.contains(interstitial)) {
          document.body.removeChild(interstitial);
          adManager.trackAdClick('interstitial', 'close');
        }
      });

      // Load ad content
      this.loadAdContent(adContent, adConfig);

      // Ensure body exists before appending
      if (document.body) {
        document.body.appendChild(interstitial);

        // Auto-close after 15 seconds
        setTimeout(() => {
          if (document.body.contains(interstitial)) {
            document.body.removeChild(interstitial);
          }
        }, 15000);

        console.log('Interstitial ad displayed successfully', reason);
        return interstitial;
      } else {
        console.error(
          'Cannot append interstitial: document.body not available'
        );
        return null;
      }
    } catch (error) {
      console.error('Error creating interstitial ad:', error.message || error);
      return null;
    }
  }

  /**
   * Check if interstitial ads are allowed at the current moment
   * @returns {boolean} Whether interstitial ads are allowed
   */
  canShowInterstitial() {
    try {
      // Get last interstitial time from storage
      const lastInterstitial = localStorage.getItem('lastInterstitialTime');
      const now = Date.now();

      // Only show interstitial once per hour maximum
      if (lastInterstitial && now - parseInt(lastInterstitial) < 3600000) {
        console.log(
          'Interstitial cooldown active, last shown:',
          new Date(parseInt(lastInterstitial)).toLocaleTimeString()
        );
        return false;
      }

      // Set last interstitial time
      localStorage.setItem('lastInterstitialTime', now.toString());
      console.log('Interstitial cooldown reset, now eligible');
      return true;
    } catch (error) {
      console.error(
        'Error checking interstitial eligibility:',
        error.message || error
      );
      return false; // Default to not showing on error
    }
  }
}

// Create and export singleton instance
export const adDisplay = new AdDisplay();
export default adDisplay;
