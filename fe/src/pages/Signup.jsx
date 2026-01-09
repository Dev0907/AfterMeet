
import React, { useState } from 'react';
import NeoButton from '../components/ui/NeoButton';
import NeoInput from '../components/ui/NeoInput';
import NeoCard from '../components/ui/NeoCard';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        role: 'member',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Password Validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(formData.password)) {
            setError('Password must be 8+ chars, with Upper, Lower, Number & Special Char.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                // Store authentication state
                localStorage.setItem('userId', data.userId);
                navigate('/landing');
            } else {
                setError(data.error || 'Signup failed');
            }
        } catch {
            setError('Connection failed. Is the server running?');
        }
    };

    return (
        <div className="min-h-screen bg-neo-yellow flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-neo-red border-4 border-black rounded-full mix-blend-multiply filter blur-sm animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-neo-teal border-4 border-black rotate-12 mix-blend-multiply"></div>

            <NeoCard className="max-w-md w-full relative z-10">
                <div className="flex items-center gap-2 mb-6">
                    <Link to="/signin" className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h2 className="text-4xl font-black uppercase">Join Us</h2>
                </div>

                {error && (
                    <div className="bg-neo-red text-white p-3 border-4 border-black font-bold mb-4 shadow-neo-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <NeoInput
                        label="Full Name"
                        name="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                    <NeoInput
                        label="Email Address"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <div className="flex flex-col gap-1">
                        <NeoInput
                            label="Password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <p className="text-xs font-bold text-black mt-1">
                            * Must be at least 8 chars, incl. 1 uppercase, 1 lowercase, 1 number, 1 special char.
                        </p>
                    </div>

                    {/* Role Selection - Simplified as native select with brutalist border */}
                    <div className="flex flex-col gap-2 w-full">
                        <label className="font-bold text-black uppercase">Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full bg-white text-black font-medium py-3 px-4 border-4 border-black shadow-neo-sm outline-none focus:bg-neo-white focus:shadow-neo transition-all"
                        >
                            <option value="member">Member</option>
                            <option value="host">Host</option>
                        </select>
                    </div>


                    <NeoButton type="submit" className="mt-4 bg-neo-teal">
                        Create Account
                    </NeoButton>
                </form>

                <p className="mt-6 text-center font-bold">
                    Already a member?{' '}
                    <Link to="/signin" className="underline decoration-4 decoration-neo-red hover:decoration-black">
                        Sign In
                    </Link>
                </p>
            </NeoCard>
        </div>
    );
};

export default Signup;
