-- Supabase Database Setup for Kanban Board
-- 執行這個 SQL 來創建 tasks 表

-- 創建 tasks 表
CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 啟用 RLS (Row Level Security)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 創建 policy - 允許匿名讀取
CREATE POLICY "Allow anonymous reads" ON tasks
  FOR SELECT
  USING (true);

-- 創建 policy - 允許匿名插入
CREATE POLICY "Allow anonymous inserts" ON tasks
  FOR INSERT
  WITH CHECK (true);

-- 創建 policy - 允許匿名更新
CREATE POLICY "Allow anonymous updates" ON tasks
  FOR UPDATE
  USING (true);

-- 創建 policy - 允許匿名刪除
CREATE POLICY "Allow anonymous deletes" ON tasks
  FOR DELETE
  USING (true);

-- 創建索引優化查詢
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- 插入一些範例任務
INSERT INTO tasks (title, description, status, priority) VALUES
  ('討論新專案需求', '了解小鄭想要做什麼', 'todo', 'high'),
  ('更新座位圖 PORT', '把 Excel 整理好', 'done', 'medium'),
  ('安裝 Peekaboo', 'macOS UI 自動化工具', 'done', 'low')
ON CONFLICT DO NOTHING;
