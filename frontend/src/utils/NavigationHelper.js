// frontend/src/utils/NavigationHelper.js
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Alert, Spinner } from 'react-bootstrap';

/**
 * Yönlendirme yardımcısı
 * Kullanıcı yönlendirme sorunlarını çözmek için kullanılır
 */
const NavigationHelper = ({ targetPath, condition, loadingMessage, successMessage, waitTime = 2000 }) => {
  const [countdown, setCountdown] = useState(waitTime / 1000);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const navigate = useNavigate();

  // Sayaç işlevi
  useEffect(() => {
    if (condition && !shouldNavigate) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShouldNavigate(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [condition, shouldNavigate]);

  // Yönlendirme işlevi
  useEffect(() => {
    if (shouldNavigate) {
      // Önce window.location.href ile deneyelim (tam sayfa yenileme)
      window.location.href = targetPath;
      
      // Yedek olarak navigate kullanımı (React Router)
      // setTimeout(() => {
      //   navigate(targetPath);
      // }, 500);
    }
  }, [shouldNavigate, navigate, targetPath]);

  // Hiçbir şey gösterme durumu
  if (!condition) {
    return null;
  }

  return (
    <div className="navigation-helper">
      <Alert variant="info">
        <div className="d-flex align-items-center">
          <Spinner animation="border" size="sm" className="me-2" />
          <span>
            {successMessage || loadingMessage || 'Yönlendiriliyor...'} ({countdown} saniye)
          </span>
        </div>
        <div className="mt-2">
          <small>
            Otomatik yönlendirme çalışmazsa{' '}
            <a href={targetPath} className="alert-link">
              buraya tıklayın
            </a>
          </small>
        </div>
      </Alert>
    </div>
  );
};

/**
 * Auth Navigator - Oturum durumuna göre yönlendirme
 * Kullanımı: <AuthNavigator requiredAuth={true} targetPath="/dashboard" />
 */
export const AuthNavigator = ({ requiredAuth = true, targetPath, waitTime = 2000 }) => {
  const { userInfo } = useSelector((state) => state.auth);
  
  // Kullanıcı giriş yapmış ve giriş gerektiren sayfa
  if (userInfo && requiredAuth) {
    return (
      <NavigationHelper
        targetPath={targetPath || '/dashboard'}
        condition={true}
        loadingMessage="Kimlik doğrulandı"
        successMessage="Dashboard'a yönlendiriliyorsunuz"
        waitTime={waitTime}
      />
    );
  }
  
  // Kullanıcı giriş yapmamış ve giriş gerektiren sayfa
  if (!userInfo && requiredAuth) {
    return (
      <NavigationHelper
        targetPath="/login"
        condition={true}
        loadingMessage="Kimlik doğrulaması gerekiyor"
        successMessage="Giriş sayfasına yönlendiriliyorsunuz"
        waitTime={waitTime}
      />
    );
  }
  
  // Kullanıcı giriş yapmış ve giriş gerektirmeyen sayfa (örn. login, register)
  if (userInfo && !requiredAuth) {
    return (
      <NavigationHelper
        targetPath="/dashboard"
        condition={true}
        loadingMessage="Zaten giriş yapmışsınız"
        successMessage="Dashboard'a yönlendiriliyorsunuz"
        waitTime={waitTime}
      />
    );
  }
  
  // Kullanıcı giriş yapmamış ve giriş gerektirmeyen sayfa
  return null;
};

/**
 * Acil Durum Yönlendirme Butonu
 * Kullanımı: <EmergencyRedirectButton to="/dashboard" text="Dashboard'a Git" />
 */
export const EmergencyRedirectButton = ({ to, text, variant = "primary" }) => {
  const handleClick = () => {
    // Tam sayfa yenileme ile yönlendirme
    window.location.href = to;
  };
  
  return (
    <button 
      className={`btn btn-${variant}`} 
      onClick={handleClick}
    >
      {text || `${to} sayfasına git`}
    </button>
  );
};

// HATA DÜZELTME: forceRedirect fonksiyonu bağımsız bir fonksiyon olarak tanımlandı,
// içerisinde useNavigate çağrılmıyor ve doğrudan window.location.href kullanılıyor

/**
 * forceRedirect - Programmatik olarak zorla yönlendirme
 * Bu fonksiyon, herhangi bir React hook kullanmaz!
 * @param {string} path - Hedef yol
 */
export const forceRedirect = (path) => {
  if (!path) return false;
  
  // React Router hook'larını kullanmıyoruz, sadece window.location
  window.location.href = path;
  return true;
};

/**
 * UseNavigateRedirect - useNavigate hook'unu kullanan bir React bileşeni
 * Yalnızca React bileşenlerinde kullanılabilir!
 */
export const UseNavigateRedirect = ({ to }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate(to);
  }, [navigate, to]);
  
  return null;
};

/**
 * getAuthRedirectPath - Kullanıcı durumuna göre yönlendirme yolu
 * @param {object} userInfo - Kullanıcı bilgisi
 * @param {boolean} isAuthPage - Şu anki sayfa kimlik doğrulama sayfası mı
 * @returns {string|null} - Yönlendirme yolu veya null
 */
export const getAuthRedirectPath = (userInfo, isAuthPage) => {
  // Kullanıcı giriş yapmış ve kimlik doğrulama sayfasındaysa
  if (userInfo && isAuthPage) {
    return '/dashboard';
  }
  
  // Kullanıcı giriş yapmamış ve korumalı sayfadaysa
  if (!userInfo && !isAuthPage) {
    return '/login';
  }
  
  // Yönlendirme gerekmiyor
  return null;
};

export default NavigationHelper;