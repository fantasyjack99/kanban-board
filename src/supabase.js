import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 數據庫操作
export const tasksApi = {
  // 獲取所有任務
  async getAll() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  },

  // 新增任務
  async add(task) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select()
    if (error) throw error
    return data[0]
  },

  // 更新任務
  async update(id, updates) {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
    if (error) throw error
  },

  // 刪除任務
  async delete(id) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

// 留言操作
export const commentsApi = {
  // 獲取任務的所有留言
  async getByTaskId(taskId) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  },

  // 新增留言
  async add(comment) {
    const { data, error } = await supabase
      .from('comments')
      .insert([comment])
      .select()
    if (error) throw error
    return data[0]
  },

  // 刪除留言
  async delete(id) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  // 即時訂閱
  subscribe(taskId, callback) {
    return supabase
      .channel(`comments-${taskId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'comments',
        filter: `task_id=eq.${taskId}`
      }, callback)
      .subscribe()
  }
}

// 預設大頭貼
export const DEFAULT_AVATAR = 'https://mhmfqquydthwejvzdjou.supabase.co/storage/v1/object/public/avatars/sabrina.png'
