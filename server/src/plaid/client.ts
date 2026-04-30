import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

function plaidBasePath(): string {
  const env = (process.env.PLAID_ENV ?? 'sandbox').toLowerCase()
  if (env === 'production') return PlaidEnvironments.production
  return PlaidEnvironments.sandbox
}

export function isPlaidConfigured(): boolean {
  return Boolean(
    process.env.PLAID_CLIENT_ID?.trim()
    && process.env.PLAID_SECRET?.trim(),
  )
}

export function getPlaidClient(): PlaidApi {
  const clientId = process.env.PLAID_CLIENT_ID?.trim()
  const secret = process.env.PLAID_SECRET?.trim()
  if (!clientId || !secret) {
    throw new Error('PLAID_CLIENT_ID and PLAID_SECRET must be set')
  }
  const configuration = new Configuration({
    basePath: plaidBasePath(),
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': clientId,
        'PLAID-SECRET': secret,
      },
    },
  })
  return new PlaidApi(configuration)
}
