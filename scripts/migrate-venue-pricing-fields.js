/**
 * Migration: Venue Pricing Fields
 *
 * Adds `advancePercentage` and `platformCommission` to all existing venue
 * documents that are missing them.
 *
 * Rules applied:
 *   - advancePercentage not set → 16.6  (% of slot price user pays online)
 *   - platformCommission  not set → 0   (% platform keeps from the advance)
 *
 * The old `commissionPercentage` field is left untouched (backward compat).
 *
 * Run (dry run, default):
 *   node scripts/migrate-venue-pricing-fields.js
 *
 * Run (write to Firestore):
 *   DRY_RUN=false node scripts/migrate-venue-pricing-fields.js
 *
 * Requires:
 *   FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccount.json
 */

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

// Load .env / .env.local automatically (no dotenv package needed)
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}
const projectRoot = path.resolve(__dirname, "..");
loadEnvFile(path.join(projectRoot, ".env"));
loadEnvFile(path.join(projectRoot, ".env.local"));

// ─── Config ──────────────────────────────────────────────────────────────────

const DRY_RUN = process.env.DRY_RUN !== "false";
const DEFAULT_ADVANCE_PERCENT = 16.6;
const DEFAULT_PLATFORM_COMMISSION = 0;
const BATCH_SIZE = 400; // keep under Firestore 500 write limit

// ─── Firebase Init ────────────────────────────────────────────────────────────

function initFirebase() {
  // Option A: explicit service account JSON file
  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (saPath) {
    if (!fs.existsSync(saPath)) {
      console.error("❌  Service account file not found:", saPath);
      process.exit(1);
    }
    const creds = JSON.parse(fs.readFileSync(saPath, "utf-8"));
    initializeApp({ credential: cert(creds) });
    return getFirestore();
  }

  // Option B: individual env vars (from .env / .env.local)
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
    return getFirestore();
  }

  console.error("❌  No Firebase credentials found.");
  console.error("    Either set FIREBASE_SERVICE_ACCOUNT_PATH, or ensure .env/.env.local contains:");
  console.error("      NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  console.error("      FIREBASE_CLIENT_EMAIL");
  console.error("      FIREBASE_PRIVATE_KEY");
  process.exit(1);
}

// ─── Migration ────────────────────────────────────────────────────────────────

async function migrate() {
  console.log("=".repeat(60));
  console.log(" Venue Pricing Fields Migration");
  console.log("=".repeat(60));
  console.log(`  Mode        : ${DRY_RUN ? "DRY RUN (no writes)" : "⚠️  LIVE (writing to Firestore)"}`);
  console.log(`  advancePercentage default : ${DEFAULT_ADVANCE_PERCENT}%`);
  console.log(`  platformCommission default: ${DEFAULT_PLATFORM_COMMISSION}%`);
  console.log("=".repeat(60));

  const db = initFirebase();

  const snap = await db.collection("venues").get();
  console.log(`\nFound ${snap.size} venue documents.\n`);

  const toUpdate = [];

  snap.forEach((doc) => {
    const data = doc.data();
    const updates = {};

    if (data.advancePercentage === undefined || data.advancePercentage === null) {
      // If the old commissionPercentage was 0 or absent, use default advance %.
      // If it was set to something meaningful (>0) by admin, preserve that intent.
      const legacyValue = data.commissionPercentage;
      updates.advancePercentage =
        typeof legacyValue === "number" && legacyValue > 0
          ? legacyValue
          : DEFAULT_ADVANCE_PERCENT;
    }

    if (data.platformCommission === undefined || data.platformCommission === null) {
      updates.platformCommission = DEFAULT_PLATFORM_COMMISSION;
    }

    if (Object.keys(updates).length > 0) {
      toUpdate.push({ id: doc.id, name: data.name || "(unnamed)", updates });
    }
  });

  console.log(`Venues needing update: ${toUpdate.length}`);

  if (toUpdate.length === 0) {
    console.log("\n✅ All venues already have the required fields. Nothing to do.");
    return;
  }

  console.log("\nChanges to apply:");
  toUpdate.forEach(({ id, name, updates }) => {
    console.log(`  [${id}] "${name}"  →  ${JSON.stringify(updates)}`);
  });

  if (DRY_RUN) {
    console.log("\n⏭️  Dry run — no writes performed.");
    console.log("   Re-run with DRY_RUN=false to apply.");
    return;
  }

  // Commit in batches
  let written = 0;
  for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
    const chunk = toUpdate.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    chunk.forEach(({ id, updates }) => {
      batch.update(db.collection("venues").doc(id), updates);
    });
    await batch.commit();
    written += chunk.length;
    console.log(`  Committed batch: ${written}/${toUpdate.length} venues updated`);
  }

  console.log(`\n✅ Migration complete. ${written} venue(s) updated.`);
}

migrate().catch((err) => {
  console.error("\n❌ Migration failed:", err);
  process.exit(1);
});
