// frontend/src/redux/slices/transactionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  transactions: [],
  transaction: null,
  loading: false,
  error: null,
  processLoading: false,
  processError: null,
  processSuccess: false,
  createLoading: false,
  createError: null,
  createSuccess: false,
  isLoading: false,
  isSuccess: false,
  isError: false,
  errorMessage: '',
};

// Tüm işlemleri getir
export const getAllTransactions = createAsyncThunk(
  'transactions/getAll',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();

      if (!auth.userInfo || !auth.userInfo.token) {
        return rejectWithValue('Kullanıcı oturumu geçersiz');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${auth.userInfo.token}`,
        },
      };

      const { data } = await axios.get(
        'http://localhost:5000/api/transactions/all',
        config
      );

      // Veri güvenlik kontrolü - backend'den dönen verilerin geçerli olduğundan emin ol
      if (!Array.isArray(data)) {
        console.error('Geçersiz işlem verisi alındı:', data);
        return rejectWithValue('İşlem verileri geçersiz format');
      }

      // Şu anki kullanıcıya ait işlemleri filtrele
      const userWalletAddress = auth.userInfo.walletAddress;
      const filteredTransactions = data.filter(tx => 
        tx.from === userWalletAddress || tx.to === userWalletAddress
      );

      return filteredTransactions;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Kullanıcının işlemlerini getir - DashboardScreen için
export const getTransactions = createAsyncThunk(
  'transactions/get',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();

      if (!auth.userInfo || !auth.userInfo.token) {
        return rejectWithValue('Kullanıcı oturumu geçersiz');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${auth.userInfo.token}`,
        },
      };

      const { data } = await axios.get(
        'http://localhost:5000/api/transactions/my',
        config
      );

      // Veri güvenlik kontrolü
      if (!Array.isArray(data)) {
        console.error('Geçersiz işlem verisi alındı:', data);
        return rejectWithValue('İşlem verileri geçersiz format');
      }

      // Şu anki kullanıcıya ait işlemleri filtrele (ekstra güvenlik)
      const userWalletAddress = auth.userInfo.walletAddress;
      const filteredTransactions = data.filter(tx => 
        tx.from === userWalletAddress || tx.to === userWalletAddress
      );

      return filteredTransactions;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// İşlem detayını getir
export const getTransactionById = createAsyncThunk(
  'transactions/getById',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();

      if (!auth.userInfo || !auth.userInfo.token) {
        return rejectWithValue('Kullanıcı oturumu geçersiz');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${auth.userInfo.token}`,
        },
      };

      const { data } = await axios.get(
        `http://localhost:5000/api/transactions/${id}`,
        config
      );

      // Veri güvenlik kontrolü - bu işlem gerçekten kullanıcıya ait mi?
      const userWalletAddress = auth.userInfo.walletAddress;
      if (data.from !== userWalletAddress && data.to !== userWalletAddress) {
        console.error('Yetkilendirme hatası: İşlem bu kullanıcıya ait değil');
        return rejectWithValue('Bu işlemi görüntüleme yetkiniz yok');
      }

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Yeni işlem oluştur
export const createTransaction = createAsyncThunk(
  'transactions/create',
  async (transactionData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();

      if (!auth.userInfo || !auth.userInfo.token) {
        return rejectWithValue('Kullanıcı oturumu geçersiz');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.userInfo.token}`,
        },
      };

      const { data } = await axios.post(
        'http://localhost:5000/api/transactions/create',
        transactionData,
        config
      );

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// İşlem işleme
export const processTransaction = createAsyncThunk(
  'transactions/process',
  async ({transactionId, privateKey}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();

      if (!auth.userInfo || !auth.userInfo.token) {
        return rejectWithValue('Kullanıcı oturumu geçersiz');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.userInfo.token}`,
        },
      };

      const { data } = await axios.post(
        `http://localhost:5000/api/transactions/${transactionId}/process`,
        { privateKey },
        config
      );

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    resetTransactionState: () => initialState,
    clearTransaction: (state) => {
      state.transaction = null;
    },
    resetCreateSuccess: (state) => {
      state.createSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All Transactions
      .addCase(getAllTransactions.pending, (state) => {
        state.loading = true;
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoading = false;
        state.isSuccess = true;
        state.transactions = action.payload;
      })
      .addCase(getAllTransactions.rejected, (state, action) => {
        state.loading = false;
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload;
        state.errorMessage = action.payload;
      })
      // Get My Transactions (getTransactions)
      .addCase(getTransactions.pending, (state) => {
        state.loading = true;
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoading = false;
        state.isSuccess = true;
        state.transactions = action.payload;
      })
      .addCase(getTransactions.rejected, (state, action) => {
        state.loading = false;
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload;
        state.errorMessage = action.payload;
      })
      // Get Transaction By Id
      .addCase(getTransactionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTransactionById.fulfilled, (state, action) => {
        state.loading = false;
        state.isSuccess = true;
        state.transaction = action.payload;
      })
      .addCase(getTransactionById.rejected, (state, action) => {
        state.loading = false;
        state.isError = true;
        state.error = action.payload;
        state.errorMessage = action.payload;
      })
      // Create Transaction
      .addCase(createTransaction.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.createLoading = false;
        state.createSuccess = true;
        state.transactions = state.transactions
          ? [action.payload.transaction, ...state.transactions]
          : [action.payload.transaction];
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
      })
      // Process Transaction
      .addCase(processTransaction.pending, (state) => {
        state.processLoading = true;
        state.processError = null;
      })
      .addCase(processTransaction.fulfilled, (state, action) => {
        state.processLoading = false;
        state.processSuccess = true;
        // Güncellenen işlemi transactions listesinde güncelle
        if (state.transactions.length > 0) {
          state.transactions = state.transactions.map(tx => 
            tx._id === action.payload.transaction._id 
              ? action.payload.transaction 
              : tx
          );
        }
      })
      .addCase(processTransaction.rejected, (state, action) => {
        state.processLoading = false;
        state.processError = action.payload;
      });
  },
});

export const { resetTransactionState, clearTransaction, resetCreateSuccess } = transactionSlice.actions;
export default transactionSlice.reducer;