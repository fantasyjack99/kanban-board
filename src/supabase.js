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

  // 更新任務狀態
  async updateStatus(id, status) {
    const { error } = await supabase
      .from('tasks')
      .update({ status })
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
  },

  // 即時訂閱更新
  subscribe(callback) {
    return supabase
      .channel('tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, callback)
      .subscribe()
  }
}
