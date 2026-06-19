const roles = {
  STUDENT: 'student',
  TUTOR: 'tutor',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin'
}

const tokenNames = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  RESET_TOKEN: 'resetToken',
  CONFIRM_TOKEN: 'confirmToken'
}

const oneDayInMs = 86400000

const SALT_ROUNDS = 10

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/

module.exports = {
  roles,
  oneDayInMs,
  tokenNames,
  SALT_ROUNDS,
  BCRYPT_HASH_REGEX
}
