import axiosClient from './axiosClient';

/**
 * Fetch appointments with optional query params (e.g. status)
 * @param {Record<string, any>} [params]
 * @returns {Promise<any>}
 */
export async function getAppointments(params = {}) {
  const response = await axiosClient.get('/appointments', { params });
  return response.data;
}

/**
 * Fetch appointments scheduled for today
 * @returns {Promise<any>}
 */
export async function getTodayAppointments() {
  const response = await axiosClient.get('/appointments/today');
  return response.data;
}

/**
 * Book a new appointment
 * @param {{ patient: string, doctor: string, appointmentDateTime: string }} appointmentData
 * @returns {Promise<any>}
 */
export async function createAppointment(appointmentData) {
  const response = await axiosClient.post('/appointments', appointmentData);
  return response.data;
}
