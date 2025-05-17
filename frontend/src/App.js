import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { initWeb3 } from './services/web3Service';
import FundWalletScreen from './screens/FundWalletScreen';
// Components
import Header from './components/Header';

// Screens
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import ProfileScreen from './screens/ProfileScreen';
import NotFoundScreen from './screens/NotFoundScreen';

// Ana Layout bileşeni
const Layout = () => (
  <>
    <Header />
    <main className="py-3">
      <Container>
        <Outlet />
      </Container>
    </main>
    <footer className="text-center py-3">
      <Container>
        <p>&copy; {new Date().getFullYear()} Blockchain Mikro Ödeme Sistemi</p>
      </Container>
    </footer>
  </>
);

// Router yapılandırması
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <HomeScreen />,
      },
      {
        path: '/login',
        element: <LoginScreen />,
      },
      {
        path: '/register',
        element: <RegisterScreen />,
      },
      {
        path: '/dashboard',
        element: <DashboardScreen />,
      },
      {
        path: '/transactions',
        element: <TransactionsScreen />,
      },
      {
        path: '/fund-wallet',
        element: <FundWalletScreen />,
      },
      {
        path: '/profile',
        element: <ProfileScreen />,
      },
      {
        path: '*',
        element: <NotFoundScreen />,
      },
    ],
  },
]);

function App() {
  useEffect(() => {
    // Web3 başlatma
    const initializeWeb3 = async () => {
      const success = await initWeb3();
      if (success) {
        console.log('Web3 başarıyla başlatıldı');
      } else {
        console.error('Web3 başlatılamadı');
      }
    };

    initializeWeb3();
  }, []);

  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
}

export default App;