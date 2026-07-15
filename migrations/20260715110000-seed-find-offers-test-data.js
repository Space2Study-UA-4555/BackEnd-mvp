const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
const { SALT_ROUNDS } = require('~/consts/auth')

const TEST_PASSWORD = 'testPass123'

const ID_TYPE = {
  user: '0001',
  category: '0002',
  subject: '0003',
  offer: '0004'
}

const seedId = (type, n) => new ObjectId(`5eed${ID_TYPE[type]}${String(n).padStart(16, '0')}`)

const categoryIcon = (letter, color) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="${color}"/><text x="12" y="16.5" text-anchor="middle" font-family="Arial" font-size="13" fill="#ffffff">${letter}</text></svg>`
  )}`

const CATEGORIES = [
  { name: 'Music', color: '#FF9800', subjects: ['Guitar', 'Piano'] },
  { name: 'Languages', color: '#03A9F4', subjects: ['English', 'German'] },
  { name: 'Mathematics', color: '#7B61FF', subjects: ['Algebra', 'Geometry'] },
  { name: 'Computer Science', color: '#66C42C', subjects: ['JavaScript', 'Python'] },
  { name: 'Design', color: '#F50057', subjects: ['UI/UX Design', 'Graphic Design'] },
  { name: 'Chemistry', color: '#FFC107', subjects: ['Organic Chemistry', 'Biochemistry'] },
  { name: 'Biology', color: '#4CAF50', subjects: ['Genetics', 'Anatomy'] },
  { name: 'Physics', color: '#9C27B0', subjects: ['Mechanics', 'Astronomy'] },
  { name: 'History', color: '#795548', subjects: ['World History', 'Art History'] },
  // Finance intentionally gets no offers — empty-result check for the category filter
  { name: 'Finance', color: '#607D8B', subjects: ['Accounting', 'Investing'] }
]

const TUTORS = [
  { firstName: 'Jennifer', lastName: 'Wilson', rating: 4.5, reviews: 42, nativeLanguage: 'English' },
  { firstName: 'Michael', lastName: 'Brown', rating: 5, reviews: 118, nativeLanguage: 'English' },
  { firstName: 'Olena', lastName: 'Shevchenko', rating: 3.9, reviews: 15, nativeLanguage: 'Ukrainian' },
  { firstName: 'Anna', lastName: 'Kowalska', rating: 4.2, reviews: 27, nativeLanguage: 'Polish' },
  { firstName: 'David', lastName: 'Lee', rating: 0, reviews: 0, nativeLanguage: null },
  { firstName: 'Sophia', lastName: 'Martinez', rating: 4.8, reviews: 64, nativeLanguage: 'Spanish' }
]

const STUDENTS = [
  { firstName: 'Emma', lastName: 'Davis', rating: 4.1, reviews: 9, nativeLanguage: 'English' },
  { firstName: 'Lucas', lastName: 'Garcia', rating: 3.5, reviews: 4, nativeLanguage: 'Spanish' },
  { firstName: 'Iryna', lastName: 'Bondarenko', rating: 4.9, reviews: 21, nativeLanguage: 'Ukrainian' },
  { firstName: 'Noah', lastName: 'Smith', rating: 0, reviews: 0, nativeLanguage: 'English' },
  { firstName: 'Mia', lastName: 'Johnson', rating: 2.8, reviews: 6, nativeLanguage: null },
  { firstName: 'Oliver', lastName: 'Taylor', rating: 4.4, reviews: 13, nativeLanguage: 'German' }
]

const PROFICIENCY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Test Preparation', 'Professional', 'Specialized']

const LANGUAGE_SETS = [
  ['English'],
  ['English', 'Ukrainian'],
  ['Ukrainian'],
  ['English', 'German'],
  ['English', 'Spanish'],
  ['Ukrainian', 'Polish']
]

const TUTOR_OFFERS_COUNT = 26
const STUDENT_OFFERS_COUNT = 14

const buildDocs = () => {
  const now = new Date()

  const categories = CATEGORIES.map((category, i) => ({
    _id: seedId('category', i + 1),
    name: category.name,
    appearance: {
      icon: categoryIcon(category.name.charAt(0), category.color),
      color: category.color
    },
    totalOffers: { student: 0, tutor: 0 },
    createdAt: now,
    updatedAt: now
  }))

  const subjects = CATEGORIES.flatMap((category, categoryIndex) =>
    category.subjects.map((name, subjectIndex) => ({
      _id: seedId('subject', categoryIndex * 2 + subjectIndex + 1),
      name,
      category: seedId('category', categoryIndex + 1),
      totalOffers: { student: 0, tutor: 0 },
      createdAt: now,
      updatedAt: now
    }))
  )

  const users = [...TUTORS, ...STUDENTS].map((user, i) => {
    const role = i < TUTORS.length ? 'tutor' : 'student'

    return {
      _id: seedId('user', i + 1),
      role: [role],
      firstName: user.firstName,
      lastName: user.lastName,
      email: `${user.firstName}.${user.lastName}@seed.test`.toLowerCase(),
      address: { country: 'Ukraine', city: 'Kyiv' },
      photo: '',
      professionalSummary: `${role === 'tutor' ? 'Tutor' : 'Student'} seeded for Find Offers testing.`,
      totalReviews: { student: role === 'student' ? user.reviews : 0, tutor: role === 'tutor' ? user.reviews : 0 },
      averageRating: { student: role === 'student' ? user.rating : 0, tutor: role === 'tutor' ? user.rating : 0 },
      nativeLanguage: user.nativeLanguage,
      isEmailConfirmed: true,
      isFirstLogin: false,
      lastLogin: now,
      appLanguage: 'en',
      status: { student: 'active', tutor: 'active', admin: 'active' },
      lastLoginAs: role,
      createdAt: now,
      updatedAt: now
    }
  })

  // Subjects of the last category (Finance) are excluded so that filtering by it yields an empty list
  const offerableSubjects = subjects.slice(0, (CATEGORIES.length - 1) * 2)

  const buildOffer = (n, authorRole) => {
    const subject = offerableSubjects[(n - 1) % offerableSubjects.length]
    const authorIndex = authorRole === 'tutor' ? (n - 1) % TUTORS.length : TUTORS.length + ((n - 1) % STUDENTS.length)
    const title =
      authorRole === 'tutor'
        ? `${subject.name} lessons with an experienced tutor`
        : `Looking for a ${subject.name} tutor`

    return {
      _id: seedId('offer', n),
      price: 100 + ((n * 157) % 1401),
      proficiencyLevel: PROFICIENCY_LEVELS[(n - 1) % PROFICIENCY_LEVELS.length],
      title,
      description: `${title}. Structured sessions, homework review and progress tracking included.`,
      languages: LANGUAGE_SETS[(n - 1) % LANGUAGE_SETS.length],
      authorRole,
      author: seedId('user', authorIndex + 1),
      subject: subject._id,
      category: subject.category,
      status: 'active',
      createdAt: new Date(Date.UTC(2026, 5, 1) + (n - 1) * 24 * 60 * 60 * 1000),
      updatedAt: now
    }
  }

  const offers = [
    ...Array.from({ length: TUTOR_OFFERS_COUNT }, (_, i) => buildOffer(i + 1, 'tutor')),
    ...Array.from({ length: STUDENT_OFFERS_COUNT }, (_, i) => buildOffer(TUTOR_OFFERS_COUNT + i + 1, 'student'))
  ]

  for (const offer of offers) {
    const subject = subjects.find((doc) => doc._id.equals(offer.subject))
    const category = categories.find((doc) => doc._id.equals(offer.category))
    subject.totalOffers[offer.authorRole] += 1
    category.totalOffers[offer.authorRole] += 1
  }

  return { categories, subjects, users, offers }
}

module.exports = {
  /**
   * Seeds deterministic test data for the Find Offers page (sprint 5):
   * categories, subjects, users (password: testPass123) and offers.
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async up(db) {
    const { categories, subjects, users, offers } = buildDocs()

    const passwordHash = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS)
    for (const user of users) {
      user.password = passwordHash
    }

    const collections = { categories, subjects, users, offers }
    for (const [collection, docs] of Object.entries(collections)) {
      await db.collection(collection).bulkWrite(
        docs.map((doc) => ({
          replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true }
        }))
      )
    }
  },

  /**
   * @param db {import('mongodb').Db}
   * @returns {Promise<void>}
   */
  async down(db) {
    const { categories, subjects, users, offers } = buildDocs()

    const collections = { categories, subjects, users, offers }
    for (const [collection, docs] of Object.entries(collections)) {
      await db.collection(collection).deleteMany({ _id: { $in: docs.map((doc) => doc._id) } })
    }
  }
}
