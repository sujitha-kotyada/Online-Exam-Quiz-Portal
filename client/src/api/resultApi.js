import api from './axios';

export const resultApi = {
  getMyResults: async () => {
    const res = await api.get('/results/my');
    return res.data;
  },
  getResultById: async (resultId) => {
    const res = await api.get(`/results/${resultId}`);
    return res.data;
  },
  getExamResultsAndAnalytics: async (examId) => {
    const res = await api.get(`/exams/${examId}/results`);
    return res.data;
  },
  gradeSubjectiveAnswer: async (resultId, questionId, gradingData) => {
    const res = await api.patch(`/results/${resultId}/breakdown/${questionId}`, gradingData);
    return res.data;
  }
};
