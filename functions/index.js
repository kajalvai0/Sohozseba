const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let adminInitialized = false;

function initAdmin() {
  if (adminInitialized) return;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Expect FIREBASE_SERVICE_ACCOUNT to be a JSON stringified service account
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    adminInitialized = true;
  }
}

exports.bookService = functions.https.onRequest(async (req, res) => {
  // CORS (simple allow all) - adjust for production
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).send('');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST' });
  }

  const { name, phone, address, service } = req.body || {};
  if (!name || !phone || !address) {
    return res.status(400).json({ error: 'Missing required fields: name, phone, address' });
  }

  const phoneRe = /^\d{11}$/;
  if (!phoneRe.test(String(phone))) {
    return res.status(400).json({ error: 'Phone must be 11 digits (Bangladesh local format)' });
  }

  const payload = { name, phone, address, service: service || null, createdAt: new Date().toISOString() };

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      initAdmin();
      const db = admin.firestore();
      const doc = await db.collection('bookings').add(payload);
      return res.status(200).json({ ok: true, id: doc.id });
    } else {
      // Local fallback: store to a local JSON file (useful for local dev without Firebase)
      const filePath = path.join(__dirname, 'bookings_local.json');
      let arr = [];
      if (fs.existsSync(filePath)) {
        try { arr = JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]'); } catch (e) { arr = []; }
      }
      arr.push(payload);
      fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), 'utf8');
      return res.status(200).json({ ok: true, fallback: true });
    }
  } catch (err) {
    console.error('bookService error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
