const { execSync } = require('child_process')
const fs = require('fs')
const zlib = require('zlib')
const path = require('path')

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const outFile = path.join('backups', `documind-${timestamp}.sql.gz`)

fs.mkdirSync('backups', { recursive: true })

console.log('Dumping database...')
try {
  // Run pg_dump inside db container
  const dump = execSync(
    'docker compose exec -T db sh -c "pg_dump -U $POSTGRES_USER -d $POSTGRES_DB --no-owner --clean --if-exists"',
    { encoding: 'buffer', maxBuffer: 100 * 1024 * 1024 }
  )

  if (!dump || dump.length === 0) {
    throw new Error('pg_dump produced empty output')
  }

  console.log(`Dump size: ${(dump.length / 1024).toFixed(1)} KB`)

  // gzip compress
  const compressed = zlib.gzipSync(dump)
  fs.writeFileSync(outFile, compressed)

  console.log(`? Backup saved: ${outFile} (${(compressed.length / 1024).toFixed(1)} KB)`)
} catch (err) {
  console.error('? Backup FAILED:', err.message)
  if (fs.existsSync(outFile)) fs.unlinkSync(outFile)
  process.exit(1)
}
