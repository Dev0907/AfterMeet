import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NeoCard from '../components/ui/NeoCard';
import NeoButton from '../components/ui/NeoButton';
import NeoInput from '../components/ui/NeoInput';
import { Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { teamsApi } from '../services/api';

const JoinTeam = () => {
    const navigate = useNavigate();
    const { inviteCode: urlCode } = useParams();
    const [inviteCode, setInviteCode] = useState(urlCode || '');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        if (urlCode && localStorage.getItem('userId')) {
            handleJoin();
        }
    }, [urlCode]);

    const handleJoin = async (e) => {
        if (e) e.preventDefault();
        const userId = localStorage.getItem('userId');
        if (!userId) {
            navigate(`/signin?redirect=/join/${inviteCode}`);
            return;
        }
        if (!inviteCode.trim()) {
            setStatus({ type: 'error', message: 'Please enter an invite code' });
            return;
        }
        setIsLoading(true);
        setStatus(null);
        try {
            const { data } = await teamsApi.join({ inviteCode: inviteCode.trim().toUpperCase(), userId });
            setStatus({ type: 'success', message: `Successfully joined ${data.teamName}!` });
            setTimeout(() => navigate(`/teams/${data.teamId}/meetings`), 1500);
        } catch (err) {
            const errorData = err.response?.data;
            setStatus({ type: 'error', message: errorData?.error || 'Failed to join team' });
            if (errorData?.teamId) {
                setTimeout(() => navigate(`/teams/${errorData.teamId}/meetings`), 2000);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neo-teal flex items-center justify-center p-4">
            <NeoCard className="max-w-md w-full">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-neo-yellow border-4 border-black flex items-center justify-center"><Users size={32} /></div>
                    <h1 className="text-3xl font-black uppercase">Join Team</h1>
                    <p className="font-medium text-gray-600 mt-2">Enter the invite code to join a team</p>
                </div>
                <form onSubmit={handleJoin} className="space-y-4">
                    <NeoInput label="Invite Code" name="inviteCode" placeholder="e.g., ABCD1234" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} required />
                    {status && (
                        <div className={`p-3 border-4 border-black font-bold flex items-center gap-2 ${status.type === 'success' ? 'bg-green-200' : 'bg-neo-red text-white'}`}>
                            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            {status.message}
                        </div>
                    )}
                    <NeoButton type="submit" className="w-full bg-neo-yellow" disabled={isLoading}>
                        {isLoading ? <><Loader2 size={18} className="animate-spin mr-2" />Joining...</> : 'Join Team'}
                    </NeoButton>
                </form>
                <p className="mt-6 text-center text-sm font-medium text-gray-500">
                    Don't have an invite code?{' '}
                    <button onClick={() => navigate('/teams')} className="font-bold text-black underline">Create your own team</button>
                </p>
            </NeoCard>
        </div>
    );
};

export default JoinTeam;
