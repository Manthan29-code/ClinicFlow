import axiosClient from './axiosClient';

/**
 * Fetch list of all doctors
 * @returns {Promise<any>}
 */
export async function getDoctors() {
  const response = await axiosClient.get('/doctors');
  return response.data;
}

/**
 * Create a new doctor
 * @param {{ name: string, category: string }} doctorData
 * @returns {Promise<any>}
 */
export async function createDoctor(doctorData) {
  const response = await axiosClient.post('/doctors', doctorData);
  return response.data;
}
