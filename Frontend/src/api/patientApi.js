import axiosClient from './axiosClient';

/**
 * Fetch all patients, with optional search query
 * @param {string} [search=''] - Search term for name or phone
 * @returns {Promise<any>}
 */
export async function getPatients(search = '') {
  const params = search ? { search } : {};
  const response = await axiosClient.get('/patients', { params });
  return response.data;
}

/**
 * Register a new patient
 * @param {{ name: string, gender: string, age: number, phone: string }} patientData
 * @returns {Promise<any>}
 */
export async function createPatient(patientData) {
  const response = await axiosClient.post('/patients', patientData);
  return response.data;
}

/**
 * Get patient details by ID
 * @param {string} id
 * @returns {Promise<any>}
 */
export async function getPatientById(id) {
  const response = await axiosClient.get(`/patients/${id}`);
  return response.data;
}

/**
 * Get consultation history for a patient
 * @param {string} patientId
 * @returns {Promise<any>}
 */
export async function getPatientConsultations(patientId) {
  const response = await axiosClient.get(`/patients/${patientId}/consultations`);
  return response.data;
}
