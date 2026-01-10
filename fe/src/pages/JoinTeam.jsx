
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NeoCard from '../components/ui/NeoCard';
import NeoButton from '../components/ui/NeoButton';
import NeoInput from '../components/ui/NeoInput';
import { Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const API_BASE = 'http://localhost:3000';

/**
 * JoinTeam - Page to join a team via invite code
 */
const JoinTeam = () => {
    const navigate = useNavigate();
    const { inviteCode: urlCode } = useParams();

    const [inviteCode, setInviteCode] = useState(urlCode || '');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(null);

    // Auto-join if code in URL
    useEffect(() => {
        if (urlCode && localStorage.getItem('userId')) {
            handleJoin();
        }
    }, [urlCode]);

    const handleJoin = async (e) => {
        if (e) e.preventDefault();

        const userId = localStorage.getItem('userId');
        if (!userId) {
            // Redirect to signin with return URL
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
            const response = await fetch(`${API_BASE}/api/teams/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase(), userId })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({
                    type: 'success',
                    message: `Successfully joined ${data.teamName}!`
                });
                // Redirect to team after 1.5s
                setTimeout(() => navigate(`/teams/${data.teamId}/meetings`), 1500);
            } else {
                setStatus({ type: 'error', message: data.error });

                // If already a member, offer to go to team
                if (data.teamId) {
                    setTimeout(() => navigate(`/teams/${data.teamId}/meetings`), 2000);
                }
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to join team. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neo-teal flex items-center justify-center p-4">
            <NeoCard className="max-w-md w-full">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-neo-yellow border-4 border-black flex items-center justify-center">
                        <Users size={32} />
                    </div>
                    <h1 className="text-3xl font-black uppercase">Join Team</h1>
                    <p className="font-medium text-gray-600 mt-2">
                        Enter the invite code to join a team
                    </p>
                </div>

                <form onSubmit={handleJoin} className="space-y-4">
                    <NeoInput
                        label="Invite Code"
                        name="inviteCode"
                        placeholder="e.g., ABCD1234"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        required
                    />

                    {status && (
                        <div className={`
                            p-3 border-4 border-black font-bold flex items-center gap-2
                            ${status.type === 'success' ? 'bg-green-200' : 'bg-neo-red text-white'}
                        `}>
                            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            {status.message}
                        </div>
                    )}

                    <NeoButton
                        type="submit"
                        className="w-full bg-neo-yellow"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin mr-2" />
                                Joining...
                            </>
                        ) : (
                            'Join Team'
                        )}
                    </NeoButton>
                </form>

                <p className="mt-6 text-center text-sm font-medium text-gray-500">
                    Don't have an invite code?{' '}
                    <button
                        onClick={() => navigate('/teams')}
                        className="font-bold text-black underline"
                    >
                        Create your own team
                    </button>
                </p>
            </NeoCard>
        </div>
    );
};

export default JoinTeam;
