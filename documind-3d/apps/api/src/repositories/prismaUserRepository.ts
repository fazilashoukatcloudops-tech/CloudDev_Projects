import { Prisma, type PrismaClient, type User as UserRow } from '@prisma/client'
import {
  EmailTakenError,
  type CreateUserInput,
  type User,
  type UserRepository,
} from './userRepository'

const toUser = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  passwordHash: row.passwordHash,
  createdAt: row.createdAt.toISOString(),
})

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEmail(email: string) {
    const row = await this.db.user.findUnique({ where: { email } })
    return row ? toUser(row) : null
  }

  async findById(id: string) {
    const row = await this.db.user.findUnique({ where: { id } })
    return row ? toUser(row) : null
  }

  async create(input: CreateUserInput) {
    try {
      return toUser(await this.db.user.create({ data: input }))
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new EmailTakenError()
      }
      throw err
    }
  }
}
