import api from './axios';

export const examApi = {
  getExams: async () => {
    const res = await api.get('/exams');
    return res.data;
  },
  getExamById: async (examId) => {
    const res = await api.get(`/exams/${examId}`);
    return res.data;
  },
  createExam: async (examData) => {
    const res = await api.post('/exams', examData);
    return res.data;
  },
  updateExam: async (examId, examData) => {
    const res = await api.put(`/exams/${examId}`, examData);
    return res.data;
  },
  deleteExam: async (examId) => {
    const res = await api.delete(`/exams/${examId}`);
    return res.data;
  },
  togglePublish: async (examId) => {
    const res = await api.patch(`/exams/${examId}/publish`);
    return res.data;
  },
  getQuestions: async (examId) => {
    const res = await api.get(`/exams/${examId}/questions`);
    return res.data;
  },
  createQuestion: async (examId, questionData) => {
    const res = await api.post(`/exams/${examId}/questions`, questionData);
    return res.data;
  },
  updateQuestion: async (examId, questionId, questionData) => {
    const res = await api.put(`/exams/${examId}/questions/${questionId}`, questionData);
    return res.data;
  },
  deleteQuestion: async (examId, questionId) => {
    const res = await api.delete(`/exams/${examId}/questions/${questionId}`);
    return res.data;
  }
};
