import type { UserRole } from '@prisma/client'

export type UserDTO = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: UserRole
  isActive: boolean
  createdAt: Date
}

export type InviteUserInput = {
  email: string
  firstName?: string
  lastName?: string
  role: UserRole
}

export type UpdateUserInput = {
  firstName?: string
  lastName?: string
  role?: UserRole
  isActive?: boolean
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }