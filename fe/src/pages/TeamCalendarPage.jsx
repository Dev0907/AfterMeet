import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { meetingsApi, tasksApi, teamsApi } from '../services/api';
import CalendarView from '../components/CalendarView';
import NeoButton from '../components/ui/NeoButton';
import { ArrowLeft, Loader } from 'lucide-react';

const TeamCalendarPage = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const [meetings, setMeetings] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        loadData();
    }, [teamId, userId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [meetingsRes, tasksRes] = await Promise.all([
                meetingsApi.getByTeam(teamId),
                tasksApi.getTeamTasks(teamId, userId)
            ]);
            setMeetings(meetingsRes.data);
            setTasks(tasksRes.data);
        } catch (error) {
            console.error("Error loading calendar data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEventClick = (event) => {
        if (event.type === 'meeting') {
            navigate(`/meetings/${event.id}`);
        } else {
            // For tasks, meaningful navigation can be to the Kanban board
            navigate(`/teams/${teamId}/kanban/team`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neo-white">
                <div className="animate-spin">
                    <Loader size={48} className="text-black" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neo-white p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <NeoButton
                            variant="secondary"
                            onClick={() => navigate(`/teams/${teamId}/meetings`)}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </NeoButton>
                        <h1 className="text-4xl font-black uppercase tracking-tight">Team Calendar</h1>
                    </div>
                </div>

                <CalendarView
                    meetings={meetings}
                    tasks={tasks}
                    onEventClick={handleEventClick}
                />
            </div>
        </div>
    );
};

export default TeamCalendarPage;
