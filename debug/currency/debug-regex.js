#!/usr/bin/env node

const pattern =
  /([\d]{1,3}(?:[,.\s]?\d{3})*(?:[,.]?\d{1,4})?)\s*(A\$|C\$|HK\$|NZ\$|S\$|US\$|R\$|\$|€|£|¥|₹|₽|¢|₩|₦|₪|₨|₫|₱|₡|₲|₴|₵|₸|₺|₾|₿|kr|zł|Kč|Ft|฿|RM)/gi;

console.log('Testing 430$:', pattern.exec('430$'));
pattern.lastIndex = 0;
console.log('Testing 500€:', pattern.exec('500€'));

// Test with simplified pattern
const simplePattern = /(\d+)\s*(\$|€)/gi;
console.log('Simple test 430$:', simplePattern.exec('430$'));
simplePattern.lastIndex = 0;
console.log('Simple test 500€:', simplePattern.exec('500€'));
