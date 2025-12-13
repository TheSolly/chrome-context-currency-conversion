/**
 * Security Module - Consolidated Exports
 *
 * This barrel file provides organized exports for all security-related functionality.
 *
 * PRODUCTION MODULES:
 * - SecurityManager: Core security (input validation, rate limiting, encryption)
 * - SecureApiKeyManager: API key storage and management
 *
 * DEV/TESTING MODULES (for security auditing):
 * - SecurityAudit: Automated security testing
 * - SecurityTestRunner: Orchestrates security tests
 * - SecurityBestPractices: Best practices checker
 * - PenetrationTesting: Simulated penetration tests
 */

// ============================================
// PRODUCTION EXPORTS (Core Security)
// ============================================

export { SecurityManager, securityManager } from '../security-manager.js';

export {
  SecureApiKeyManager,
  secureApiKeyManager
} from '../secure-api-key-manager.js';

// ============================================
// DEV/TESTING EXPORTS (Security Auditing)
// ============================================

export { SecurityAudit, securityAudit } from '../security-audit.js';

export {
  SecurityTestRunner,
  securityTestRunner
} from '../security-test-runner.js';

export {
  SecurityBestPractices,
  securityBestPractices
} from '../security-best-practices.js';

export {
  PenetrationTesting,
  penetrationTesting
} from '../penetration-testing.js';

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Initialize all security modules
 * @returns {Promise<void>}
 */
export async function initializeSecurity() {
  const { securityManager } = await import('../security-manager.js');
  await securityManager.initialize();

  const { secureApiKeyManager } = await import('../secure-api-key-manager.js');
  await secureApiKeyManager.initialize();
}

/**
 * Run quick security check (for development/debugging)
 * @returns {Promise<Object>} Quick check results
 */
export async function runQuickSecurityCheck() {
  const { securityTestRunner } = await import('../security-test-runner.js');
  return securityTestRunner.runQuickSecurityCheck();
}

/**
 * Run full security audit (for development/debugging)
 * @returns {Promise<Object>} Audit results
 */
export async function runFullSecurityAudit() {
  const { securityTestRunner } = await import('../security-test-runner.js');
  return securityTestRunner.runSecurityTests();
}
