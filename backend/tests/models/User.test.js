const { hashPassword } = require('../../utils/auth')

describe('User Model', () => {
  beforeEach(async () => {
    // Clear all users before each test
    await User.destroy({ where: {} })
  })

  describe('Model Creation', () => {
    test('should create a user with valid data', async () => {
      const passwordHash = await hashPassword('testpassword123')

      const user = await User.create({
        email: 'test@example.com',
        passwordHash,
        role: 'viewer',
        languagePref: 'en',
      })

      expect(user.id).toBeDefined()
      expect(user.email).toBe('test@example.com')
      expect(user.passwordHash).toBe(passwordHash)
      expect(user.role).toBe('viewer')
      expect(user.languagePref).toBe('en')
      expect(user.isActive).toBe(true)
    })

    test('should set default values correctly', async () => {
      const passwordHash = await hashPassword('testpassword123')

      const user = await User.create({
        email: 'test2@example.com',
        passwordHash,
      })

      expect(user.role).toBe('viewer')
      expect(user.languagePref).toBe('en')
      expect(user.isActive).toBe(true)
    })

    test('should fail with invalid email', async () => {
      const passwordHash = await hashPassword('testpassword123')

      await expect(
        User.create({
          email: 'invalid-email',
          passwordHash,
          role: 'viewer',
        })
      ).rejects.toThrow()
    })

    test('should fail with duplicate email', async () => {
      const passwordHash = await hashPassword('testpassword123')

      await User.create({
        email: 'duplicate@example.com',
        passwordHash,
        role: 'viewer',
      })

      await expect(
        User.create({
          email: 'duplicate@example.com',
          passwordHash,
          role: 'viewer',
        })
      ).rejects.toThrow()
    })

    test('should accept any string for role in SQLite', async () => {
      // Note: SQLite doesn't enforce ENUM constraints like PostgreSQL
      const passwordHash = await hashPassword('testpassword123')

      const user = await User.create({
        email: 'test@example.com',
        passwordHash,
        role: 'invalid-role',
      })

      expect(user.role).toBe('invalid-role')
    })

    test('should accept any string for language preference in SQLite', async () => {
      // Note: SQLite doesn't enforce ENUM constraints like PostgreSQL
      const passwordHash = await hashPassword('testpassword123')

      const user = await User.create({
        email: 'test@example.com',
        passwordHash,
        languagePref: 'fr',
      })

      expect(user.languagePref).toBe('fr')
    })
  })

  describe('Instance Methods', () => {
    test('toJSON should exclude sensitive fields', async () => {
      const passwordHash = await hashPassword('testpassword123')

      const user = await User.create({
        email: 'test@example.com',
        passwordHash,
        role: 'viewer',
        inviteToken: 'sometoken',
        inviteTokenExpires: new Date(),
      })

      const jsonUser = user.toJSON()

      expect(jsonUser.email).toBe('test@example.com')
      expect(jsonUser.passwordHash).toBeUndefined()
      expect(jsonUser.inviteToken).toBeUndefined()
      expect(jsonUser.inviteTokenExpires).toBeUndefined()
      expect(jsonUser.id).toBeDefined()
      expect(jsonUser.role).toBe('viewer')
    })
  })
})
