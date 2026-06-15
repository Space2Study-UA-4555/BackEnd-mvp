const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getRegex = (regex = '') => ({
  $regex: regex.length > 0 ? escapeRegex(regex) : '.*',
  $options: 'i'
})

module.exports = getRegex
