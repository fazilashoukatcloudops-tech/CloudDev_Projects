import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from '../constants'

export type FieldErrors<K extends string> = Partial<Record<K, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLogin(v: { email: string; password: string }) {
  const errors: FieldErrors<'email' | 'password'> = {}
  if (!EMAIL_RE.test(v.email.trim())) errors.email = 'Valid email likho'
  if (!v.password) errors.password = 'Password zaroori hai'
  return errors
}

export function validateRegister(v: {
  name: string
  email: string
  password: string
  confirmPassword: string
}) {
  const errors: FieldErrors<'name' | 'email' | 'password' | 'confirmPassword'> = {}
  if (v.name.trim().length < 2) errors.name = 'Naam kam az kam 2 characters ka ho'
  else if (v.name.trim().length > 80) errors.name = 'Naam 80 characters se chota ho'
  if (!EMAIL_RE.test(v.email.trim())) errors.email = 'Valid email likho'
  if (v.password.length < 8) errors.password = 'Password kam az kam 8 characters ka ho'
  else if (v.password.length > 72) errors.password = 'Password 72 characters se chota ho'
  if (v.confirmPassword !== v.password) errors.confirmPassword = 'Passwords match nahi karte'
  return errors
}

export function validateFile(file: File): string | null {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) return 'Sirf PDF files allowed hain'
  if (file.size === 0) return 'File khali hai'
  if (file.size > MAX_UPLOAD_BYTES) return `File ${MAX_UPLOAD_MB} MB se choti honi chahiye`
  return null
}
