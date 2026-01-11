import axios from 'axios';

const API_BASE = 'http://localhost:3000';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 90000,
});

api.interceptors.request.use(
    (config) => {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || config.params || '');
        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`, response.data);
        return response;
    },
    (error) => {
        const status = error.response?.status || 'Network Error';
        const url = error.config?.url || 'Unknown URL';
        console.error(`[API Error] ${url} - Status: ${status}`, error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export const authApi = {
    signup: (data) => api.post('/api/auth/signup', data),
    signin: (data) => api.post('/api/auth/signin', data),
    verifyOtp: (data) => api.post('/api/auth/verify-otp', data),
    resendOtp: (data) => api.post('/api/auth/resend-otp', data),
};

export const teamsApi = {
    getAll: (userId) => api.get('/api/teams', { params: { userId } }),
    create: (data) => api.post('/api/teams', data),
    update: (teamId, data) => api.put(`/api/teams/${teamId}`, data),
    delete: (teamId, userId) => api.delete(`/api/teams/${teamId}`, { params: { userId } }),
    join: (data) => api.post('/api/teams/join', data),
    getInvite: (teamId, userId) => api.get(`/api/teams/${teamId}/invite`, { params: { userId } }),
    regenerateInvite: (teamId, data) => api.post(`/api/teams/${teamId}/invite/regenerate`, data),
    getRole: (teamId, userId) => api.get(`/api/teams/${teamId}/role`, { params: { userId } }),
    getMembers: (teamId) => api.get(`/api/teams/${teamId}/members`),
    removeMember: (teamId, memberId, userId) => api.delete(`/api/teams/${teamId}/members/${memberId}`, { params: { userId } }),
};


export const meetingsApi = {
    getByTeam: (teamId) => api.get(`/api/teams/${teamId}/meetings`),
    create: (teamId, data) => api.post(`/api/teams/${teamId}/meetings`, data),
    getById: (meetingId) => api.get(`/api/meetings/${meetingId}`),
    update: (meetingId, data) => api.put(`/api/meetings/${meetingId}`, data),
    delete: (meetingId, userId) => api.delete(`/api/meetings/${meetingId}`, { params: { userId } }),
    uploadTranscript: (meetingId, data) => api.post(`/api/meetings/${meetingId}/transcript`, data),
};

export const aiApi = {
    analyze: (data) => api.post('/api/analyze', data),
    chat: (meetingId, data) => api.post(`/api/meetings/${meetingId}/chat`, data),
    search: (meetingId, data) => api.post(`/api/meetings/${meetingId}/search`, data),
    scheduleJoin: (data) => api.post('/api/schedule-join', data),
};

export const tasksApi = {
    getUserTasks: (userId) => api.get('/api/tasks', { params: { userId } }),
    getMemberTasks: (teamId, memberId, userId) => api.get(`/api/teams/${teamId}/members/${memberId}/tasks`, { params: { userId } }),
    getTeamTasks: (teamId, userId) => api.get(`/api/teams/${teamId}/tasks`, { params: { userId } }),
    create: (data) => api.post('/api/tasks', data),
    update: (taskId, data, userId) => api.put(`/api/tasks/${taskId}`, data, { params: { userId } }),
    delete: (taskId, userId) => api.delete(`/api/tasks/${taskId}`, { params: { userId } }),
};

export default api;
