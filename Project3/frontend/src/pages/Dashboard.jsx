import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, LogOut } from 'lucide-react';
import axios from 'axios';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { token, logout, user } = useContext(AuthContext);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const res = await axios.get('http://localhost:5000/api/projects', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setProjects(res.data);
  };

  const createProject = async (e) => {
    e.preventDefault();
    if (!name) return;
    await axios.post('http://localhost:5000/api/projects', { name, description }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setName('');
    setDescription('');
    fetchProjects();
  };

  return (
    <div className="min-h-screen">
      <nav className="navbar">
        <div className="nav-brand"><FolderKanban /> Workspace</div>
        <div className="nav-user">
          <span>Hello, {user?.name}</span>
          <button onClick={logout} className="btn-logout"><LogOut size={16}/> Logout</button>
        </div>
      </nav>

      <main className="container dashboard-grid">
        <div className="panel">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={20}/> New Project</h3>
          <form onSubmit={createProject} className="form-group">
            <input type="text" placeholder="Project Name" value={name} onChange={e => setName(e.target.value)} required/>
            <textarea placeholder="Description" rows="4" value={description} onChange={e => setDescription(e.target.value)} />
            <button type="submit" className="btn-primary" style={{ padding: '0.5rem' }}>Create</button>
          </form>
        </div>

        <div>
          <h2>Your Boards</h2>
          <div className="projects-grid">
            {projects.map(project => (
              <Link to={`/project/${project._id}`} key={project._id} className="project-card">
                <h4>{project.name}</h4>
                <p>{project.description || 'No description provided.'}</p>
                <span className="badge">Owner: {project.owner?.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}