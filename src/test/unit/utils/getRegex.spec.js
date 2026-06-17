require('~/initialization/envSetup')

const getRegex = require('~/utils/getRegex')

describe('getRegex', () => {
  it('should return regex object with $options: i for case-insensitive matching', () => {
    const result = getRegex('hello')
    expect(result).toEqual({ $regex: 'hello', $options: 'i' })
  })

  it('should match all when called with no argument', () => {
    const result = getRegex()
    expect(result).toEqual({ $regex: '.*', $options: 'i' })
  })

  it('should match all when called with empty string', () => {
    const result = getRegex('')
    expect(result).toEqual({ $regex: '.*', $options: 'i' })
  })

  it('should escape square bracket to prevent invalid regex and 500 errors', () => {
    const result = getRegex('[bad')
    expect(result.$regex).toBe('\\[bad')
  })

  it('should escape dot', () => {
    const result = getRegex('hello.world')
    expect(result.$regex).toBe('hello\\.world')
  })

  it('should escape parentheses and pipe', () => {
    const result = getRegex('a(b|c)')
    expect(result.$regex).toBe('a\\(b\\|c\\)')
  })

  it('should escape asterisk and plus', () => {
    const result = getRegex('a*b+c')
    expect(result.$regex).toBe('a\\*b\\+c')
  })
})
