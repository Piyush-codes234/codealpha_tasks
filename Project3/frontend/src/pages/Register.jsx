import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', { name, email, password });
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <h2 className="mb-6 text-center text-3xl font-extrabold text-gray-800">Create Account</h2>
        <input type="text" placeholder="Full Name" className="mb-4 w-full rounded-lg border p-3 focus:outline-indigo-500" onChange={e => setName(e.target.value)} required />
        <input type="email" placeholder="Email" className="mb-4 w-full rounded-lg border p-3 focus:outline-indigo-500" onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" className="mb-6 w-full rounded-lg border p-3 focus:outline-indigo-500" onChange={e => setPassword(e.target.value)} required />
        <button type="submit" className="w-full rounded-lg bg-purple-600 p-3 font-semibold text-white transition hover:bg-purple-700">Sign Up</button>
        <p className="mt-4 text-center text-sm text-gray-600">Already have an account? <Link to="/login" className="text-purple-600 underline">Log In</Link></p>
      </form>
    </div>
  );
}