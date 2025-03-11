// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api'; // Create the login function in your API file

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await login(email, password); // Pass the values here

            // Save the token to localStorage
            localStorage.setItem('token', response.token);

            // Check if the user is an admin by looking at the response or decoded JWT
            if (response.userRole === 'admin') {
                navigate('/admin'); // Redirect to admin panel if the user is an admin
            } else {
                navigate('/'); // Redirect to home or dashboard if the user is not an admin
            }
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="p-8 max-w-lg mx-auto">
            <h1 className="text-4xl font-bold text-center mb-6">Login</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
                {error && <p className="text-red-500">{error}</p>}
                <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">Login</button>
            </form>
        </div>
    );
};

export default Login;
