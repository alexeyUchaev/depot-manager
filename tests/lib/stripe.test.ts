import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('lib/stripe', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...ORIGINAL_ENV }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  describe('appBaseUrl', () => {
    it('falls back to localhost when NEXT_PUBLIC_APP_URL is unset', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL
      const { appBaseUrl } = await import('@/lib/stripe')
      expect(appBaseUrl()).toBe('http://localhost:3000')
    })

    it('uses NEXT_PUBLIC_APP_URL and strips a trailing slash', async () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://depot.example.com/'
      const { appBaseUrl } = await import('@/lib/stripe')
      expect(appBaseUrl()).toBe('https://depot.example.com')
    })
  })

  describe('assertStripeConfigured', () => {
    it('throws when STRIPE_SECRET_KEY is missing', async () => {
      delete process.env.STRIPE_SECRET_KEY
      const { assertStripeConfigured } = await import('@/lib/stripe')
      expect(() => assertStripeConfigured()).toThrow(/STRIPE_SECRET_KEY/)
    })

    it('does not throw when STRIPE_SECRET_KEY is set', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      const { assertStripeConfigured } = await import('@/lib/stripe')
      expect(() => assertStripeConfigured()).not.toThrow()
    })
  })
})