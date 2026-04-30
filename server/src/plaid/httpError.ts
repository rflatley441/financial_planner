import axios from 'axios'

/** Surface Plaid / Axios error bodies for API responses. */
export function formatPlaidHttpError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as {
      error_message?: string
      display_message?: string
      error_code?: string
    }
    if (typeof d?.display_message === 'string' && d.display_message) return d.display_message
    if (typeof d?.error_message === 'string' && d.error_message) return d.error_message
    if (err.message) return err.message
  }
  if (err instanceof Error) return err.message
  return 'Request failed'
}
