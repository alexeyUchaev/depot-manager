import { z } from 'zod'
import { UserRole } from '@prisma/client'

// Schema for inviting a user
export const inviteUserSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email is too long'),
  firstName: z
    .string()
    .max(100, 'First name is too long')
    .optional(),
  lastName: z
    .string()
    .max(100, 'Last name is too long')
    .optional(),
  role: z.nativeEnum(UserRole).refine((val) => Object.values(UserRole).includes(val), {
    message: 'Invalid role selected',
  }),
})

// Schema for updating a user
export const updateUserSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName:  z.string().max(100).optional(),
  role:      z.nativeEnum(UserRole).optional(),
  isActive:  z.boolean().optional(),
})

// Schema for ID validation
export const userIdSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
})

// Schema for Clerk webhook payload
export const clerkUserCreatedSchema = z.object({
  type: z.literal('user.created'),
  data: z.object({
    id: z.string(),
    email_addresses: z.array(
      z.object({
        email_address: z.string().email(),
        id: z.string(),
      })
    ),
    first_name: z.string().nullable(),
    last_name:  z.string().nullable(),
  }),
})

export type InviteUserSchema = z.infer<typeof inviteUserSchema>
export type UpdateUserSchema = z.infer<typeof updateUserSchema>