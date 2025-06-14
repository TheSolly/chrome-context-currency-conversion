/**
 * Security Test Runner
 * Phase 9, Task 9.3: Security Audit - Test Runner
 * Orchestrates comprehensive security testing and audit processes
 */

import { securityAudit } from './security-audit.js';
import { penetrationTesting } from './penetration-testing.js';
import { securityBestPractices } from './security-best-practices.js';
import { securityManager } from './security-manager.js';

export class SecurityTestRunner {
  constructor() {
    this.testSuite = {
      securityAudit: true,
      penetrationTesting: true,
      bestPracticesCheck: true,
      complianceReport: true,
      fullReport: true
    };

    this.results = {
      timestamp: null,
      overallScore: 0,
      maxScore: 100,
      testResults: {},
      recommendations: [],
      criticalIssues: [],
      complianceStatus: 'unknown'
    };

    this.initialized = false;
  }

  /**
   * Initialize security test runner
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log('🔐 Initializing Security Test Runner...');

      // Initialize security manager first
      if (!securityManager.initialized) {
        await securityManager.initialize();
      }

      // Initialize all security modules
      await securityAudit.initialize();
      await penetrationTesting.initialize();
      await securityBestPractices.initialize();

      this.initialized = true;
      console.log('✅ Security Test Runner initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Security Test Runner:', error);
      throw error;
    }
  }

  /**
   * Run comprehensive security test suite
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Complete test results
   */
  async runSecurityTests(options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log('🔍 Starting comprehensive security test suite...');
    console.log('================================================');

    // Reset results
    this.results = {
      timestamp: new Date().toISOString(),
      overallScore: 0,
      maxScore: 100,
      testResults: {},
      recommendations: [],
      criticalIssues: [],
      complianceStatus: 'unknown'
    };

    const testsToRun = { ...this.testSuite, ...options };

    try {
      // Run Security Audit
      if (testsToRun.securityAudit) {
        console.log('\n📊 Running Security Audit...');
        this.results.testResults.securityAudit =
          await securityAudit.runFullAudit();
      }

      // Run Penetration Testing
      if (testsToRun.penetrationTesting) {
        console.log('\n🎯 Running Penetration Tests...');
        this.results.testResults.penetrationTesting =
          await penetrationTesting.runPenetrationTests();
      }

      // Run Best Practices Check
      if (testsToRun.bestPracticesCheck) {
        console.log('\n🛡️ Checking Security Best Practices...');
        this.results.testResults.bestPractices =
          await securityBestPractices.implementBestPractices();
      }

      // Generate Compliance Report
      if (testsToRun.complianceReport) {
        console.log('\n📋 Generating Compliance Report...');
        this.results.testResults.compliance =
          securityBestPractices.generateComplianceReport();
      }

      // Calculate overall security score
      this.calculateOverallScore();

      // Compile recommendations and critical issues
      this.compileRecommendations();
      this.identifyCriticalIssues();

      // Generate full report
      if (testsToRun.fullReport) {
        await this.generateFullReport();
      }

      // Log final summary
      this.logFinalSummary();

      // Store results
      await this.storeResults();

      console.log('✅ Security test suite completed successfully');
      return this.results;
    } catch (error) {
      console.error('❌ Security test suite failed:', error);
      this.results.testResults.error = {
        message: error.message,
        stack: error.stack
      };
      return this.results;
    }
  }

  /**
   * Run quick security check
   * @returns {Promise<Object>} Quick check results
   */
  async runQuickSecurityCheck() {
    console.log('⚡ Running quick security check...');

    const quickResults = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      score: 0,
      issues: [],
      recommendations: []
    };

    try {
      // Quick security manager check
      const securityManagerStatus = await this.checkSecurityManagerStatus();

      // Quick manifest security check
      const manifestSecurityStatus = await this.checkManifestSecurity();

      // Quick storage security check
      const storageSecurityStatus = await this.checkStorageSecurity();

      const checks = [
        securityManagerStatus,
        manifestSecurityStatus,
        storageSecurityStatus
      ];
      const passedChecks = checks.filter(check => check.passed).length;

      quickResults.score = Math.round((passedChecks / checks.length) * 100);
      quickResults.status =
        quickResults.score >= 70
          ? 'good'
          : quickResults.score >= 50
            ? 'fair'
            : 'poor';

      // Collect issues and recommendations
      checks.forEach(check => {
        if (!check.passed) {
          quickResults.issues.push(check.issue);
          quickResults.recommendations.push(check.recommendation);
        }
      });

      console.log(
        `⚡ Quick check completed: ${quickResults.score}% (${quickResults.status})`
      );
      return quickResults;
    } catch (error) {
      console.error('Quick security check failed:', error);
      quickResults.status = 'error';
      quickResults.issues.push('Quick security check failed');
      return quickResults;
    }
  }

  /**
   * Check security manager status
   * @private
   * @returns {Promise<Object>} Check result
   */
  async checkSecurityManagerStatus() {
    try {
      if (!securityManager.initialized) {
        return {
          passed: false,
          issue: 'Security manager not initialized',
          recommendation: 'Initialize security manager for proper protection'
        };
      }

      return {
        passed: true,
        issue: null,
        recommendation: null
      };
    } catch (error) {
      return {
        passed: false,
        issue: 'Security manager check failed',
        recommendation: 'Verify security manager implementation'
      };
    }
  }

  /**
   * Check manifest security configuration
   * @private
   * @returns {Promise<Object>} Check result
   */
  async checkManifestSecurity() {
    try {
      const manifest = chrome.runtime.getManifest();

      // Check for CSP
      if (!manifest.content_security_policy) {
        return {
          passed: false,
          issue: 'Content Security Policy not configured',
          recommendation: 'Add CSP to manifest.json for better security'
        };
      }

      // Check permissions
      const permissions = manifest.permissions || [];
      const sensitivePermissions = ['tabs', 'history', 'bookmarks'];
      const hasSensitive = permissions.some(perm =>
        sensitivePermissions.includes(perm)
      );

      if (hasSensitive) {
        return {
          passed: false,
          issue: 'Potentially excessive permissions detected',
          recommendation: 'Review and minimize extension permissions'
        };
      }

      return {
        passed: true,
        issue: null,
        recommendation: null
      };
    } catch (error) {
      return {
        passed: false,
        issue: 'Manifest security check failed',
        recommendation: 'Fix manifest configuration issues'
      };
    }
  }

  /**
   * Check storage security
   * @private
   * @returns {Promise<Object>} Check result
   */
  async checkStorageSecurity() {
    try {
      const storage = await chrome.storage.local.get();
      const keys = Object.keys(storage);

      // Check for potentially insecure storage keys
      const sensitiveKeys = keys.filter(
        key =>
          key.includes('api') || key.includes('key') || key.includes('token')
      );

      if (sensitiveKeys.length > 0) {
        // Basic check if data appears encrypted
        const potentiallyUnencrypted = sensitiveKeys.filter(key => {
          const value = storage[key];
          return typeof value === 'string' && value.length < 50;
        });

        if (potentiallyUnencrypted.length > 0) {
          return {
            passed: false,
            issue: 'Potentially unencrypted sensitive data in storage',
            recommendation: 'Encrypt all sensitive data before storage'
          };
        }
      }

      return {
        passed: true,
        issue: null,
        recommendation: null
      };
    } catch (error) {
      return {
        passed: false,
        issue: 'Storage security check failed',
        recommendation: 'Implement proper secure storage practices'
      };
    }
  }

  /**
   * Calculate overall security score
   * @private
   */
  calculateOverallScore() {
    let totalScore = 0;
    let maxPossibleScore = 0;

    // Security Audit Score (40% weight)
    if (this.results.testResults.securityAudit) {
      const auditScore = this.results.testResults.securityAudit.score;
      const auditMaxScore = this.results.testResults.securityAudit.maxScore;
      totalScore += (auditScore / auditMaxScore) * 40;
      maxPossibleScore += 40;
    }

    // Penetration Testing Score (30% weight)
    if (this.results.testResults.penetrationTesting) {
      const penTestResult = this.results.testResults.penetrationTesting;
      const penTestScore =
        penTestResult.testsRun - penTestResult.vulnerabilitiesFound;
      const penTestMaxScore = penTestResult.testsRun;
      if (penTestMaxScore > 0) {
        totalScore += (penTestScore / penTestMaxScore) * 30;
      }
      maxPossibleScore += 30;
    }

    // Best Practices Score (30% weight)
    if (this.results.testResults.compliance) {
      const complianceScore =
        this.results.testResults.compliance.compliancePercentage;
      totalScore += (complianceScore / 100) * 30;
      maxPossibleScore += 30;
    }

    this.results.overallScore =
      maxPossibleScore > 0 ? Math.round(totalScore) : 0;
    this.results.maxScore = maxPossibleScore;

    // Set compliance status
    if (this.results.overallScore >= 90) {
      this.results.complianceStatus = 'excellent';
    } else if (this.results.overallScore >= 70) {
      this.results.complianceStatus = 'good';
    } else if (this.results.overallScore >= 50) {
      this.results.complianceStatus = 'fair';
    } else {
      this.results.complianceStatus = 'poor';
    }
  }

  /**
   * Compile recommendations from all tests
   * @private
   */
  compileRecommendations() {
    const allRecommendations = new Set();

    // From security audit
    if (this.results.testResults.securityAudit?.recommendations) {
      this.results.testResults.securityAudit.recommendations.forEach(rec =>
        allRecommendations.add(rec)
      );
    }

    // From penetration testing
    if (this.results.testResults.penetrationTesting?.recommendations) {
      this.results.testResults.penetrationTesting.recommendations.forEach(rec =>
        allRecommendations.add(rec)
      );
    }

    // From best practices
    if (this.results.testResults.bestPractices?.recommendations) {
      this.results.testResults.bestPractices.recommendations.forEach(rec =>
        allRecommendations.add(rec)
      );
    }

    this.results.recommendations = Array.from(allRecommendations);
  }

  /**
   * Identify critical security issues
   * @private
   */
  identifyCriticalIssues() {
    const criticalIssues = [];

    // From security audit
    if (this.results.testResults.securityAudit?.vulnerabilities) {
      const critical =
        this.results.testResults.securityAudit.vulnerabilities.filter(
          vuln => vuln.severity === 'critical' || vuln.severity === 'high'
        );
      criticalIssues.push(...critical);
    }

    // From penetration testing
    if (this.results.testResults.penetrationTesting?.criticalIssues) {
      criticalIssues.push(
        ...this.results.testResults.penetrationTesting.criticalIssues
      );
    }

    this.results.criticalIssues = criticalIssues;
  }

  /**
   * Generate comprehensive security report
   * @private
   * @returns {Promise<void>}
   */
  async generateFullReport() {
    try {
      const reportHtml = await this.generateHtmlReport();

      // Store report
      await chrome.storage.local.set({
        securityReport: reportHtml,
        securityReportTimestamp: this.results.timestamp
      });

      console.log('📄 Full security report generated');
    } catch (error) {
      console.error('Failed to generate full report:', error);
    }
  }

  /**
   * Generate HTML security report
   * @private
   * @returns {Promise<string>} HTML report
   */
  async generateHtmlReport() {
    const { overallScore, complianceStatus, criticalIssues, recommendations } =
      this.results;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprehensive Security Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .score { font-size: 36px; font-weight: bold; text-align: center; margin: 20px 0; }
          .excellent { color: #2e7d32; }
          .good { color: #558b2f; }
          .fair { color: #f57c00; }
          .poor { color: #d32f2f; }
          .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
          .critical-issue { background: #ffebee; border-left: 4px solid #f44336; padding: 10px; margin: 10px 0; }
          .recommendation { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 10px; margin: 5px 0; }
          .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 20px 0; }
          .summary-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔐 Comprehensive Security Report</h1>
          <p><strong>Generated:</strong> ${new Date(this.results.timestamp).toLocaleString()}</p>
          <p><strong>Extension:</strong> Chrome Currency Converter</p>
        </div>

        <div class="score ${complianceStatus}">
          Overall Security Score: ${overallScore}%
          <br><span style="font-size: 18px;">(${complianceStatus.toUpperCase()})</span>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <h3>🔍 Security Audit</h3>
            <p>Score: ${this.results.testResults.securityAudit?.score || 'N/A'}/${this.results.testResults.securityAudit?.maxScore || 'N/A'}</p>
            <p>Issues: ${this.results.testResults.securityAudit?.vulnerabilities?.length || 0}</p>
          </div>
          <div class="summary-card">
            <h3>🎯 Penetration Tests</h3>
            <p>Tests: ${this.results.testResults.penetrationTesting?.testsRun || 0}</p>
            <p>Vulnerabilities: ${this.results.testResults.penetrationTesting?.vulnerabilitiesFound || 0}</p>
          </div>
          <div class="summary-card">
            <h3>🛡️ Best Practices</h3>
            <p>Compliance: ${this.results.testResults.compliance?.compliancePercentage || 0}%</p>
            <p>Implemented: ${this.results.testResults.compliance?.implementedCount || 0}/${this.results.testResults.compliance?.totalRequired || 0}</p>
          </div>
        </div>

        <div class="section">
          <h2>🚨 Critical Issues (${criticalIssues.length})</h2>
          ${
            criticalIssues.length === 0
              ? '<p>✅ No critical security issues found!</p>'
              : criticalIssues
                  .map(
                    issue => `
                <div class="critical-issue">
                  <strong>[${issue.severity?.toUpperCase() || 'HIGH'}] ${issue.name || issue.description}</strong>
                  <p>${issue.description || issue.impact}</p>
                  ${issue.recommendation ? `<p><em>Recommendation: ${issue.recommendation}</em></p>` : ''}
                </div>
              `
                  )
                  .join('')
          }
        </div>

        <div class="section">
          <h2>💡 Recommendations</h2>
          ${recommendations
            .map(
              rec => `
            <div class="recommendation">${rec}</div>
          `
            )
            .join('')}
        </div>

        <div class="section">
          <h2>📊 Detailed Results</h2>
          <h3>Security Audit</h3>
          <p>Passed: ${this.results.testResults.securityAudit?.passedChecks?.length || 0}</p>
          <p>Failed: ${this.results.testResults.securityAudit?.failedChecks?.length || 0}</p>
          
          <h3>Penetration Testing</h3>
          <p>Tests Executed: ${this.results.testResults.penetrationTesting?.testsRun || 0}</p>
          <p>Vulnerabilities: ${this.results.testResults.penetrationTesting?.vulnerabilitiesFound || 0}</p>
          
          <h3>Best Practices</h3>
          <p>Implemented: ${this.results.testResults.bestPractices?.implemented?.length || 0}</p>
          <p>Failed: ${this.results.testResults.bestPractices?.failed?.length || 0}</p>
          <p>Skipped: ${this.results.testResults.bestPractices?.skipped?.length || 0}</p>
        </div>

        <div class="section">
          <h2>🎯 Next Steps</h2>
          <ol>
            <li>Address all critical security issues immediately</li>
            <li>Implement failed best practices</li>
            <li>Schedule regular security audits</li>
            <li>Monitor for new security threats</li>
            <li>Update security measures regularly</li>
          </ol>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Log final summary
   * @private
   */
  logFinalSummary() {
    const { overallScore, complianceStatus, criticalIssues } = this.results;

    console.log('\n🔐 COMPREHENSIVE SECURITY REPORT');
    console.log('=================================');
    console.log(
      `📊 Overall Security Score: ${overallScore}% (${complianceStatus.toUpperCase()})`
    );
    console.log(`🚨 Critical Issues: ${criticalIssues.length}`);
    console.log(
      `💡 Total Recommendations: ${this.results.recommendations.length}`
    );

    if (overallScore >= 90) {
      console.log('\n🎉 Excellent security posture! Keep up the good work.');
    } else if (overallScore >= 70) {
      console.log('\n✅ Good security foundation with room for improvement.');
    } else if (overallScore >= 50) {
      console.log('\n⚠️  Fair security - several improvements needed.');
    } else {
      console.log('\n🚨 Poor security posture - immediate action required!');
    }

    if (criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES REQUIRE IMMEDIATE ATTENTION!');
    }
  }

  /**
   * Store test results
   * @private
   * @returns {Promise<void>}
   */
  async storeResults() {
    try {
      await chrome.storage.local.set({
        lastSecurityTestResults: this.results,
        securityTestHistory: await this.getTestHistory()
      });
    } catch (error) {
      console.error('Failed to store security test results:', error);
    }
  }

  /**
   * Get test history
   * @private
   * @returns {Promise<Array>}
   */
  async getTestHistory() {
    try {
      const { securityTestHistory = [] } = await chrome.storage.local.get(
        'securityTestHistory'
      );

      // Add current test to history
      securityTestHistory.push({
        timestamp: this.results.timestamp,
        overallScore: this.results.overallScore,
        complianceStatus: this.results.complianceStatus,
        criticalIssues: this.results.criticalIssues.length
      });

      // Keep only last 20 tests
      return securityTestHistory.slice(-20);
    } catch (error) {
      console.error('Failed to get test history:', error);
      return [];
    }
  }
}

// Export singleton instance
export const securityTestRunner = new SecurityTestRunner();
