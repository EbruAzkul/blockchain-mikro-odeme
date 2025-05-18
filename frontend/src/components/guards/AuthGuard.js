// frontend/src/components/guards/AuthGuard.js
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../redux/slices/authSlice';

/**
 * Kimlik doğrulama koruması bileşeni
 * Bu bileşen, yalnızca kimliği doğrulanmış kullanıcıların
 * belirli sayfalara erişmesini sağlar
 */
const AuthGuard = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux'tan kullanıcı bilgisini al
  const { userInfo } = useSelector((state) => state.auth);
  
  useEffect(() => {
    // Kullanıcı oturumu yoksa, giriş sayfasına yönlendir
    if (!userInfo) {
      navigate('/login');
      return;
    }
    
    // Token doğrulama işlevi
    const isTokenValid = () => {
      try {
        // Token var mı kontrol et
        if (!userInfo.token) {
          console.error('Token bulunamadı');
          return false;
        }
        
        // Token süresi dolmuş mu kontrol et (basitleştirilmiş)
        // Gerçek uygulamada JWT decode işlemi ile doğrulama yapılabilir
        if (typeof userInfo.token !== 'string' || userInfo.token.length < 10) {
          console.error('Geçersiz token formatı');
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Token doğrulama hatası:', error);
        return false;
      }
    };
    
    // Token geçersizse, çıkış yapma ve yönlendirme
    if (!isTokenValid()) {
      console.log('Geçersiz token, kullanıcı çıkış yaptırılıyor...');
      dispatch(logout());
      navigate('/login');
    }
  }, [userInfo, dispatch, navigate]);
  
  // Yalnızca kullanıcı kimliği doğrulanmışsa alt bileşenleri göster
  return userInfo ? <>{children}</> : null;
};

export default AuthGuard;