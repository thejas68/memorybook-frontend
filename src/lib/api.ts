const API_URL = 'http://localhost:5000/api';

const getToken = (): string | null => localStorage.getItem('token');

const request = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};

export const authApi = {
  register: (email: string, password: string, displayName: string) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    }),

  login: (email: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request('/auth/me'),
  forgotPassword: (email: string) =>
  request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),

resetPassword: (token: string, password: string) =>
  request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  }),
};

export const booksApi = {
  getAll: () => request('/books'),

  getOne: (bookId: string) => request(`/books/${bookId}`),

  create: (title: string, description?: string, theme?: string) =>
    request('/books', {
      method: 'POST',
      body: JSON.stringify({ title, description, theme }),
    }),

  update: (bookId: string, data: object) =>
    request(`/books/${bookId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (bookId: string) =>
    request(`/books/${bookId}`, { method: 'DELETE' }),

  inviteMember: (bookId: string, email: string, role: string) =>
    request(`/books/${bookId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),
};

export const pagesApi = {
  getAll: (bookId: string) => request(`/books/${bookId}/pages`),

  create: (bookId: string, title?: string, content?: object) =>
    request(`/books/${bookId}/pages`, {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    }),

  update: (bookId: string, pageId: string, data: object) =>
    request(`/books/${bookId}/pages/${pageId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (bookId: string, pageId: string) =>
    request(`/books/${bookId}/pages/${pageId}`, { method: 'DELETE' }),
};

export const reactionsApi = {
  add: (pageId: string, emoji: string) =>
    request('/reactions', {
      method: 'POST',
      body: JSON.stringify({ pageId, emoji }),
    }),

  remove: (reactionId: string) =>
    request(`/reactions/${reactionId}`, { method: 'DELETE' }),
};

export const uploadApi = {
  single: async (file: File): Promise<{ url: string; publicId: string }> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/uploads/single`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
};