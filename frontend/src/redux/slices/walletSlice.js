// frontend/src/redux/slices/walletSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/wallet';

const initialState = {
  balance: '0',
  pendingAmount: '0', // Bekleyen işlemlerden oluşan bakiye
  loading: false,
  error: null,
  success: false,
  addFundsLoading: false,
  addFundsError: null,
  addFundsSuccess: false,
};

// Cüzdan bakiyesini getir - Sadece tamamlanmış işlemleri dahil et
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
      
      // Sadece tamamlanmış işlemleri dahil et (onlyCompleted=true)
      const { data } = await axios.get(`${API_URL}/balance?onlyCompleted=true`, config);
      console.log('Bakiye yanıtı:', data);
      
      // Eğer dönen veri beklenen kullanıcıya ait değilse hata fırlat
      if (data && data.userId && data.userId !== userInfo._id) {
        console.error('Veri tutarsızlığı: Bakiye bilgisi farklı kullanıcıya ait');
        return rejectWithValue('Veri tutarsızlığı tespit edildi');
      }
      
      return {
        balance: data.balance,
        pendingAmount: data.pendingAmount || 0
      };
    } catch (error) {
      console.error('Bakiye alma hatası:', error.response || error.message);
      
      // Token hatası kontrolü
      if (error.response && error.response.status === 401) {
        console.log('401 Yetkilendirme hatası tespit edildi');
        // İlgili import yapıldığında aktif et
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
        // İlgili import yapıldığında aktif et
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
  initialState,
  reducers: {
    clearWalletError: (state) => {
      state.error = null;
      state.addFundsError = null;
    },
    resetAddFundsSuccess: (state) => {
      state.addFundsSuccess = false;
    },
    resetWalletState: () => initialState,
    updateBalanceFromCompletedTransactions: (state, action) => {
      // Manuel olarak bakiyeyi güncelleme - sadece tamamlanmış işlemler
      if (action.payload && action.payload.completedAmount) {
        state.balance = action.payload.completedAmount;
      }
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
        state.balance = action.payload.balance;
        state.pendingAmount = action.payload.pendingAmount;
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
        
        // SADECE TAMAMLANMIŞ işlemleri bakiyeye yansıt
        if (action.payload && action.payload.transaction && action.payload.transaction.status === 'COMPLETED') {
          state.balance = (parseFloat(state.balance) + parseFloat(action.payload.transaction.amount)).toString();
        } else {
          // İşlem beklemede, pendingAmount güncelle
          if (action.payload && action.payload.transaction) {
            state.pendingAmount = (parseFloat(state.pendingAmount) + parseFloat(action.payload.transaction.amount)).toString();
          }
          console.log('İşlem beklemede, bakiye güncellenmedi');
        }
        
        state.addFundsSuccess = true;
      })
      .addCase(addFunds.rejected, (state, action) => {
        state.addFundsLoading = false;
        state.addFundsError = action.payload;
      });
  },
});

export const { 
  clearWalletError, 
  resetAddFundsSuccess, 
  resetWalletState, 
  updateBalanceFromCompletedTransactions 
} = walletSlice.actions;

export default walletSlice.reducer;