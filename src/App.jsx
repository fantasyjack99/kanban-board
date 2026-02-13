import { useState, useEffect } from 'react'
import { supabase, tasksApi } from './supabase'

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
}

function App() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 載入任務
  useEffect(() => {
    loadTasks()

    // 訂閱即時更新
    const channel = tasksApi.subscribe((payload) => {
      if (payload.eventType === 'INSERT') {
        setTasks(prev => [...prev, payload.new])
      } else if (payload.eventType === 'UPDATE') {
        setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t))
      } else if (payload.eventType === 'DELETE') {
        setTasks(prev => prev.filter(t => t.id !== payload.old.id))
      }
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const data = await tasksApi.getAll()
      setTasks(data)
    } catch (err) {
      setError(err.message)
      // 如果表不存在，使用本地存儲
      if (err.message.includes('relation') || err.message.includes('does not exist')) {
        const saved = localStorage.getItem('kanban-tasks')
        setTasks(saved ? JSON.parse(saved) : [
          { id: 1, title: '討論新專案需求', description: '了解小鄭想要做什麼', status: 'todo', priority: 'high' },
          { id: 2, title: '更新座位圖 PORT', description: '把 Excel 整理好', status: 'done', priority: 'medium' },
        ])
      }
    } finally {
      setLoading(false)
    }
  }

  const addTask = async () => {
    if (!newTask.title.trim()) return
    try {
      const task = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: 'todo',
      }
      await tasksApi.add(task)
      setNewTask({ title: '', description: '', priority: 'medium' })
    } catch (err) {
      // 如果 Supabase 失敗，使用本地存儲
      const task = {
        id: Date.now(),
        ...newTask,
        status: 'todo',
      }
      const saved = JSON.parse(localStorage.getItem('kanban-tasks') || '[]')
      saved.push(task)
      localStorage.setItem('kanban-tasks', JSON.stringify(saved))
      setTasks(saved)
      setNewTask({ title: '', description: '', priority: 'medium' })
    }
  }

  const deleteTask = async (id) => {
    try {
      await tasksApi.delete(id)
    } catch (err) {
      // 使用本地存儲
      const saved = JSON.parse(localStorage.getItem('kanban-tasks') || '[]')
      const filtered = saved.filter(t => t.id !== id)
      localStorage.setItem('kanban-tasks', JSON.stringify(filtered))
      setTasks(filtered)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await tasksApi.updateStatus(id, status)
    } catch (err) {
      // 使用本地存儲
      const saved = JSON.parse(localStorage.getItem('kanban-tasks') || '[]')
      const updated = saved.map(t => t.id === id ? { ...t, status } : t)
      localStorage.setItem('kanban-tasks', JSON.stringify(updated))
      setTasks(updated)
    }
  }

  const handleDragStart = (e, task) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('taskId', task.id)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, status) => {
    e.preventDefault()
    const taskId = parseInt(e.dataTransfer.getData('taskId'))
    if (taskId) {
      updateStatus(taskId, status)
    }
  }

  const columns = [
    { id: 'todo', title: '📋 待辦', color: 'border-blue-500' },
    { id: 'doing', title: '🔥 進行中', color: 'border-orange-500' },
    { id: 'done', title: '✅ 完成', color: 'border-green-500' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">載入中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-800">📋 Sabrina & 小鄭 的 Kanban</h1>
        <p className="text-gray-600 mt-2">我們之間的溝通工具 🦊</p>
        {error && <p className="text-red-500 mt-2">⚠️ {error}</p>}
      </div>

      {/* 新增任務 */}
      <div className="max-w-6xl mx-auto mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">➕ 新增任務</h2>
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="任務標題"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="flex-1 min-w-200 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="描述（可選）"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            className="flex-1 min-w-200 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newTask.priority}
            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="high">🔴 高優先</option>
            <option value="medium">🟡 中優先</option>
            <option value="low">🟢 低優先</option>
          </select>
          <button
            onClick={addTask}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            新增
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => (
          <div
            key={col.id}
            className={`bg-white rounded-lg shadow-lg p-4 border-t-4 ${col.color}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <h2 className="text-lg font-semibold mb-4">{col.title}</h2>
            <div className="space-y-3">
              {tasks
                .filter((t) => t.status === col.id)
                .map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className="bg-gray-50 rounded-lg p-4 shadow cursor-move hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <span className={`px-2 py-1 rounded text-xs text-white ${priorityColors[task.priority]}`}>
                            {task.priority === 'high' ? '🔴 高' : task.priority === 'medium' ? '🟡 中' : '🟢 低'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-gray-400 hover:text-red-500 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* 統計 */}
      <div className="max-w-6xl mx-auto mt-8 flex gap-6 text-gray-600">
        <span>📋 待辦: {tasks.filter(t => t.status === 'todo').length}</span>
        <span>🔥 進行中: {tasks.filter(t => t.status === 'doing').length}</span>
        <span>✅ 完成: {tasks.filter(t => t.status === 'done').length}</span>
        <span>📊 總計: {tasks.length}</span>
      </div>
    </div>
  )
}

export default App
