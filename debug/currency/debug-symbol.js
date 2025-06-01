#!/usr/bin/env node

const symbolPattern =
  /(A\$|C\$|HK\$|NZ\$|S\$|US\$|R\$|\$|€|£|¥|₹|₽|¢|₩|₦|₪|₨|₫|₱|₡|₲|₴|₵|₸|₺|₾|₿|kr|zł|Kč|Ft|฿|RM)\s*([\d]{1,3}(?:[,.\s]?\d{3})*(?:[,.]?\d{1,4})?)/gi;

console.log('Symbol pattern testing 430$:', symbolPattern.exec('430$'));
symbolPattern.lastIndex = 0;
console.log('Symbol pattern testing 500€:', symbolPattern.exec('500€'));
