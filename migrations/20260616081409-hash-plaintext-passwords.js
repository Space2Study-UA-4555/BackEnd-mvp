const bcrypt = require('bcrypt')
const { SALT_ROUNDS } = require('~/consts/auth')

const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/

module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async up(db) {
    const cursor = db
      .collection('users')
      .find({ password: { $not: BCRYPT_HASH_REGEX } }, { projection: { password: 1 } })

    for await (const user of cursor) {
      if (!user.password) {
        continue
      }

      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS)
      await db.collection('users').updateOne({ _id: user._id }, { $set: { password: hashedPassword } })
    }
  },

  /**
   * Hashing is one-way, so plain-text passwords cannot be restored on rollback.
   * @returns {Promise<void>}
   */
  async down() {}
}
