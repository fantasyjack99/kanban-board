import { useState, useEffect } from 'react'
import { supabase, tasksApi, commentsApi } from './supabase'

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
  const [selectedTask, setSelectedTask] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)

  // 載入任務
  useEffect(() => {
    loadTasks()
  }, [])

  // 選擇任務時載入留言
  useEffect(() => {
    if (selectedTask) {
      loadComments(selectedTask.id)
      
      // 訂閱留言更新
      const channel = commentsApi.subscribe(selectedTask.id, (payload) => {
        if (payload.eventType === 'INSERT') {
          setComments(prev => [...prev, payload.new])
        } else if (payload.eventType === 'DELETE') {
          setComments(prev => prev.filter(c => c.id !== payload.old.id))
        }
      })

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedTask])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const data = await tasksApi.getAll()
      setTasks(data)
    } catch (err) {
      setError(err.message)
      // 使用本地存儲備份
      const saved = localStorage.getItem('kanban-tasks')
      setTasks(saved ? JSON.parse(saved) : [])
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async (taskId) => {
    try {
      const data = await commentsApi.getByTaskId(taskId)
      setComments(data)
    } catch (err) {
      console.error('載入留言失敗:', err)
      const saved = JSON.parse(localStorage.getItem(`comments-${taskId}`) || '[]')
      setComments(saved)
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
      loadTasks()
    } catch (err) {
      const task = { id: Date.now(), ...newTask, status: 'todo' }
      const saved = JSON.parse(localStorage.getItem('kanban-tasks') || '[]')
      saved.push(task)
      localStorage.setItem('kanban-tasks', JSON.stringify(saved))
      setTasks(saved)
      setNewTask({ title: '', description: '', priority: 'medium' })
    }
  }

  const addComment = async () => {
    if (!newComment.trim() || !selectedTask) return
    try {
      await commentsApi.add({
        task_id: selectedTask.id,
        content: newComment,
        author: '小鄭'
      })
      setNewComment('')
    } catch (err) {
      const comment = {
        id: Date.now(),
        task_id: selectedTask.id,
        content: newComment,
        author: '小鄭',
        created_at: new Date().toISOString()
      }
      const saved = JSON.parse(localStorage.getItem(`comments-${selectedTask.id}`) || '[]')
      saved.push(comment)
      localStorage.setItem(`comments-${selectedTask.id}`, JSON.stringify(saved))
      setComments([...comments, comment])
      setNewComment('')
    }
  }

  const deleteTask = async (id) => {
    try {
      await tasksApi.delete(id)
      loadTasks()
    } catch (err) {
      const saved = JSON.parse(localStorage.getItem('kanban-tasks') || '[]')
      const filtered = saved.filter(t => t.id !== id)
      localStorage.setItem('kanban-tasks', JSON.stringify(filtered))
      setTasks(filtered)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await tasksApi.update(id, { status })
      loadTasks()
    } catch (err) {
      const saved = JSON.parse(localStorage.getItem('kanban-tasks') || '[]')
      const updated = saved.map(t => t.id === id ? { ...t, status } : t)
      localStorage.setItem('kanban-tasks', JSON.stringify(updated))
      setTasks(updated)
    }
  }

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task.id)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
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

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleString('zh-TW')
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-800">📋 Sabrina & 小鄭 的 Kanban</h1>
        <p className="text-gray-600 mt-2">💬 點擊卡片可以留言討論 🦊</p>
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
                    onClick={() => setSelectedTask(task)}
                    className="bg-gray-50 rounded-lg p-4 shadow cursor-pointer hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                        )}
                        <div className="flex gap-2 mt-3 items-center">
                          <span className={`px-2 py-1 rounded text-xs text-white ${priorityColors[task.priority]}`}>
                            {task.priority === 'high' ? '🔴 高' : task.priority === 'medium' ? '🟡 中' : '🟢 低'}
                          </span>
                          {task.created_at && (
                            <span className="text-xs text-gray-400">
                              {formatDate(task.created_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
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

      {/* 任務詳情 Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{selectedTask.title}</h2>
                  {selectedTask.description && (
                    <p className="text-gray-600 mt-1">{selectedTask.description}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <span className={`px-2 py-1 rounded text-xs text-white ${priorityColors[selectedTask.priority]}`}>
                      {selectedTask.priority === 'high' ? '🔴 高優先' : selectedTask.priority === 'medium' ? '🟡 中優先' : '🟢 低優先'}
                    </span>
                    <span className="px-2 py-1 bg-gray-200 rounded text-xs">
                      {selectedTask.status === 'todo' ? '📋 待辦' : selectedTask.status === 'doing' ? '🔥 進行中' : '✅ 完成'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 留言區 */}
            <div className="p-6 max-h-96 overflow-y-auto">
              <h3 className="font-semibold mb-4">💬 留言討論</h3>
              
              {/* 留言列表 */}
              <div className="space-y-4 mb-6">
                {comments.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">暫無留言</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-blue-600">{comment.author || '匿名'}</span>
                        <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="mt-2 text-gray-700">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* 新增留言 */}
              <div className="border-t pt-4">
                <textarea
                  placeholder="💬 留言..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="3"
                />
                <button
                  onClick={addComment}
                  disabled={!newComment.trim()}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                >
                  送出留言
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
