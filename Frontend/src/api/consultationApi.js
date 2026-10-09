import axiosClient from './axiosClient';

/**
 * Save consultation draft
 * @param {{ appointment: string, vitals: { temperature: number, pulse: number }, notes: string }} consultationData
 * @returns {Promise<any>}
 */
export async function createConsultation(consultationData) {
  const response = await axiosClient.post('/consultations', consultationData);
  return response.data;
}

/**
 * Mark consultation as completed
 * @param {string} id
 * @returns {Promise<any>}
 */
export async function completeConsultation(id) {
  const response = await axiosClient.patch(`/consultations/${id}/complete`);
  return response.data;
}
