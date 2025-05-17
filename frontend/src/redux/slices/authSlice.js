// frontend/src/redux/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Kullanıcının token'ını localStorage'dan al
const userInfoFromStorage = localStorage.getItem('userInfo')
  ? JSON.parse(localStorage.getItem('userInfo'))
  : null;

const initialState = {
  userInfo: userInfoFromStorage,
  isLoading: false,
  isSuccess: false,
  isError: false,
  errorMessage: '',
};

// Kayıt ol
export const register = createAsyncThunk(
  'auth/register',
  async ({ username, email, password }, { rejectWithValue }) => {
    try {
      console.log('Register isteği gönderiliyor:', { email, username });
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const { data } = await axios.post(
        'http://localhost:5000/api/users/register',
        { username, email, password },
        config
      );

      console.log('Register yanıtı:', data);
      
      if (!data.token) {
        console.error('Token alınamadı:', data);
        return rejectWithValue('Token alınamadı, lütfen tekrar kayıt olmayı deneyin');
      }

      localStorage.setItem('userInfo', JSON.stringify(data));

      return data;
    } catch (error) {
      console.error('Register hatası:', error.response || error.message);
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Giriş yap
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      console.log('Login isteği gönderiliyor:', { email });
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const { data } = await axios.post(
        'http://localhost:5000/api/users/login',
        { email, password },
        config
      );

      console.log('Login yanıtı:', data);
      
      if (!data.token) {
        console.error('Token alınamadı:', data);
        return rejectWithValue('Token alınamadı, lütfen tekrar giriş yapın');
      }

      // Token formatını kontrol et
      console.log('Token alındı:', data.token);
      
      localStorage.setItem('userInfo', JSON.stringify(data));

      return data;
    } catch (error) {
      console.error('Login hatası:', error.response || error.message);
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Kullanıcı profilini güncelle
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (formData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();

      // Token kontrolü
      if (!auth.userInfo || !auth.userInfo.token) {
        console.error('Token bulunamadı:', auth.userInfo);
        return rejectWithValue('Token bulunamadı, lütfen tekrar giriş yapın');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.userInfo.token}`,
        },
      };

      console.log('Profil güncelleme isteği gönderiliyor:', formData);
      const { data } = await axios.put(
        'http://localhost:5000/api/users/profile',
        formData,
        config
      );

      console.log('Profil güncelleme yanıtı:', data);

      // localStorage'i güncelle ama token'ı koru
      const updatedUserInfo = {
        ...data,
        token: auth.userInfo.token,
      };
      
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));

      return updatedUserInfo;
    } catch (error) {
      console.error('Profil güncelleme hatası:', error.response || error.message);
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Token hatası durumunda çağrılacak fonksiyon
export const handleAuthError = createAsyncThunk(
  'auth/handleAuthError',
  async (_, { dispatch }) => {
    console.log('Auth hatası tespit edildi, oturum kapatılıyor...');
    // Token geçersiz, kullanıcıyı çıkış yaptır
    await dispatch(logout());
    return null;
  }
);

// Çıkış yap
export const logout = createAsyncThunk('auth/logout', async () => {
  console.log('Logout işlemi başlatıldı');
  localStorage.removeItem('userInfo');
  console.log('LocalStorage temizlendi');
  return null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    resetAuthState: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.errorMessage = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.userInfo = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.userInfo = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.userInfo = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.userInfo = null;
      });
  },
});

export const { resetAuthState } = authSlice.actions;
export default authSlice.reducer;