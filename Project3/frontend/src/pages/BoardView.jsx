import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, MessageSquare, Plus, User } from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';

let socket;

export default function BoardView() {
  const { id } = useParams();
  const { token, user } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [activeTask, setActiveTask] = useState(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchProject();
    fetchUsers();

    socket = io('http://localhost:5000');
    socket.emit('join_project', id);

    socket.on('project_updated', (updatedProject) => {
      setProject(updatedProject);
      if (activeTask) {
        const refreshedTask = updatedProject.tasks.find(t => t._id === activeTask._id);
        setActiveTask(refreshedTask);
      }
    });

    return () => socket.disconnect();
  }, [id, activeTask]);

  const fetchProject = async () => {
    const res = await axios.get(`http://localhost:5000/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setProject(res.data);
  };

  const fetchUsers = async () => {
    const res = await axios.get(`http://localhost:5000/api/auth/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setUsers(res.data);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskTitle) return;
    await axios.post(`http://localhost:5000/api/projects/${id}/tasks`, { title: taskTitle, assignedTo }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTaskTitle('');
    setAssignedTo('');
  };

  const handleStatusChange = async (taskId, nextStatus) => {
    await axios.put(`http://localhost:5000/api/projects/tasks/${taskId}/status`, { status: nextStatus }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText) return;
    await axios.post(`http://localhost:5000/api/projects/tasks/${activeTask._id}/comments`, { text: commentText }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setCommentText('');
  };

  if (!project) return <div className="p-8 text-center">Loading Board...</div>;

  const columns = ['Todo', 'In Progress', 'Done'];

  return (
    <div className="min-h-screen" style={{ padding: '2rem' }}>
      <header className="board-header">
        <Link to="/" className="btn-icon"><ArrowLeft size={18}/></Link>
        <div>
          <h2>{project.name}</h2>
          <p style={{ color: 'var(--text-muted)' }}>{project.description}</p>
        </div>
      </header>

      <form onSubmit={handleAddTask} className="task-bar">
        <input type="text" placeholder="Add a new task..." value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required />
        <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
          <option value="">Assign To...</option>
          {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
        </select>
        <button type="submit" className="btn-sm"><Plus size={16}/> Add Task</button>
      </form>

      <div className="kanban-grid">
        {columns.map(col => (
          <div key={col} className="kanban-column">
            <div className="column-header">
              <span>{col}</span>
              <span className="column-count">{project.tasks.filter(t => t.status === col).length}</span>
            </div>
            <div>
              {project.tasks.filter(t => t.status === col).map(task => (
                <div key={task._id} onClick={() => setActiveTask(task)} className="task-card">
                  <h4>{task.title}</h4>
                  <div className="task-meta">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12}/> {task.assignedTo?.name || 'Unassigned'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageSquare size={12}/> {task.comments?.length || 0}</span>
                  </div>
                  <div className="task-actions" onClick={e => e.stopPropagation()}>
                    {col !== 'Todo' && <button onClick={() => handleStatusChange(task._id, col === 'Done' ? 'In Progress' : 'Todo')} className="btn-action">◀ Back</button>}
                    {col !== 'Done' && <button onClick={() => handleStatusChange(task._id, col === 'Todo' ? 'In Progress' : 'Done')} className="btn-action next">Next ▶</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {activeTask && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={() => setActiveTask(null)} className="btn-close">✕</button>
            <h3>{activeTask.title}</h3>
            <p>Status: <strong style={{ color: 'var(--primary)' }}>{activeTask.status}</strong> | Assigned to: {activeTask.assignedTo?.name || 'Unassigned'}</p>
            
            <div className="comments-section">
              <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Comments ({activeTask.comments?.length || 0})</h4>
              <div className="comment-list">
                {activeTask.comments?.map(c => (
                  <div key={c._id} className="comment-item">
                    <strong>{c.user?.name || user.name}: </strong> {c.text}
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddComment} className="comment-form">
                <input type="text" placeholder="Write a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} required />
                <button type="submit" className="btn-sm">Send</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}