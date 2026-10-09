import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser, registerUser, getCurrentUser } from '../../api/authApi';

// Initial state reading token/user from localStorage if available
const storedToken = localStorage.getItem('clinicflow_token') || null;
let storedUser = null;
try {
  const userJson = localStorage.getItem('clinicflow_user');
  if (userJson) storedUser = JSON.parse(userJson);
} catch {
  storedUser = null;
}

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCurrentUser();
      return response.data; // { user }
    } catch (error) {
      localStorage.removeItem('clinicflow_token');
      localStorage.removeItem('clinicflow_user');
      return rejectWithValue(error.response?.data?.message || 'Session expired');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await loginUser(credentials);
      return response; // { success, message, data: { user, token } }
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await registerUser(credentials);
      return response; // { success, message, data: { user, token } }
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser,
    token: storedToken,
    loading: !!storedToken, // if token exists, loading until validated
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('clinicflow_token');
      localStorage.removeItem('clinicflow_user');
    },
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.loading = false;
      state.error = null;
      if (token) localStorage.setItem('clinicflow_token', token);
      if (user) localStorage.setItem('clinicflow_user', JSON.stringify(user));
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // fetchCurrentUser
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user || action.payload;
        localStorage.setItem('clinicflow_user', JSON.stringify(state.user));
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      });

    // login
    builder
      .addCase(login.fulfilled, (state, action) => {
        const payloadData = action.payload.data;
        state.user = payloadData.user;
        state.token = payloadData.token;
        state.loading = false;
        state.error = null;
        localStorage.setItem('clinicflow_token', payloadData.token);
        localStorage.setItem('clinicflow_user', JSON.stringify(payloadData.user));
      });

    // register
    builder
      .addCase(register.fulfilled, (state, action) => {
        const payloadData = action.payload.data;
        state.user = payloadData.user;
        state.token = payloadData.token;
        state.loading = false;
        state.error = null;
        localStorage.setItem('clinicflow_token', payloadData.token);
        localStorage.setItem('clinicflow_user', JSON.stringify(payloadData.user));
      });
  },
});

export const { logout, setCredentials, setLoading } = authSlice.actions;
export default authSlice.reducer;
