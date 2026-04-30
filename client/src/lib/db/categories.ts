import { supabase } from '../supabase'
import type { Category } from '../../types'

/** Returns system categories + the current user's custom categories, sorted by name. */
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('is_income', { ascending: true })
    .order('name',      { ascending: true })
  if (error) throw error
  return data as Category[]
}
