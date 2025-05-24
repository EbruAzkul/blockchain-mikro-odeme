// frontend/src/redux/slices/subscriptionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/subscriptions';

const initialState = {
    plans: {},
    subscriptions: [],
    currentSubscription: null,
    loading: false,
    error: null,
    success: false,
    createLoading: false,
    createError: null,
    createSuccess: false,
};

// Abonelik planlarını getir
export const getSubscriptionPlans = createAsyncThunk(
    'subscriptions/getPlans',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(`${API_URL}/plans`);
            return data.plans;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || error.message
            );
        }
    }
);

// Kullanıcının aboneliklerini getir
export const getMySubscriptions = createAsyncThunk(
    'subscriptions/getMy',
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

            const { data } = await axios.get(`${API_URL}/my-subscriptions`, config);
            return data.subscriptions;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || error.message
            );
        }
    }
);

// Yeni abonelik oluştur
export const createSubscription = createAsyncThunk(
    'subscriptions/create',
    async (subscriptionData, { getState, rejectWithValue }) => {
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
                `${API_URL}/create`,
                subscriptionData,
                config
            );

            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || error.message
            );
        }
    }
);

// Abonelik detayını getir
export const getSubscriptionById = createAsyncThunk(
    'subscriptions/getById',
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

            const { data } = await axios.get(`${API_URL}/${id}`, config);
            return data.subscription;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || error.message
            );
        }
    }
);

// Abonelik yenileme
export const renewSubscription = createAsyncThunk(
    'subscriptions/renew',
    async ({ id, duration, privateKey }, { getState, rejectWithValue }) => {
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
                `${API_URL}/${id}/renew`,
                { duration, privateKey },
                config
            );

            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || error.message
            );
        }
    }
);

// Abonelik iptali
export const cancelSubscription = createAsyncThunk(
    'subscriptions/cancel',
    async ({ id, reason }, { getState, rejectWithValue }) => {
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
                `${API_URL}/${id}/cancel`,
                { reason },
                config
            );

            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || error.message
            );
        }
    }
);

// Otomatik yenileme değiştir
export const toggleAutoRenew = createAsyncThunk(
    'subscriptions/toggleAutoRenew',
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

            const { data } = await axios.patch(
                `${API_URL}/${id}/auto-renew`,
                {},
                config
            );

            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || error.message
            );
        }
    }
);

const subscriptionSlice = createSlice({
    name: 'subscriptions',
    initialState,
    reducers: {
        resetSubscriptionState: () => initialState,
        clearCurrentSubscription: (state) => {
            state.currentSubscription = null;
        },
        resetCreateSuccess: (state) => {
            state.createSuccess = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // Get Plans
            .addCase(getSubscriptionPlans.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getSubscriptionPlans.fulfilled, (state, action) => {
                state.loading = false;
                state.plans = action.payload;
            })
            .addCase(getSubscriptionPlans.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Get My Subscriptions
            .addCase(getMySubscriptions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getMySubscriptions.fulfilled, (state, action) => {
                state.loading = false;
                state.subscriptions = action.payload;
            })
            .addCase(getMySubscriptions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create Subscription
            .addCase(createSubscription.pending, (state) => {
                state.createLoading = true;
                state.createError = null;
            })
            .addCase(createSubscription.fulfilled, (state, action) => {
                state.createLoading = false;
                state.createSuccess = true;
                state.subscriptions.push(action.payload.subscription);
            })
            .addCase(createSubscription.rejected, (state, action) => {
                state.createLoading = false;
                state.createError = action.payload;
            })
            // Get Subscription By Id
            .addCase(getSubscriptionById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getSubscriptionById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentSubscription = action.payload;
            })
            .addCase(getSubscriptionById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Renew Subscription
            .addCase(renewSubscription.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(renewSubscription.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                // Abonelik listesini güncelle
                const index = state.subscriptions.findIndex(
                    sub => sub._id === action.payload.subscription._id
                );
                if (index !== -1) {
                    state.subscriptions[index] = action.payload.subscription;
                }
            })
            .addCase(renewSubscription.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Cancel Subscription
            .addCase(cancelSubscription.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(cancelSubscription.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                // Abonelik listesini güncelle
                const index = state.subscriptions.findIndex(
                    sub => sub._id === action.payload.subscription._id
                );
                if (index !== -1) {
                    state.subscriptions[index] = action.payload.subscription;
                }
            })
            .addCase(cancelSubscription.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Toggle Auto Renew
            .addCase(toggleAutoRenew.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(toggleAutoRenew.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                // Abonelik listesini güncelle
                const index = state.subscriptions.findIndex(
                    sub => sub._id === action.meta.arg
                );
                if (index !== -1) {
                    state.subscriptions[index].autoRenew = action.payload.autoRenew;
                }
            })
            .addCase(toggleAutoRenew.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const {
    resetSubscriptionState,
    clearCurrentSubscription,
    resetCreateSuccess
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;