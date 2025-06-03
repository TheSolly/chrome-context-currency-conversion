// Affiliate Links Integration for Financial Services
// Add, manage, and track affiliate links for financial partners

const AFFILIATE_LINKS = [
  {
    name: 'Wise (International Transfers)',
    url: 'https://wise.com/invite/u/your-affiliate-id',
    logo: 'https://wise.com/public-resources/assets/images/logos/wise-logo.svg',
    description: 'Save on international transfers with Wise.'
  },
  {
    name: 'Revolut (Multi-currency Banking)',
    url: 'https://revolut.com/referral/your-affiliate-id',
    logo: 'https://www.revolut.com/favicon.ico',
    description: 'Open a free multi-currency account with Revolut.'
  },
  {
    name: 'Payoneer (Global Payments)',
    url: 'https://www.payoneer.com/your-affiliate-id',
    logo: 'https://www.payoneer.com/favicon.ico',
    description: 'Get paid globally with Payoneer.'
  }
  // Add more partners as needed
];

export function getAffiliateLinks() {
  return AFFILIATE_LINKS;
}
