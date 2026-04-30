import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

function readEnvValue(name: string): string | undefined {
  const raw = process.env[name]
  if (!raw) return undefined
  // Allow `.env` lines like `KEY=value # comment` without breaking auth.
  return raw.replace(/\s+#.*$/, '').trim() || undefined
}

function plaidBasePath(): string {
  const env = (process.env.PLAID_ENV ?? 'sandbox').toLowerCase()
  if (env === 'production') return PlaidEnvironments.production
  return PlaidEnvironments.sandbox
}

export function isPlaidConfigured(): boolean {
  return Boolean(
    readEnvValue('PLAID_CLIENT_ID')
    && readEnvValue('PLAID_SECRET'),
  )
}

export function getPlaidClient(): PlaidApi {
  const clientId = readEnvValue('PLAID_CLIENT_ID')
  const secret = readEnvValue('PLAID_SECRET')
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
