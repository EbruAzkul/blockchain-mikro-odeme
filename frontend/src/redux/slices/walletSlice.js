// frontend/src/redux/slices/walletSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/wallet';

// Cüzdan bakiyesini getir
export const getWalletBalance = createAsyncThunk(
  'wallet/getBalance',
  async (_, { getState, rejectWithValue, dispatch }) => {
    try {
      const {
        auth: { userInfo },
      } = getState();

      console.log('Auth State:', userInfo);
      
      if (!userInfo || !userInfo.token) {
        console.error('Token bulunamadı:', userInfo);
        return rejectWithValue('Token bulunamadı, lütfen tekrar giriş yapın');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      console.log('Bakiye isteği gönderiliyor, token:', userInfo.token);
      const { data } = await axios.get(`${API_URL}/balance`, config);
      console.log('Bakiye yanıtı:', data);
      
      return data.balance;
    } catch (error) {
      console.error('Bakiye alma hatası:', error.response || error.message);
      
      // Token hatası kontrolü
      if (error.response && error.response.status === 401) {
        console.log('401 Yetkilendirme hatası tespit edildi');
        // Token hatası varsa auth hata yakalayıcıyı çağır
        // Not: Bu kısmı kullanmak için, authSlice.js'den handleAuthError'u import etmelisiniz
        // dispatch(handleAuthError());
      }
      
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Bakiye yükleme
export const addFunds = createAsyncThunk(
  'wallet/addFunds',
  async ({ amount, privateKey }, { getState, rejectWithValue, dispatch }) => {
    try {
      const {
        auth: { userInfo },
      } = getState();

      if (!userInfo || !userInfo.token) {
        console.error('Token bulunamadı:', userInfo);
        return rejectWithValue('Token bulunamadı, lütfen tekrar giriş yapın');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      console.log('Bakiye yükleme isteği gönderiliyor:', { amount });
      const { data } = await axios.post(
        `${API_URL}/add-funds`,
        { amount, privateKey },
        config
      );
      
      console.log('Bakiye yükleme yanıtı:', data);
      
      return data;
    } catch (error) {
      console.error('Bakiye yükleme hatası:', error.response || error.message);
      
      // Token hatası kontrolü
      if (error.response && error.response.status === 401) {
        console.log('401 Yetkilendirme hatası tespit edildi');
        // Token hatası varsa auth hata yakalayıcıyı çağır
        // dispatch(handleAuthError());
      }
      
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Wallet slice
export const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    balance: '0',
    loading: false,
    error: null,
    success: false,
    addFundsLoading: false,
    addFundsError: null,
    addFundsSuccess: false,
  },
  reducers: {
    clearWalletError: (state) => {
      state.error = null;
      state.addFundsError = null;
    },
    resetAddFundsSuccess: (state) => {
      state.addFundsSuccess = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getWalletBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWalletBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload;
        state.success = true;
      })
      .addCase(getWalletBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Bakiye yükleme
      .addCase(addFunds.pending, (state) => {
        state.addFundsLoading = true;
        state.addFundsError = null;
      })
      .addCase(addFunds.fulfilled, (state, action) => {
        state.addFundsLoading = false;
        // Sadece işlem başarılıysa bakiyeyi güncelle
        if (action.payload && action.payload.transaction) {
          state.balance = (parseFloat(state.balance) + parseFloat(action.payload.transaction.amount)).toString();
        }
        state.addFundsSuccess = true;
      })
      .addCase(addFunds.rejected, (state, action) => {
        state.addFundsLoading = false;
        state.addFundsError = action.payload;
      });
  },
});

export const { clearWalletError, resetAddFundsSuccess } = walletSlice.actions;
export default walletSlice.reducer;