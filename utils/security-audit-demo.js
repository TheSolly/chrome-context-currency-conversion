/**
 * Security Audit Demo Script
 * Phase 9, Task 9.3: Security Audit Demonstration
 * Demonstrates the security audit functionality
 */

import { securityTestRunner } from '../utils/security-test-runner.js';
import { securityAudit } from '../utils/security-audit.js';
import { penetrationTesting } from '../utils/penetration-testing.js';
import { securityBestPractices } from '../utils/security-best-practices.js';

/**
 * Demo script to showcase security audit capabilities
 */
async function runSecurityAuditDemo() {
  console.log('🔐 SECURITY AUDIT DEMONSTRATION');
  console.log('===============================');
  console.log('Phase 9, Task 9.3: Security Audit Implementation');
  console.log('');

  try {
    // Step 1: Initialize Security Test Runner
    console.log('📋 Step 1: Initializing Security Audit System...');
    await securityTestRunner.initialize();
    console.log('✅ Security audit system initialized successfully');
    console.log('');

    // Step 2: Quick Security Check
    console.log('📋 Step 2: Running Quick Security Check...');
    const quickResult = await securityTestRunner.runQuickSecurityCheck();
    console.log(
      `⚡ Quick Check Result: ${quickResult.score}% (${quickResult.status})`
    );
    if (quickResult.issues.length > 0) {
      console.log('🚨 Issues found:');
      quickResult.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    console.log('');

    // Step 3: Comprehensive Security Audit
    console.log('📋 Step 3: Running Comprehensive Security Audit...');
    const auditResults = await securityAudit.runFullAudit();
    console.log('✅ Security audit completed');
    console.log(
      `📊 Audit Score: ${auditResults.score}/${auditResults.maxScore}`
    );
    console.log(`✅ Passed Checks: ${auditResults.passedChecks.length}`);
    console.log(`❌ Failed Checks: ${auditResults.failedChecks.length}`);
    console.log(`🚨 Vulnerabilities: ${auditResults.vulnerabilities.length}`);
    console.log('');

    // Step 4: Penetration Testing
    console.log('📋 Step 4: Running Penetration Tests...');
    const penTestResults = await penetrationTesting.runPenetrationTests();
    console.log('✅ Penetration testing completed');
    console.log(`🧪 Tests Run: ${penTestResults.testsRun}`);
    console.log(
      `🚨 Vulnerabilities Found: ${penTestResults.vulnerabilitiesFound}`
    );
    console.log(`🔴 Critical Issues: ${penTestResults.criticalIssues.length}`);
    console.log('');

    // Step 5: Security Best Practices Implementation
    console.log('📋 Step 5: Implementing Security Best Practices...');
    const bestPracticesResults =
      await securityBestPractices.implementBestPractices();
    console.log('✅ Best practices implementation completed');
    console.log(`✅ Implemented: ${bestPracticesResults.implemented.length}`);
    console.log(`❌ Failed: ${bestPracticesResults.failed.length}`);
    console.log(`⏭️  Skipped: ${bestPracticesResults.skipped.length}`);
    console.log('');

    // Step 6: Generate Compliance Report
    console.log('📋 Step 6: Generating Compliance Report...');
    const complianceReport = securityBestPractices.generateComplianceReport();
    console.log('✅ Compliance report generated');
    console.log(`📊 Compliance: ${complianceReport.compliancePercentage}%`);
    console.log(
      `✅ Implemented: ${complianceReport.implementedCount}/${complianceReport.totalRequired}`
    );
    console.log('');

    // Step 7: Comprehensive Security Test Suite
    console.log('📋 Step 7: Running Complete Security Test Suite...');
    const fullResults = await securityTestRunner.runSecurityTests({
      fullReport: true
    });
    console.log('✅ Complete security test suite finished');
    console.log('');

    // Step 8: Display Final Results
    console.log('📋 Step 8: Final Security Assessment Results');
    console.log('===========================================');
    console.log(`🏆 Overall Security Score: ${fullResults.overallScore}%`);
    console.log(
      `📊 Compliance Status: ${fullResults.complianceStatus.toUpperCase()}`
    );
    console.log(`🚨 Critical Issues: ${fullResults.criticalIssues.length}`);
    console.log(`💡 Recommendations: ${fullResults.recommendations.length}`);
    console.log('');

    // Display security status badge
    displaySecurityBadge(
      fullResults.overallScore,
      fullResults.complianceStatus
    );

    // Display top recommendations
    if (fullResults.recommendations.length > 0) {
      console.log('🔝 TOP SECURITY RECOMMENDATIONS:');
      fullResults.recommendations.slice(0, 5).forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
      console.log('');
    }

    // Display critical issues if any
    if (fullResults.criticalIssues.length > 0) {
      console.log('🚨 CRITICAL SECURITY ISSUES:');
      fullResults.criticalIssues.forEach((issue, index) => {
        console.log(
          `   ${index + 1}. [${issue.severity?.toUpperCase() || 'HIGH'}] ${issue.description || issue.name}`
        );
        if (issue.recommendation) {
          console.log(`      💡 ${issue.recommendation}`);
        }
      });
      console.log('');
    }

    console.log('🎉 SECURITY AUDIT DEMONSTRATION COMPLETED SUCCESSFULLY!');
    console.log('========================================================');
    console.log('');
    console.log('📊 SUMMARY:');
    console.log(
      `   • Security Audit: ${auditResults.score}/${auditResults.maxScore} points`
    );
    console.log(
      `   • Penetration Tests: ${penTestResults.testsRun - penTestResults.vulnerabilitiesFound}/${penTestResults.testsRun} passed`
    );
    console.log(
      `   • Best Practices: ${complianceReport.compliancePercentage}% compliance`
    );
    console.log(
      `   • Overall Score: ${fullResults.overallScore}% (${fullResults.complianceStatus})`
    );
    console.log('');
    console.log(
      '🔐 The Chrome Currency Converter extension has been thoroughly audited'
    );
    console.log(
      '   for security vulnerabilities and best practices compliance.'
    );
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Address any critical security issues identified');
    console.log('   2. Implement recommended security improvements');
    console.log('   3. Schedule regular security audits');
    console.log('   4. Monitor for new security threats and vulnerabilities');
    console.log('   5. Keep security measures up to date');

    return fullResults;
  } catch (error) {
    console.error('❌ Security audit demonstration failed:', error);
    console.log('');
    console.log('🔧 TROUBLESHOOTING:');
    console.log('   • Ensure all security modules are properly imported');
    console.log('   • Check Chrome extension permissions');
    console.log('   • Verify storage access is available');
    console.log('   • Review error logs for specific issues');

    throw error;
  }
}

/**
 * Display security status badge
 * @param {number} score - Security score
 * @param {string} status - Compliance status
 */
function displaySecurityBadge(score, status) {
  const badges = {
    excellent: '🏆 EXCELLENT SECURITY',
    good: '✅ GOOD SECURITY',
    fair: '⚠️  FAIR SECURITY',
    poor: '🚨 POOR SECURITY',
    unknown: '❓ UNKNOWN SECURITY'
  };

  const badge = badges[status] || badges.unknown;
  const border = '='.repeat(badge.length);

  console.log(border);
  console.log(badge);
  console.log(`SCORE: ${score}%`);
  console.log(border);
  console.log('');
}

/**
 * Run specific security test
 * @param {string} testType - Type of test to run
 */
async function runSpecificSecurityTest(testType) {
  console.log(`🔍 Running specific security test: ${testType}`);
  console.log('');

  try {
    switch (testType.toLowerCase()) {
      case 'audit':
        const auditResults = await securityAudit.runFullAudit();
        console.log('Security Audit Results:', auditResults);
        break;

      case 'penetration':
        const penResults = await penetrationTesting.runPenetrationTests();
        console.log('Penetration Test Results:', penResults);
        break;

      case 'practices':
        const practicesResults =
          await securityBestPractices.implementBestPractices();
        console.log('Best Practices Results:', practicesResults);
        break;

      case 'quick':
        const quickResults = await securityTestRunner.runQuickSecurityCheck();
        console.log('Quick Security Check Results:', quickResults);
        break;

      default:
        console.log(
          '❌ Unknown test type. Available: audit, penetration, practices, quick'
        );
    }
  } catch (error) {
    console.error(`❌ Failed to run ${testType} test:`, error);
  }
}

/**
 * Generate security report
 */
async function generateSecurityReport() {
  console.log('📄 Generating comprehensive security report...');

  try {
    const results = await securityTestRunner.runSecurityTests({
      fullReport: true
    });

    const report = await securityAudit.generateReport();
    console.log('✅ Security report generated successfully');
    console.log('📊 Report includes:');
    console.log('   • Security audit findings');
    console.log('   • Penetration test results');
    console.log('   • Best practices compliance');
    console.log('   • Detailed recommendations');
    console.log('   • Compliance assessment');

    return { results, report };
  } catch (error) {
    console.error('❌ Failed to generate security report:', error);
    throw error;
  }
}

// Export functions for external use
export {
  runSecurityAuditDemo,
  runSpecificSecurityTest,
  generateSecurityReport,
  displaySecurityBadge
};

// Auto-run demo if this file is executed directly
if (typeof window !== 'undefined' && window.location) {
  // Running in browser extension context
  console.log('🔐 Security Audit Demo - Ready to run');
  console.log('Call runSecurityAuditDemo() to start the demonstration');
} else if (typeof process !== 'undefined' && process.argv) {
  // Running in Node.js context
  const args = process.argv.slice(2);
  if (args.includes('--demo')) {
    runSecurityAuditDemo().catch(console.error);
  } else if (args.includes('--test')) {
    const testType = args.find(arg => !arg.startsWith('--')) || 'quick';
    runSpecificSecurityTest(testType).catch(console.error);
  } else if (args.includes('--report')) {
    generateSecurityReport().catch(console.error);
  }
}
