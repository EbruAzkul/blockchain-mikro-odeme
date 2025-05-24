// frontend/src/App.js (ApiTester ve TransactionDebugger olmadan)
import React, {useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {Container} from 'react-bootstrap';
import {useDispatch, useSelector} from 'react-redux';
import {logout} from './redux/slices/authSlice';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Screens
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProfileScreen from './screens/ProfileScreen';
import DashboardScreen from './screens/DashboardScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import FundWalletScreen from './screens/FundWalletScreen';
import NotFoundScreen from './screens/NotFoundScreen';
import SubscriptionScreen from "./screens/SubscriptionScreen";

// Yardımcı fonksiyonlar - bu dosyayı oluşturduysanız, açın; aksi takdirde yorum satırına alın
// import { validateToken } from './utils/tokenHelper';

// Korumalı Route Bileşeni
const ProtectedRoute = ({children}) => {
    const {userInfo} = useSelector((state) => state.auth);

    if (!userInfo) {
        // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
        return <Navigate to="/login" replace/>;
    }

    return children;
};

// Giriş Yapmış Kullanıcı Route Bileşeni (login ve register sayfalarına erişimi engeller)
const AuthenticatedRoute = ({children}) => {
    const {userInfo} = useSelector((state) => state.auth);

    if (userInfo) {
        // Kullanıcı zaten giriş yapmışsa dashboard'a yönlendir
        return <Navigate to="/dashboard" replace/>;
    }

    return children;
};

const App = () => {
    const dispatch = useDispatch();
    const {userInfo} = useSelector((state) => state.auth);

    // Uygulama başlatıldığında token geçerliliğini kontrol et
    useEffect(() => {
        const checkSession = () => {
            try {
                if (!userInfo || !userInfo.token) return;

                // Token geçerli mi kontrol et - validateToken fonksiyonu yoksa bu kısmı yorum satırına alın
                // if (!validateToken(userInfo.token)) {
                //   console.log('Geçersiz token tespit edildi. Çıkış yapılıyor...');
                //   dispatch(logout());
                // }
            } catch (error) {
                console.error('Oturum kontrolü sırasında hata:', error);
                dispatch(logout());
            }
        };

        checkSession();
    }, [dispatch, userInfo]);

    return (
        <Router>
            <Header/>
            <main className="py-3">
                <Container>
                    <Routes>
                        {/* Genel Sayfalar */}
                        <Route path="/" element={<HomeScreen/>}/>

                        {/* Giriş Yapılmış Kullanıcılar İçin Engellenen Sayfalar */}
                        <Route
                            path="/login"
                            element={
                                <AuthenticatedRoute>
                                    <LoginScreen/>
                                </AuthenticatedRoute>
                            }
                        />
                        <Route
                            path="/register"
                            element={
                                <AuthenticatedRoute>
                                    <RegisterScreen/>
                                </AuthenticatedRoute>
                            }
                        />

                        {/* Korumalı Sayfalar - Giriş Gerektiren */}
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <ProfileScreen/>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <DashboardScreen/>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/transactions"
                            element={
                                <ProtectedRoute>
                                    <TransactionsScreen/>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/fund-wallet"
                            element={
                                <ProtectedRoute>
                                    <FundWalletScreen/>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/subscriptions"
                            element={
                                <ProtectedRoute>
                                    <SubscriptionScreen/>
                                </ProtectedRoute>
                            }
                        />

                        {/* 404 Sayfası */}
                        <Route path="*" element={<NotFoundScreen/>}/>
                    </Routes>
                </Container>
            </main>
            <Footer/>
        </Router>
    );
};

export default App;