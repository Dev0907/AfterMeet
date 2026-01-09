
import React from 'react';
import NeoButton from '../components/ui/NeoButton';
import NeoCard from '../components/ui/NeoCard';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-neo-yellow flex items-center justify-center p-4">
            <NeoCard className="max-w-2xl w-full text-center border-black">
                <h1 className="text-6xl font-black mb-6 uppercase tracking-tighter">
                    Welcome to the <span className="text-neo-red relative inline-block">
                        Club
                        <span className="absolute -bottom-2 left-0 w-full h-2 bg-black"></span>
                    </span>
                </h1>
                <p className="text-xl font-bold mb-8">
                    You made it. This is the place where everything happens.
                    Bold choices lead to bold results.
                </p>
                <div className="flex gap-4 justify-center">
                    <NeoButton onClick={() => {
                        localStorage.removeItem('userId');
                        navigate('/signin');
                    }} className="bg-neo-white">
                        Log Out
                    </NeoButton>
                    <NeoButton className="bg-neo-red text-white">
                        Explore More
                    </NeoButton>
                </div>
            </NeoCard>
        </div>
    );
};

export default Landing;
