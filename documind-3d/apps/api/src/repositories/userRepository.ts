import { randomUUID } from 'node:crypto'

export type User = {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

export type CreateUserInput = { name: string; email: string; passwordHash: string }

export class EmailTakenError extends Error {
  constructor() {
    super('Email already registered')
    this.name = 'EmailTakenError'
  }
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  create(input: CreateUserInput): Promise<User>
}

export class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>()

  async findByEmail(email: string) {
    for (const user of this.users.values()) {
      if (user.email === email) return user
    }
    return null
  }

  async findById(id: string) {
    return this.users.get(id) ?? null
  }

  async create(input: CreateUserInput) {
    if (await this.findByEmail(input.email)) throw new EmailTakenError()
    const user: User = { id: randomUUID(), createdAt: new Date().toISOString(), ...input }
    this.users.set(user.id, user)
    return user
  }

  clear() {
    this.users.clear()
  }
}

export const userRepository = new InMemoryUserRepository()
