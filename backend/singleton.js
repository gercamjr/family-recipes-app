const { mockDeep, mockReset } = require('jest-mock-extended')

const prisma = require('./lib/prisma')

jest.mock('./lib/prisma', () => mockDeep())

beforeEach(() => {
  mockReset(prismaMock)
})

const prismaMock = prisma

module.exports = { prismaMock }
