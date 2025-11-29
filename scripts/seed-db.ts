/**
 * Database Seeding Script
 * Story 5.6: Task 11 - Performance testing with realistic data
 *
 * Populates local D1 database with 100-200 test predictions for performance testing.
 * Generates realistic prediction distribution around the official GTA 6 date (2026-11-19).
 *
 * Usage: npm run db:seed
 */

import { execSync } from 'child_process';
import crypto from 'crypto';

const OFFICIAL_DATE = new Date('2026-11-19');
const PREDICTIONS_COUNT = 150; // Between 100-200
const DB_NAME = 'gta6-predictions';

/**
 * Generate random prediction date with weighted distribution
 * - 40% within ±3 months of official date (realistic)
 * - 30% within ±6 months (optimistic/pessimistic)
 * - 20% within ±12 months (outliers)
 * - 10% extreme outliers (1-50 years away)
 *
 * NOTE: All dates are AFTER the official date (2026-11-19) since users
 * can only predict delays, not earlier releases.
 */
function generateRandomDate(): string {
  const rand = Math.random();
  let offsetDays: number;

  if (rand < 0.4) {
    // 40% - within 3 months AFTER official date (2026-11-19 to 2027-02-19)
    offsetDays = Math.floor(Math.random() * 90);
  } else if (rand < 0.7) {
    // 30% - 3-6 months AFTER official date (2027-02-19 to 2027-05-19)
    offsetDays = 90 + Math.floor(Math.random() * 90);
  } else if (rand < 0.9) {
    // 20% - 6-12 months AFTER official date (2027-05-19 to 2027-11-19)
    offsetDays = 180 + Math.floor(Math.random() * 180);
  } else {
    // 10% - extreme outliers (1-10 years AFTER official date)
    const years = Math.floor(Math.random() * 10) + 1;
    offsetDays = years * 365;
  }

  const date = new Date(OFFICIAL_DATE);
  date.setDate(date.getDate() + offsetDays);

  // Ensure date is within valid range (2026-11-19 to 2125-12-31)
  if (date < OFFICIAL_DATE) date.setTime(OFFICIAL_DATE.getTime());
  if (date.getFullYear() > 2125) date.setFullYear(2125);

  return date.toISOString().split('T')[0];
}

/**
 * Generate unique cookie ID (UUID v4)
 */
function generateCookieId(): string {
  return crypto.randomUUID();
}

/**
 * Hash IP address with SHA-256 (simulating real IP hashing)
 */
function hashIP(index: number, salt: string = 'test-salt'): string {
  const fakeIP = `192.168.1.${index % 255}`;
  return crypto
    .createHash('sha256')
    .update(salt + fakeIP)
    .digest('hex');
}

/**
 * Calculate weight based on predicted date (Story 2.9 algorithm)
 */
function calculateWeight(predictedDate: string): number {
  const predicted = new Date(predictedDate);
  const yearsDiff = Math.abs(
    (predicted.getTime() - OFFICIAL_DATE.getTime()) / (1000 * 60 * 60 * 24 * 365)
  );

  if (yearsDiff <= 5) return 1.0;
  if (yearsDiff <= 50) return 0.3;
  return 0.1;
}

/**
 * Generate SQL INSERT statement for a prediction
 */
function generateInsertSQL(index: number): string {
  const predictedDate = generateRandomDate();
  const cookieId = generateCookieId();
  const ipHash = hashIP(index);
  const weight = calculateWeight(predictedDate);
  const submittedAt = new Date(
    Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
  ).toISOString();

  return `INSERT INTO predictions (predicted_date, submitted_at, updated_at, ip_hash, cookie_id, user_agent, weight)
VALUES ('${predictedDate}', '${submittedAt}', '${submittedAt}', '${ipHash}', '${cookieId}', 'Mozilla/5.0 (Test Seeder)', ${weight});`;
}

/**
 * Main seeding function
 */
async function seedDatabase() {
  console.log(`🌱 Seeding database with ${PREDICTIONS_COUNT} predictions...\n`);

  // Generate all INSERT statements
  const inserts: string[] = [];
  for (let i = 0; i < PREDICTIONS_COUNT; i++) {
    inserts.push(generateInsertSQL(i));
  }

  // Create temporary SQL file
  const sqlContent = inserts.join('\n');
  const tempFile = '/tmp/seed-predictions.sql';

  // Write to temp file
  const fs = await import('fs');
  fs.writeFileSync(tempFile, sqlContent);

  console.log(`📝 Generated ${PREDICTIONS_COUNT} INSERT statements`);
  console.log(`📂 SQL file: ${tempFile}\n`);

  // Execute SQL via wrangler d1 execute
  try {
    console.log(`⚙️  Executing SQL against local D1 database...\n`);

    const output = execSync(
      `npx wrangler d1 execute ${DB_NAME} --local --file=${tempFile}`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );

    console.log(output);
    console.log(`\n✅ Successfully seeded ${PREDICTIONS_COUNT} predictions!`);

    // Verify count
    console.log(`\n🔍 Verifying database count...\n`);
    const countOutput = execSync(
      `npx wrangler d1 execute ${DB_NAME} --local --command="SELECT COUNT(*) as total FROM predictions"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );

    console.log(countOutput);

  } catch (error: any) {
    console.error('❌ Error seeding database:', error.message);
    if (error.stderr) console.error(error.stderr.toString());
    process.exit(1);
  } finally {
    // Clean up temp file
    const fs = await import('fs');
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

// Run seeding
seedDatabase().catch(console.error);
