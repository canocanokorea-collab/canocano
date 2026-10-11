const fs = require('fs');
const path = '/Users/canocano/Documents/Canocano/src/data/products.json';

const products = JSON.parse(fs.readFileSync(path, 'utf8'));

const updated = products.map(p => ({
  ...p,
  status: '품절'
}));

fs.writeFileSync(path, JSON.stringify(updated, null, 2), 'utf8');
console.log(`✅ All ${updated.length} products have been marked as '품절' (SOLDOUT)!`);
