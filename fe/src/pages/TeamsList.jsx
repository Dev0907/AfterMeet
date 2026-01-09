
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
} from 'lucide-react';

// Mock data for demo
const MOCK_TEAMS = [
    {
        id: 'team-1',
        name: 'Product Team',
        memberCount: 5,
        meetingCount: 12,
        lastMeeting: '2026-01-09T10:00:00Z',
        role: 'owner',
    },
    {
        id: 'team-2',
        name: 'Engineering',
        memberCount: 8,
        meetingCount: 24,
        lastMeeting: '2026-01-08T14:30:00Z',
        role: 'member',
    },
    {
        id: 'team-3',
        name: 'Design Sprint',
        memberCount: 3,
        meetingCount: 6,
        lastMeeting: '2026-01-07T09:00:00Z',
        role: 'member',
    },
];

/**
 * TeamsList - Shows all teams the user belongs to
 */
const TeamsList = () => {
    const navigate = useNavigate();

    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');

    // Fetch teams on mount
    useEffect(() => {
        const fetchTeams = async () => {
            setIsLoading(true);
            try {
                // TODO: Replace with actual API call
                // const response = await fetch(`/api/teams?userId=${localStorage.getItem('userId')}`);
                // const data = await response.json();

                // Using mock data for demo
                await new Promise(resolve => setTimeout(resolve, 500));
                setTeams(MOCK_TEAMS);
            } catch (err) {
                console.error('Error fetching teams:', err);
                setTeams(MOCK_TEAMS);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeams();
    }, []);

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (!newTeamName.trim()) return;

        // Demo: Add team locally
        const newTeam = {
            id: `team-${Date.now()}`,
            name: newTeamName.trim(),
            memberCount: 1,
            meetingCount: 0,
            lastMeeting: null,
            role: 'owner',
        };

        setTeams(prev => [newTeam, ...prev]);
        setNewTeamName('');
        setShowCreateModal(false);
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
