import { supabase, requireUserId } from '../supabase'
import type { Goal } from '../../types'
import type { GoalInsert, GoalUpdate } from '../../types/database'

export async function getGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Goal[]
}

export async function createGoal(
  input: Omit<GoalInsert, 'user_id'>
): Promise<Goal> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('goals')
    .insert({ ...input, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data as Goal
}

export async function updateGoal(id: string, input: GoalUpdate): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Goal
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)
  if (error) throw error
}
