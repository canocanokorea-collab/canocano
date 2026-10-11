const fs = require('fs');
const path = '/Users/canocano/Documents/Canocano/src/data/products.json';

const products = JSON.parse(fs.readFileSync(path, 'utf8'));

const updated = products.map(p => {
  if (p.id === '25' || p.id === '24') {
    return {
      ...p,
      category: '악세사리/리필',
      status: '판매중'
    };
  }
  return p;
});

fs.writeFileSync(path, JSON.stringify(updated, null, 2), 'utf8');
console.log('✅ Refill products (ID 25: 해먹, ID 24: 스크레쳐) are now IN STOCK (판매중)!');
