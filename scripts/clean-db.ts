/**
 * Database Cleanup Script
 * Story 5.6: Task 11 - Clean up test data from local database
 *
 * Removes all predictions from local D1 database for fresh testing.
 *
 * Usage: npm run db:clean
 */

import { execSync } from 'child_process';
import * as readline from 'readline';

const DB_NAME = 'gta6-predictions';

/**
 * Prompt user for confirmation
 */
function promptConfirmation(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      '⚠️  This will DELETE ALL predictions from the local database. Continue? (yes/no): ',
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      }
    );
  });
}

/**
 * Clean database
 */
async function cleanDatabase() {
  console.log('🧹 Database Cleanup Script\n');

  // Check current count
  try {
    console.log('🔍 Checking current database count...\n');
    const countOutput = execSync(
      `npx wrangler d1 execute ${DB_NAME} --local --command="SELECT COUNT(*) as total FROM predictions"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    console.log(countOutput);
  } catch (error: any) {
    console.error('❌ Error querying database:', error.message);
    process.exit(1);
  }

  // Confirm deletion
  const confirmed = await promptConfirmation();

  if (!confirmed) {
    console.log('\n❌ Cleanup cancelled by user.');
    process.exit(0);
  }

  // Delete all predictions
  try {
    console.log('\n🗑️  Deleting all predictions...\n');

    const deleteOutput = execSync(
      `npx wrangler d1 execute ${DB_NAME} --local --command="DELETE FROM predictions"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );

    console.log(deleteOutput);

    // Verify deletion
    console.log('\n🔍 Verifying deletion...\n');
    const verifyOutput = execSync(
      `npx wrangler d1 execute ${DB_NAME} --local --command="SELECT COUNT(*) as total FROM predictions"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );

    console.log(verifyOutput);
    console.log('\n✅ Database cleaned successfully!');

  } catch (error: any) {
    console.error('❌ Error cleaning database:', error.message);
    if (error.stderr) console.error(error.stderr.toString());
    process.exit(1);
  }
}

// Run cleanup
cleanDatabase().catch(console.error);
