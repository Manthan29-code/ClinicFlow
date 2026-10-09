import axiosClient from './axiosClient';

/**
 * Register a new user
 * @param {{ name: string, phone: string }} credentials
 * @returns {Promise<any>}
 */
export async function registerUser(credentials) {
  const response = await axiosClient.post('/auth/register', credentials);
  return response.data;
}

/**
 * Log in an existing user
 * @param {{ name: string, phone: string }} credentials
 * @returns {Promise<any>}
 */
export async function loginUser(credentials) {
  const response = await axiosClient.post('/auth/login', credentials);
  return response.data;
}

/**
 * Fetch the currently authenticated user's profile
 * @returns {Promise<any>}
 */
export async function getCurrentUser() {
  const response = await axiosClient.get('/auth/me');
  return response.data;
}
