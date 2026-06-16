require('module-alias/register')
require('./module-aliases')
require('~/initialization/envSetup')

const { MONGODB_URL } = process.env

let databaseName
try {
  databaseName = new URL(MONGODB_URL).pathname.replace(/^\//, '') || undefined
} catch {
  databaseName = undefined
}

const config = {
  mongodb: {
    url: MONGODB_URL,
    databaseName,
    options: {}
  },
  migrationsDir: 'migrations',
  changelogCollectionName: 'changelog',
  lockCollectionName: 'changelog_lock',
  lockTtl: 0,
  migrationFileExtension: '.js',
  useFileHash: false,
  moduleSystem: 'commonjs'
}

module.exports = config
