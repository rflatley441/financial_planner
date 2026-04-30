import { AccountType as PlaidAccountType, type AccountBase } from 'plaid'

/** Maps Plaid account → Finwise `accounts` row fields (excluding ids / user_id). */
export type MappedAccountRow = {
  name: string
  institution: string
  type:
    | 'checking'
    | 'savings'
    | 'credit_card'
    | 'brokerage'
    | 'retirement'
    | 'loan'
    | 'other'
  balance: number
  is_liability: boolean
  currency: string
  color: string
  plaid_item_id: string
  plaid_account_id: string
  last_synced: string
}

const TYPE_COLORS: Record<MappedAccountRow['type'], string> = {
  checking:    '#1E40AF',
  savings:     '#1D4ED8',
  credit_card: '#DC2626',
  brokerage:   '#059669',
  retirement:  '#7C3AED',
  loan:        '#D97706',
  other:       '#475569',
}

function retirementSubtype(sub: string): boolean {
  const s = sub.toLowerCase()
  return (
    s.includes('ira')
    || s.includes('401')
    || s === '401k'
    || s === '403b'
    || s.includes('roth')
    || s.includes('457')
    || s.includes('hsa')
    || s.includes('pension')
    || s.includes('retirement')
  )
}

export function mapPlaidAccount(
  a: AccountBase,
  itemId: string,
  institutionName: string,
): MappedAccountRow {
  const sub = (a.subtype ?? '').toString().toLowerCase()
  const currency = a.balances.iso_currency_code ?? 'USD'

  let type: MappedAccountRow['type'] = 'other'
  let is_liability = false

  switch (a.type) {
    case PlaidAccountType.Depository:
      if (sub === 'savings' || sub === 'money market' || sub === 'cd' || sub === 'hsa') type = 'savings'
      else type = 'checking'
      break
    case PlaidAccountType.Credit:
      type = 'credit_card'
      is_liability = true
      break
    case PlaidAccountType.Loan:
      type = 'loan'
      is_liability = true
      break
    case PlaidAccountType.Investment:
    case PlaidAccountType.Brokerage:
      type = retirementSubtype(sub) ? 'retirement' : 'brokerage'
      break
    default:
      type = 'other'
  }

  const raw =
    a.balances.current ?? a.balances.available ?? a.balances.limit ?? 0
  const balance = typeof raw === 'number' ? raw : Number(raw)

  const mask = a.mask ? ` ···${a.mask}` : ''
  const baseName = a.name || a.official_name || 'Account'
  const name = `${baseName}${mask}`

  const now = new Date().toISOString()

  return {
    name,
    institution: institutionName,
    type,
    balance: Number.isFinite(balance) ? balance : 0,
    is_liability,
    currency,
    color: TYPE_COLORS[type],
    plaid_item_id: itemId,
    plaid_account_id: a.account_id,
    last_synced: now,
  }
}
