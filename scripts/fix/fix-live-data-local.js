/**
 * fix-live-data-local.js
 * نسخة محلية من سكريبت تصحيح البيانات تعمل على local-db.json بدلاً من قاعدة بيانات MongoDB
 */

const fs = require('fs');
const path = require('path');

const LOCAL_DB_PATH = path.join(__dirname, '..', 'local-db.json');

function loadLocal() {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
      return JSON.parse(raw || '{}');
    }
  } catch (e) {
    console.warn('Failed to read local-db.json:', e.message);
  }

  return {
    users: [],
    cars: [],
    brands: [],
    auctions: [],
    bids: [],
    spareParts: [],
    settings: [],
  };
}

function saveLocal(db) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.warn('Failed to write local-db.json:', e.message);
  }
}

async function run() {
  const db = loadLocal();

  // 1) إصلاح سنة السيارات
  const cars = Array.isArray(db.cars) ? db.cars : [];
  let fixedYears = 0;
  cars.forEach((car) => {
    if (typeof car.year === 'number' && car.year > 9999) {
      car.year = Math.floor(car.year / 100);
      fixedYears++;
    }
  });

  // 2) إصلاح المزادات
  const auctions = Array.isArray(db.auctions) ? db.auctions : [];
  const now = new Date();
  let endedCount = 0;
  let startedCount = 0;

  auctions.forEach((a) => {
    const startsAt = a.startsAt ? new Date(a.startsAt) : null;
    const endsAt = a.endsAt ? new Date(a.endsAt) : null;

    if (a.status === 'running' && endsAt && endsAt < now) {
      a.status = 'ended';
      endedCount++;
    }

    if (a.status === 'scheduled') {
      if (endsAt && endsAt <= now) {
        a.status = 'ended';
        endedCount++;
      } else if (startsAt && startsAt <= now && endsAt && endsAt > now) {
        a.status = 'running';
        startedCount++;
      }
    }
  });

  // 3) إصلاح رابط الواتساب في إعدادات الموقع
  let whatsappFixed = false;
  if (Array.isArray(db.settings)) {
    const main = db.settings.find(s => s.key === 'main');
    if (main && main.socialLinks && main.socialLinks.whatsapp) {
      const current = String(main.socialLinks.whatsapp || '');
      let clean = current.replace('https://wa.me/', '').replace(/[+\-\s]/g, '');
      const correct = `https://wa.me/${clean}`;
      main.socialLinks.whatsapp = correct;
      whatsappFixed = true;
    }
  }

  // Save and report
  saveLocal(db);

  console.log('Local DB fixes complete:');
  console.log(`  • Fixed car years: ${fixedYears}`);
  console.log(`  • Auctions ended/started: ended ${endedCount}, started ${startedCount}`);
  console.log(`  • Whatsapp fixed: ${whatsappFixed}`);
  console.log(`Local DB path: ${LOCAL_DB_PATH}`);
}

run().catch(err => {
  console.error('Error:', err && err.message ? err.message : err);
  process.exit(1);
});
