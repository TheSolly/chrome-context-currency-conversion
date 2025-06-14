/**
 * Security Audit Quick Demo
 * Phase 9, Task 9.3: Security Audit Implementation
 * Quick demonstration of security audit capabilities
 */

/* global global */

// Mock Chrome API for demonstration
if (typeof chrome === 'undefined') {
  global.chrome = {
    runtime: {
      getManifest: () => ({
        manifest_version: 3,
        name: 'Currency Converter',
        version: '1.0.0',
        permissions: [
          'contextMenus',
          'storage',
          'activeTab',
          'notifications',
          'alarms'
        ],
        host_permissions: ['https://*/*', 'http://*/*'],
        content_security_policy: {
          extension_pages:
            "script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; upgrade-insecure-requests;"
        }
      })
    },
    storage: {
      local: {
        get: () => Promise.resolve({}),
        set: () => Promise.resolve()
      }
    }
  };
}

// Import security audit modules
import { SecurityAudit } from '../utils/security-audit.js';
import { PenetrationTesting } from '../utils/penetration-testing.js';
import { SecurityBestPractices } from '../utils/security-best-practices.js';

/**
 * Run a quick security audit demonstration
 */
async function quickSecurityAuditDemo() {
  console.log('🔐 SECURITY AUDIT QUICK DEMO');
  console.log('============================');
  console.log('Phase 9, Task 9.3: Security Audit Implementation');
  console.log('');

  try {
    // Initialize security audit
    const securityAudit = new SecurityAudit();
    await securityAudit.initialize();

    // Run security audit
    console.log('🔍 Running Security Audit...');
    const auditResults = await securityAudit.runFullAudit();

    console.log('✅ Security Audit Completed!');
    console.log(
      `📊 Security Score: ${auditResults.score}/${auditResults.maxScore}`
    );
    console.log(`✅ Passed Checks: ${auditResults.passedChecks.length}`);
    console.log(`❌ Failed Checks: ${auditResults.failedChecks.length}`);
    console.log(`🚨 Vulnerabilities: ${auditResults.vulnerabilities.length}`);

    // Show some results
    if (auditResults.passedChecks.length > 0) {
      console.log('\n✅ PASSED SECURITY CHECKS:');
      auditResults.passedChecks.slice(0, 3).forEach((check, index) => {
        console.log(`   ${index + 1}. ${check.name}: ${check.details || 'OK'}`);
      });
    }

    if (auditResults.vulnerabilities.length > 0) {
      console.log('\n🚨 SECURITY ISSUES FOUND:');
      auditResults.vulnerabilities.slice(0, 3).forEach((vuln, index) => {
        console.log(
          `   ${index + 1}. [${vuln.severity.toUpperCase()}] ${vuln.description}`
        );
      });
    }

    // Run penetration testing demo
    console.log('\n🎯 Running Penetration Testing Demo...');
    const penTesting = new PenetrationTesting();
    await penTesting.initialize();

    const penResults = await penTesting.runPenetrationTests();
    console.log(`🧪 Penetration Tests: ${penResults.testsRun}`);
    console.log(`🚨 Vulnerabilities Found: ${penResults.vulnerabilitiesFound}`);
    console.log(`🔴 Critical Issues: ${penResults.criticalIssues.length}`);

    // Run best practices check
    console.log('\n🛡️ Checking Security Best Practices...');
    const bestPractices = new SecurityBestPractices();
    await bestPractices.initialize();

    const compliance = bestPractices.generateComplianceReport();
    console.log(`📊 Security Compliance: ${compliance.compliancePercentage}%`);
    console.log(
      `✅ Implemented Practices: ${compliance.implementedCount}/${compliance.totalRequired}`
    );

    // Overall assessment
    const overallScore = Math.round(
      (auditResults.score / auditResults.maxScore) * 40 +
        ((penResults.testsRun - penResults.vulnerabilitiesFound) /
          penResults.testsRun) *
          30 +
        (compliance.compliancePercentage / 100) * 30
    );

    console.log('\n🏆 OVERALL SECURITY ASSESSMENT');
    console.log('===============================');
    console.log(`📊 Overall Security Score: ${overallScore}%`);

    let status = 'Poor';
    if (overallScore >= 90) status = 'Excellent';
    else if (overallScore >= 70) status = 'Good';
    else if (overallScore >= 50) status = 'Fair';

    console.log(`🎯 Security Status: ${status}`);
    console.log(`🔐 Chrome Currency Converter Extension Security: ${status}`);

    console.log('\n📋 SECURITY AUDIT SUMMARY:');
    console.log(
      `   • Security Audit: ${auditResults.score}/${auditResults.maxScore} points`
    );
    console.log(
      `   • Penetration Tests: ${penResults.testsRun - penResults.vulnerabilitiesFound}/${penResults.testsRun} passed`
    );
    console.log(
      `   • Best Practices: ${compliance.compliancePercentage}% compliance`
    );
    console.log(`   • Overall Score: ${overallScore}% (${status})`);

    console.log('\n🎉 Security Audit Demo Completed Successfully!');

    return {
      auditResults,
      penResults,
      compliance,
      overallScore,
      status
    };
  } catch (error) {
    console.error('❌ Security audit demo failed:', error);
    console.log(
      '\n🔧 This is a demonstration - some features may require full Chrome extension context'
    );
    return null;
  }
}

// Export for use in other modules
export { quickSecurityAuditDemo };

// Auto-run if executed directly
if (typeof window !== 'undefined') {
  // Browser context
  console.log('🔐 Security Audit Quick Demo ready');
  console.log('Call quickSecurityAuditDemo() to run the demonstration');
} else if (
  typeof process !== 'undefined' &&
  process.argv &&
  process.argv.includes('--run')
) {
  // Node.js context
  quickSecurityAuditDemo().catch(console.error);
}
