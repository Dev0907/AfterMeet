
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NeoCard from '../components/ui/NeoCard';
import NeoButton from '../components/ui/NeoButton';
import NeoInput from '../components/ui/NeoInput';
import { NeoSkeletonCard } from '../components/ui/NeoSkeleton';
import {
    Users,
    Plus,
    ChevronRight,
    Calendar,
    FileAudio,
    X,
    UserPlus,
    LogOut,
    Link2,
} from 'lucide-react';

const API_BASE = 'http://localhost:3000';

/**
 * TeamsList - Shows all teams the user belongs to
 */
const TeamsList = () => {
    const navigate = useNavigate();

    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [joinError, setJoinError] = useState('');

    // Fetch teams on mount
    useEffect(() => {
        const fetchTeams = async () => {
            setIsLoading(true);
            const userId = localStorage.getItem('userId');

            try {
                const response = await fetch(`${API_BASE}/api/teams?userId=${userId}`);
                if (response.ok) {
                    const data = await response.json();
                    setTeams(data);
                } else {
                    console.error('Failed to fetch teams');
                    setTeams([]);
                }
            } catch (err) {
                console.error('Error fetching teams:', err);
                setTeams([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeams();
    }, []);

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (!newTeamName.trim()) return;

        const userId = localStorage.getItem('userId');

        try {
            const response = await fetch(`${API_BASE}/api/teams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTeamName.trim(), userId })
            });

            if (response.ok) {
                const newTeam = await response.json();
                setTeams(prev => [newTeam, ...prev]);
                setNewTeamName('');
                setShowCreateModal(false);
            } else {
                console.error('Failed to create team');
            }
        } catch (err) {
            console.error('Error creating team:', err);
        }
    };

    const handleJoinTeam = async (e) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        const userId = localStorage.getItem('userId');
        setJoinError('');

        try {
            const response = await fetch(`${API_BASE}/api/teams/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteCode: joinCode.trim().toUpperCase(), userId })
            });

            const data = await response.json();

            if (response.ok) {
                // Refresh teams list
                const teamsResponse = await fetch(`${API_BASE}/api/teams?userId=${userId}`);
                if (teamsResponse.ok) {
                    const teamsData = await teamsResponse.json();
                    setTeams(teamsData);
                }
                setJoinCode('');
                setShowJoinModal(false);
                // Navigate to the joined team
                navigate(`/teams/${data.teamId}/meetings`);
            } else {
                setJoinError(data.error || 'Failed to join team');
            }
        } catch (err) {
            console.error('Error joining team:', err);
            setJoinError('Failed to join team. Please try again.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userId');
        navigate('/signin');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No meetings yet';
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getRoleBadge = (role) => {
        const styles = {
            owner: 'bg-neo-yellow',
            member: 'bg-neo-teal',
        };
        return (
            <span className={`
                text-xs font-bold uppercase px-2 py-0.5 
                border-2 border-black ${styles[role] || styles.member}
            `}>
                {role}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-neo-white">
            {/* Header */}
            <header className="bg-neo-yellow border-b-4 border-black">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tight">
                                Your Teams
                            </h1>
                            <p className="font-medium text-gray-700 mt-1">
                                Select a team to view its meetings
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <NeoButton
                                onClick={() => setShowJoinModal(true)}
                                className="bg-white"
                            >
                                <Link2 size={18} className="mr-2" />
                                Join Team
                            </NeoButton>
                            <NeoButton
                                onClick={() => setShowCreateModal(true)}
                                className="bg-neo-teal"
                            >
                                <Plus size={18} className="mr-2" />
                                New Team
                            </NeoButton>
                            <button
                                onClick={handleLogout}
                                className="p-3 border-4 border-black bg-white shadow-neo hover:shadow-neo-hover hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Teams Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <NeoSkeletonCard />
                        <NeoSkeletonCard />
                        <NeoSkeletonCard />
                    </div>
                ) : teams.length === 0 ? (
                    <NeoCard className="text-center py-12">
                        <Users size={64} className="mx-auto mb-4 text-gray-400" />
                        <h2 className="text-2xl font-black uppercase mb-2">No Teams Yet</h2>
                        <p className="font-medium text-gray-600 mb-6">
                            Create your first team to start organizing meetings
                        </p>
                        <NeoButton
                            onClick={() => setShowCreateModal(true)}
                            className="bg-neo-teal"
                        >
                            <Plus size={18} className="mr-2" />
                            Create Team
                        </NeoButton>
                    </NeoCard>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teams.map((team) => (
                            <button
                                key={team.id}
                                onClick={() => navigate(`/teams/${team.id}/meetings`)}
                                className="
                                    text-left bg-white border-4 border-black shadow-neo p-5
                                    hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-hover
                                    active:translate-x-2 active:translate-y-2 active:shadow-none
                                    transition-all group
                                "
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2 bg-neo-dark border-2 border-black">
                                        <Users size={24} />
                                    </div>
                                    {getRoleBadge(team.role)}
                                </div>

                                <h3 className="font-black text-xl mb-3">
                                    {team.name}
                                </h3>

                                <div className="space-y-2 text-sm text-gray-600 font-medium">
                                    <div className="flex items-center gap-2">
                                        <UserPlus size={14} />
                                        <span>{team.memberCount} member{team.memberCount !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FileAudio size={14} />
                                        <span>{team.meetingCount} meeting{team.meetingCount !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} />
                                        <span>Last: {formatDate(team.lastMeeting)}</span>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-end text-sm font-bold text-gray-500 group-hover:text-black transition-colors">
                                    View Meetings
                                    <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Team Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <NeoCard className="w-full max-w-md relative">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="absolute top-4 right-4 p-1 border-2 border-black hover:bg-neo-red transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-black uppercase mb-6">Create Team</h2>

                        <form onSubmit={handleCreateTeam} className="space-y-4">
                            <NeoInput
                                label="Team Name"
                                name="teamName"
                                placeholder="e.g., Product Team"
                                value={newTeamName}
                                onChange={(e) => setNewTeamName(e.target.value)}
                                required
                            />

                            <NeoButton type="submit" className="w-full bg-neo-teal">
                                Create Team
                            </NeoButton>
                        </form>
                    </NeoCard>
                </div>
            )}

            {/* Join Team Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <NeoCard className="w-full max-w-md relative">
                        <button
                            onClick={() => { setShowJoinModal(false); setJoinError(''); setJoinCode(''); }}
                            className="absolute top-4 right-4 p-1 border-2 border-black hover:bg-neo-red transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-black uppercase mb-2">Join Team</h2>
                        <p className="text-sm font-medium text-gray-600 mb-4">
                            Enter the invite code shared by the team host
                        </p>

                        <form onSubmit={handleJoinTeam} className="space-y-4">
                            <NeoInput
                                label="Invite Code"
                                name="inviteCode"
                                placeholder="e.g., ABCD1234"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                required
                            />

                            {joinError && (
                                <div className="p-3 bg-neo-red text-white font-bold border-4 border-black">
                                    {joinError}
                                </div>
                            )}

                            <NeoButton type="submit" className="w-full bg-neo-teal">
                                <UserPlus size={18} className="mr-2" />
                                Join Team
                            </NeoButton>
                        </form>
                    </NeoCard>
                </div>
            )}

            {/* Footer */}
            <footer className="mt-12 border-t-4 border-black bg-neo-yellow py-6">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <p className="font-bold text-sm">
                        AfterMeet • Meeting Intelligence Platform
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default TeamsList;
