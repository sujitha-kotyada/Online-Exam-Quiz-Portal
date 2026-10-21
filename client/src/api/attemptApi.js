import api from './axios';

export const attemptApi = {
  startExam: async (examId) => {
    const res = await api.post(`/exams/${examId}/start`);
    return res.data;
  },
  getAttempt: async (attemptId) => {
    const res = await api.get(`/attempts/${attemptId}`);
    return res.data;
  },
  saveAnswers: async (attemptId, answers) => {
    const res = await api.put(`/attempts/${attemptId}/answers`, { answers });
    return res.data;
  },
  submitAttempt: async (attemptId) => {
    const res = await api.post(`/attempts/${attemptId}/submit`);
    return res.data;
  }
};
