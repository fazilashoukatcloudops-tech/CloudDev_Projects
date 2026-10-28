const { execSync } = require('child_process')
const fs = require('fs')
const zlib = require('zlib')
const readline = require('readline')

const file = process.argv[2]
if (!file) {
  console.error('Usage: node deploy/scripts/db-restore.cjs backups/<file>.sql.gz')
  process.exit(1)
}
if (!fs.existsSync(file)) {
  console.error(`File not found: ${file}`)
  process.exit(1)
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
rl.question(
  `??  WARNING: This will REPLACE all data in the database.\nFile: ${file}\nType YES to continue: `,
  (answer) => {
    rl.close()
    if (answer !== 'YES') {
      console.log('Cancelled.')
      return
    }

    try {
      console.log('Dropping and recreating schema...')
      execSync(
        `docker compose exec -T db sh -c "psql -U $POSTGRES_USER -d $POSTGRES_DB -v ON_ERROR_STOP=1 -c \\"DROP SCHEMA public CASCADE; CREATE SCHEMA public;\\""`,
        { stdio: 'inherit' }
      )

      console.log('Restoring from backup...')
      const compressed = fs.readFileSync(file)
      const dump = zlib.gunzipSync(compressed)

      // Pipe the SQL to psql via docker compose exec
      execSync(
        `docker compose exec -T db sh -c "psql -U $POSTGRES_USER -d $POSTGRES_DB -v ON_ERROR_STOP=1"`,
        { input: dump, stdio: ['pipe', 'inherit', 'inherit'] }
      )

      console.log(`? Restore complete from ${file}`)
    } catch (err) {
      console.error('? Restore FAILED:', err.message)
      process.exit(1)
    }
  }
)
