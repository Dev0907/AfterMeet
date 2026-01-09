
import React, { useState } from 'react';
import NeoButton from '../components/ui/NeoButton';
import NeoInput from '../components/ui/NeoInput';
import NeoCard from '../components/ui/NeoCard';
import { Link, useNavigate } from 'react-router-dom';

const Signin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3000/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                // Store authentication state
                localStorage.setItem('userId', data.userId);
                navigate('/teams');
            } else {
                setError(data.error || 'Signin failed');
            }
        } catch {
            setError('Connection failed. Is the server running?');
        }
    };

    return (
        <div className="min-h-screen bg-neo-teal flex flex-col items-center justify-center p-4">
            {/* Professional Accent */}
            <div className="absolute top-0 right-0 p-10">
                <div className="w-20 h-20 bg-neo-teal opacity-50 rounded-full blur-xl"></div>
            </div>

            <NeoCard className="max-w-md w-full border-black shadow-neo">
                <h2 className="text-3xl font-black uppercase mb-6 text-center tracking-tight">
                    Welcome Back
                </h2>

                {error && (
                    <div className="bg-neo-red text-white p-3 border-2 border-black font-bold mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <NeoInput
                        label="Email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <NeoInput
                        label="Password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <NeoButton type="submit" className="mt-2 bg-black text-black hover:bg-neo-dark border-0">
                        Sign In
                    </NeoButton>
                </form>

                <p className="mt-6 text-center font-medium text-sm">
                    New here?{' '}
                    <Link to="/signup" className="underline decoration-2 decoration-neo-teal hover:decoration-black font-bold">
                        Create an Account
                    </Link>
                </p>
            </NeoCard>
        </div>
    );
};

export default Signin;
