// C:\Users\HUAWEI\blockchain-mikro-odeme\frontend\src\index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import 'bootstrap/dist/css/bootstrap.min.css';           // Bootstrap CSS'i ekleyin
import '@fortawesome/fontawesome-free/css/all.min.css';  // FontAwesome ekleyin
import 'bootstrap/dist/js/bootstrap.bundle.min.js';      // Bootstrap JS ekleyin
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);