/**
 * One-time script: adds a product to Firestore `products` collection.
 * Usage: node scripts/add-product.js
 *
 * Uses the firebase client SDK with the same config as the app.
 * Requires FIREBASE_TOKEN env var OR interactive sign-in.
 * For simplicity, uses firebase-admin with gcloud application default credentials.
 */

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const product = {
  name: 'Cofre Gantz',
  description: 'Descubre una recompensa aleatoria de la franquicia de Gantz',
  price: 100,
  imageUrl: 'https://',
  stock: 25,
  category: 'Cofres',
  isExclusive: false,
};

async function main() {
  // Use project ID from .env
  const projectId = 'einherjer-blitz-7578c';
  
  const app = initializeApp({
    projectId,
    credential: applicationDefault(),
  });
  
  const db = getFirestore(app);
  
  const docRef = await db.collection('products').add(product);
  console.log('✓ Product added with ID:', docRef.id);
  console.log('  Name:', product.name);
  console.log('  Price:', product.price, 'Esferas');
  console.log('  Stock:', product.stock);
  console.log('  Category:', product.category);
  
  process.exit(0);
}

main().catch((err) => {
  console.error('✗ Failed:', err.message);
  process.exit(1);
});
