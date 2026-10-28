import { compare, hash } from 'bcryptjs'
import { env } from '../config/env'

export const hashPassword = (password: string) => hash(password, env.BCRYPT_ROUNDS)

export const verifyPassword = (password: string, passwordHash: string) =>
  compare(password, passwordHash)

let dummyHash: Promise<string> | undefined

export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= hashPassword('dummy-password-for-timing')
  await compare(password, await dummyHash)
}
