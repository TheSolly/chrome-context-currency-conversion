/**
 * SettingsCard Component
 * Creates settings section card containers
 */

/* global HTMLElement */

/**
 * Create a settings card container
 * @param {Object} options - Card options
 * @param {string} options.id - Unique identifier
 * @param {string} options.icon - Icon emoji
 * @param {string} options.title - Section title
 * @param {string} [options.badge] - Optional badge text (e.g., "Free: 3 max")
 * @param {HTMLElement[]|string} [options.content] - Content elements or HTML string
 * @param {string} [options.ariaLabel] - Custom aria label
 * @returns {HTMLElement} The settings card element
 */
export function createSettingsCard({
  id,
  icon,
  title,
  badge = '',
  content = null,
  ariaLabel = ''
}) {
  const section = document.createElement('section');
  section.id = id;
  section.className = 'setting-card';
  section.setAttribute('role', 'region');
  section.setAttribute('aria-labelledby', `${id}-heading`);

  if (ariaLabel) {
    section.setAttribute('aria-label', ariaLabel);
  }

  // Header
  const header = document.createElement('div');
  header.className = badge
    ? 'flex items-center justify-between mb-3'
    : 'flex items-center gap-2 mb-3';

  const titleContainer = document.createElement('div');
  titleContainer.className = 'flex items-center gap-2';

  const iconEl = document.createElement('span');
  iconEl.className = 'text-lg';
  iconEl.setAttribute('aria-hidden', 'true');
  iconEl.textContent = icon;

  const titleEl = document.createElement('h2');
  titleEl.id = `${id}-heading`;
  titleEl.className = 'text-base font-semibold text-gray-900';
  titleEl.textContent = title;

  titleContainer.appendChild(iconEl);
  titleContainer.appendChild(titleEl);
  header.appendChild(titleContainer);

  if (badge) {
    const badgeEl = document.createElement('span');
    badgeEl.className = 'feature-badge';
    badgeEl.textContent = badge;
    header.appendChild(badgeEl);
  }

  section.appendChild(header);

  // Content container
  const contentContainer = document.createElement('div');
  contentContainer.className = 'space-y-3';
  contentContainer.id = `${id}-content`;

  if (content) {
    if (typeof content === 'string') {
      contentContainer.innerHTML = content;
    } else if (Array.isArray(content)) {
      content.forEach(el => contentContainer.appendChild(el));
    } else if (content instanceof HTMLElement) {
      contentContainer.appendChild(content);
    }
  }

  section.appendChild(contentContainer);

  // Expose methods for external control
  section.card = {
    getContentContainer: () => contentContainer,
    setContent: newContent => {
      contentContainer.innerHTML = '';
      if (typeof newContent === 'string') {
        contentContainer.innerHTML = newContent;
      } else if (Array.isArray(newContent)) {
        newContent.forEach(el => contentContainer.appendChild(el));
      } else if (newContent instanceof HTMLElement) {
        contentContainer.appendChild(newContent);
      }
    },
    appendContent: element => {
      contentContainer.appendChild(element);
    },
    setBadge: badgeText => {
      const existingBadge = header.querySelector('.feature-badge');
      if (existingBadge) {
        existingBadge.textContent = badgeText;
      }
    }
  };

  return section;
}

/**
 * Create a gradient stat card (like the "Conversions Today" card)
 * @param {Object} options - Card options
 * @param {string} options.label - Stat label
 * @param {string} options.valueId - ID for the value element
 * @param {string} [options.initialValue='0'] - Initial value
 * @param {string} [options.gradient='from-blue-50 to-purple-50'] - Gradient classes
 * @returns {HTMLElement} The stat card element
 */
export function createStatCard({
  label,
  valueId,
  initialValue = '0',
  gradient = 'from-blue-50 to-purple-50'
}) {
  const container = document.createElement('div');
  container.className = `bg-gradient-to-r ${gradient} rounded-lg p-3`;

  const inner = document.createElement('div');
  inner.className = 'flex items-center justify-between text-sm';

  const labelEl = document.createElement('span');
  labelEl.className = 'text-gray-600';
  labelEl.textContent = label;

  const valueEl = document.createElement('span');
  valueEl.id = valueId;
  valueEl.className = 'font-semibold text-primary-600';
  valueEl.textContent = initialValue;

  inner.appendChild(labelEl);
  inner.appendChild(valueEl);
  container.appendChild(inner);

  container.stat = {
    getValue: () => valueEl.textContent,
    setValue: value => {
      valueEl.textContent = value;
    }
  };

  return container;
}

/**
 * Create a small stat item for grid layouts
 * @param {Object} options - Stat options
 * @param {string} options.label - Stat label
 * @param {string} options.valueId - ID for the value element
 * @param {string} [options.initialValue='--'] - Initial value
 * @returns {HTMLElement} The stat item element
 */
export function createStatItem({ label, valueId, initialValue = '--' }) {
  const container = document.createElement('div');
  container.className = 'stat-item';

  const labelEl = document.createElement('span');
  labelEl.className = 'text-gray-600';
  labelEl.textContent = label;

  const valueEl = document.createElement('span');
  valueEl.id = valueId;
  valueEl.className = 'font-semibold text-primary-600';
  valueEl.textContent = initialValue;

  container.appendChild(labelEl);
  container.appendChild(valueEl);

  container.stat = {
    setValue: value => {
      valueEl.textContent = value;
    }
  };

  return container;
}

/**
 * Create a promotional/upgrade card
 * @param {Object} options - Card options
 * @param {string} options.icon - Icon emoji
 * @param {string} options.title - Card title
 * @param {string} options.description - Card description
 * @param {string} options.buttonText - CTA button text
 * @param {Function} options.onButtonClick - Button click handler
 * @returns {HTMLElement} The promo card element
 */
export function createPromoCard({
  icon,
  title,
  description,
  buttonText,
  onButtonClick
}) {
  const section = document.createElement('section');
  section.className = 'premium-upgrade-card rounded-xl relative overflow-hidden';
  section.style.cssText = 'background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); padding: 1px;';

  const innerBg = document.createElement('div');
  innerBg.className = 'rounded-xl';
  innerBg.style.cssText = 'background: linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%); padding: 16px;';

  const inner = document.createElement('div');
  inner.style.cssText = 'display: flex; align-items: center; gap: 14px;';

  // Icon wrapper with gradient background
  const iconWrapper = document.createElement('div');
  iconWrapper.style.cssText = 'flex-shrink: 0; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35);';

  const iconEl = document.createElement('span');
  iconEl.style.cssText = 'font-size: 22px; line-height: 1;';
  iconEl.textContent = icon;
  iconWrapper.appendChild(iconEl);

  const content = document.createElement('div');
  content.style.cssText = 'flex: 1; min-width: 0;';

  const titleEl = document.createElement('h3');
  titleEl.style.cssText = 'font-size: 14px; font-weight: 700; color: #5b21b6; margin: 0 0 2px 0;';
  titleEl.textContent = title;

  const descEl = document.createElement('p');
  descEl.style.cssText = 'font-size: 12px; color: #6b7280; margin: 0 0 10px 0;';
  descEl.textContent = description;

  const button = document.createElement('button');
  button.className = 'transition-all duration-200 hover:shadow-lg';
  button.style.cssText = 'font-size: 12px; padding: 6px 16px; border-radius: 8px; font-weight: 600; color: white; background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); border: none; cursor: pointer;';
  button.textContent = buttonText;
  button.addEventListener('click', onButtonClick);

  content.appendChild(titleEl);
  content.appendChild(descEl);
  content.appendChild(button);

  inner.appendChild(iconWrapper);
  inner.appendChild(content);
  innerBg.appendChild(inner);
  section.appendChild(innerBg);

  return section;
}
