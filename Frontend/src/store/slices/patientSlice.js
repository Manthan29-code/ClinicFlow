import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getPatients, createPatient } from '../../api/patientApi';

export const fetchPatientsList = createAsyncThunk(
  'patients/fetchPatientsList',
  async (search = '', { rejectWithValue }) => {
    try {
      const response = await getPatients(search);
      return response; // { success, count, data: [...] }
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const registerNewPatient = createAsyncThunk(
  'patients/registerNewPatient',
  async (patientData, { rejectWithValue }) => {
    try {
      const response = await createPatient(patientData);
      return response; // { success, message, data: { ... } }
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const patientSlice = createSlice({
  name: 'patients',
  initialState: {
    list: [],
    count: 0,
    loading: false,
    submitting: false,
    error: null,
    searchQuery: '',
  },
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    clearPatientError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchPatientsList
    builder
      .addCase(fetchPatientsList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatientsList.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
        state.count = action.payload.count || action.payload.data?.length || 0;
      })
      .addCase(fetchPatientsList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // registerNewPatient
    builder
      .addCase(registerNewPatient.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(registerNewPatient.fulfilled, (state, action) => {
        state.submitting = false;
        if (action.payload?.data) {
          state.list.unshift(action.payload.data);
          state.count += 1;
        }
      })
      .addCase(registerNewPatient.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });
  },
});

export const { setSearchQuery, clearPatientError } = patientSlice.actions;
export default patientSlice.reducer;
