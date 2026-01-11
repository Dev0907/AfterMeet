import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { tasksApi, teamsApi } from '../services/api';
import NeoCard from '../components/ui/NeoCard';
import NeoButton from '../components/ui/NeoButton';
import NeoInput from '../components/ui/NeoInput';
import { Users, ArrowLeft, Calendar, User } from 'lucide-react';

const KanbanBoard = () => {
  const { teamId, memberId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: ''
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [isTeamOwner, setIsTeamOwner] = useState(false);

  const userId = localStorage.getItem('userId');
  const isTeamView = location.pathname.includes('/kanban/team');
  const isViewingOwnBoard = !memberId || memberId === userId;

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId, teamId, memberId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get team members
      const membersResponse = await teamsApi.getMembers(teamId);
      console.log(membersResponse);

      setTeamMembers(membersResponse.data);

      // Check if current user is team owner
      const roleResponse = await teamsApi.getRole(teamId, userId);
      setIsTeamOwner(roleResponse.data.role === 'owner');

      // Get current user info
      const userResponse = await teamsApi.getAll(userId);
      const userTeams = userResponse.data;
      const currentTeam = userTeams.find(t => t.id === teamId);
      const currentUserInTeam = currentTeam?.members.find(m => m.userId === userId);
      setCurrentUser(currentUserInTeam?.user);

      // Get tasks based on view mode
      let tasksResponse;

      if (isTeamView && isTeamOwner) {
        // Team view: get all tasks for all team members
        const allTasks = [];
        for (const member of membersResponse.data) {
          try {
            const memberTasks = await tasksApi.getMemberTasks(teamId, member.id, userId);
            allTasks.push(...memberTasks.data);
          } catch (error) {
            console.error(`Error fetching tasks for member ${member.id}:`, error);
          }
        }
        setTasks(allTasks);
      } else if (memberId && memberId !== userId) {
        // Viewing another member's tasks
        tasksResponse = await tasksApi.getMemberTasks(teamId, memberId, userId);
        setTasks(tasksResponse.data);
      } else {
        // Viewing own tasks
        tasksResponse = await tasksApi.getUserTasks(userId);
        setTasks(tasksResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
    });
  };

  const handleUpdateTask = async () => {
    if (!editForm.title.trim()) return;

    try {
      await tasksApi.update(editingTask.id, {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null
      }, userId);
      setEditingTask(null);
      loadData();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await tasksApi.delete(taskId, userId);
      loadData();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getAssigneeName = (task) => {
    if (!isTeamView) return null;
    const assignee = teamMembers.find(member => member.id === task.assignedTo);
    return assignee ? assignee.name : 'Unknown User';
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neo-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="flex space-x-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-1 bg-gray-300 rounded h-96"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const boardOwner = memberId ? teamMembers.find(m => m.id === memberId) : currentUser;

  return (
    <div className="min-h-screen bg-neo-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <NeoButton
              variant="secondary"
              onClick={() => navigate(`/teams/${teamId}/meetings`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Meetings
            </NeoButton>
            <NeoButton
              variant="secondary"
              onClick={() => navigate(`/teams/${teamId}/calendar`)}
              className="flex items-center gap-2"
            >
              <Calendar size={16} />
              Calendar
            </NeoButton>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight">
                {isTeamView ? 'Team Kanban Board' : 'Kanban Board'}
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Users size={16} />
                {isTeamView ? `${teamMembers.length} Team Members` : (boardOwner?.name || 'Loading...')}
                {!isViewingOwnBoard && !isTeamView && (
                  <span className="text-sm bg-neo-yellow px-2 py-1 rounded">
                    Viewing as Team Owner
                  </span>
                )}
                {isTeamView && (
                  <span className="text-sm bg-neo-teal px-2 py-1 rounded">
                    Team Overview
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Team Members Navigation (for team owners) */}
          {isTeamOwner && (
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-600" />
              <div className="flex gap-2">
                <NeoButton
                  variant={isTeamView ? "primary" : "secondary"}
                  onClick={() => navigate(`/teams/${teamId}/kanban/team`)}
                  className="text-sm"
                >
                  Team View
                </NeoButton>
                {teamMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => navigate(`/teams/${teamId}/members/${member.id}/kanban`)}
                    className={`px-3 py-1 text-sm font-bold border-2 border-black transition-all ${!isTeamView && (memberId || userId) === member.id
                      ? 'bg-black text-white'
                      : 'bg-white hover:bg-neo-yellow'
                      }`}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit Task Form */}
        {isViewingOwnBoard && editingTask && (
          <div className="mb-6">
            <NeoCard className="p-4">
              <h3 className="text-lg font-bold mb-4">Edit Task</h3>
              <div className="space-y-4">
                <NeoInput
                  placeholder="Task title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
                <textarea
                  placeholder="Task description (optional)"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full p-3 border-2 border-black bg-white font-medium focus:outline-none focus:ring-2 focus:ring-neo-yellow"
                  rows={3}
                />
                <div className="flex gap-4">
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="px-3 py-2 border-2 border-black bg-white font-medium focus:outline-none focus:ring-2 focus:ring-neo-yellow"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Priority</option>
                  </select>
                  <input
                    type="date"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="px-3 py-2 border-2 border-black bg-white font-medium focus:outline-none focus:ring-2 focus:ring-neo-yellow"
                  />
                </div>
                <div className="flex gap-2">
                  {/* Task Actions - Strict Permissions */}
                  {/* Only ASSIGNEE can update their task */}
                  {task.assignedTo === userId ? (
                    <>
                      <NeoButton onClick={handleUpdateTask}>
                        Update Task
                      </NeoButton>
                      <NeoButton
                        variant="secondary"
                        onClick={() => setEditingTask(null)}
                      >
                        Cancel
                      </NeoButton>
                    </>
                  ) : (
                    /* Read-Only View for others (e.g. Host viewing someone else's task) */
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 font-bold text-sm uppercase">Read Only Mode</span>
                      <NeoButton
                        variant="secondary"
                        onClick={() => setEditingTask(null)}
                      >
                        Close
                      </NeoButton>
                    </div>
                  )}
                </div>
              </div>
            </NeoCard>
          </div>
        )}

        {/* Kanban Board - Trello Style */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* To Do Column */}
          <div className="bg-gray-100 rounded-lg p-3 min-h-[600px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
                To Do
              </h3>
              <span className="bg-gray-300 text-gray-600 text-xs px-2 py-1 rounded-full">
                {getTasksByStatus('pending').length}
              </span>
            </div>
            <div className="space-y-2">
              {getTasksByStatus('pending').map(task => (
                <div key={task.id} className="bg-white rounded shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm text-gray-900 flex-1 leading-tight">{task.title}</h4>
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getPriorityColor(task.priority)} ml-2`}>
                      {task.priority}
                    </span>
                  </div>
                  {isTeamView && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <User size={10} />
                      {getAssigneeName(task)}
                    </div>
                  )}
                  {task.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                  )}
                  {task.dueDate && (
                    <div className={`flex items-center gap-1 text-xs ${isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      <Calendar size={10} />
                      {formatDate(task.dueDate)}
                      {isOverdue(task.dueDate) && ' (Overdue)'}
                    </div>
                  )}
                  {isViewingOwnBoard && (
                    <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* PERMISSION CHECK: Only Assignee can change status */}
                      {task.assignedTo === userId ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUpdateTaskStatus(task.id, 'in_progress'); }}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            Start
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}
                            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                          >
                            Edit
                          </button>
                        </>
                      ) : (
                        // Non-assignees see no actions or read-only indicators if you prefer
                        <span className="text-xs text-gray-400 font-medium italic">Assignee only</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-blue-50 rounded-lg p-3 min-h-[600px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-blue-700 text-sm uppercase tracking-wide">
                In Progress
              </h3>
              <span className="bg-blue-200 text-blue-700 text-xs px-2 py-1 rounded-full">
                {getTasksByStatus('in_progress').length}
              </span>
            </div>
            <div className="space-y-2">
              {getTasksByStatus('in_progress').map(task => (
                <div key={task.id} className="bg-white rounded shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm text-gray-900 flex-1 leading-tight">{task.title}</h4>
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getPriorityColor(task.priority)} ml-2`}>
                      {task.priority}
                    </span>
                  </div>
                  {isTeamView && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <User size={10} />
                      {getAssigneeName(task)}
                    </div>
                  )}
                  {task.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                  )}
                  {task.dueDate && (
                    <div className={`flex items-center gap-1 text-xs ${isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      <Calendar size={10} />
                      {formatDate(task.dueDate)}
                      {isOverdue(task.dueDate) && ' (Overdue)'}
                    </div>
                  )}
                  {isViewingOwnBoard && (
                    <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'pending')}
                        className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
                      >
                        Back
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Done Column */}
          <div className="bg-green-50 rounded-lg p-3 min-h-[600px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-green-700 text-sm uppercase tracking-wide">
                Done
              </h3>
              <span className="bg-green-200 text-green-700 text-xs px-2 py-1 rounded-full">
                {getTasksByStatus('done').length}
              </span>
            </div>
            <div className="space-y-2">
              {getTasksByStatus('done').map(task => (
                <div key={task.id} className="bg-white rounded shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer group opacity-75">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm text-gray-900 flex-1 leading-tight line-through">{task.title}</h4>
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getPriorityColor(task.priority)} ml-2`}>
                      {task.priority}
                    </span>
                  </div>
                  {isTeamView && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <User size={10} />
                      {getAssigneeName(task)}
                    </div>
                  )}
                  {task.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={10} />
                      {formatDate(task.dueDate)}
                    </div>
                  )}
                  {isViewingOwnBoard && (
                    <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                        className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                      >
                        Reopen
                      </button>
                      <button
                        onClick={() => handleEditTask(task)}
                        className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Overdue Column */}
          <div className="bg-red-50 rounded-lg p-3 min-h-[600px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-red-700 text-sm uppercase tracking-wide">
                Overdue
              </h3>
              <span className="bg-red-200 text-red-700 text-xs px-2 py-1 rounded-full">
                {getTasksByStatus('pending').filter(task => isOverdue(task.dueDate)).length}
              </span>
            </div>
            <div className="space-y-2">
              {getTasksByStatus('pending').filter(task => isOverdue(task.dueDate)).map(task => (
                <div key={task.id} className="bg-white rounded shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer group border-l-4 border-l-red-500">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm text-gray-900 flex-1 leading-tight">{task.title}</h4>
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getPriorityColor(task.priority)} ml-2`}>
                      {task.priority}
                    </span>
                  </div>
                  {isTeamView && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <User size={10} />
                      {getAssigneeName(task)}
                    </div>
                  )}
                  {task.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                      <Calendar size={10} />
                      {formatDate(task.dueDate)} (Overdue)
                    </div>
                  )}
                  {isViewingOwnBoard && (
                    <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* PERMISSION CHECK: Only Assignee can change status */}
                      {task.assignedTo === userId ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUpdateTaskStatus(task.id, 'in_progress'); }}
                            className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                          >
                            Start
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditTask(task); }}
                            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium italic">Assignee only</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;