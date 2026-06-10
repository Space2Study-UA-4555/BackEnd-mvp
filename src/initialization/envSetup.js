if (process.env.NODE_ENV === 'test') {
  require('dotenv').config({ path: '.env.test.local' })
  require('dotenv').config({ path: '.env.test' })
} else {
  require('dotenv').config({ path: '.env.local' })
}
require('dotenv').config()
