// Load environment variables for every test suite so token/DB-related tests
// always have JWT secrets and MONGODB_URL available, regardless of which
// modules a given test file imports first.
require('~/initialization/envSetup')

// Newer Node versions removed `buffer.SlowBuffer`, which the transitive
// `buffer-equal-constant-time` dependency of `jsonwebtoken` references at module
// load time. Polyfill it so JWT-related suites can load on those runtimes.
const buffer = require('buffer')
if (!buffer.SlowBuffer) {
  buffer.SlowBuffer = buffer.Buffer
}
