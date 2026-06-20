import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      login(res.data.user, res.data.token);
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-wrapper">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Welcome Back</h2>
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary">
          Log In
        </button>
        <p
          style={{
            marginTop: "1rem",
            textAlign: "center",
            fontSize: "0.85rem",
          }}
        >
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--primary)" }}>
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
