// frontend/src/utils/tokenHelper.js

/**
 * Token doğrulama fonksiyonu
 * JWT token'ın geçerli olup olmadığını kontrol eder
 * 
 * @param {string} token - Doğrulanacak JWT token
 * @returns {boolean} Token'ın geçerli olup olmadığı
 */
export const validateToken = (token) => {
  try {
    // Temel token format kontrolü
    if (!token || typeof token !== 'string' || token.length < 10) {
      console.error('Geçersiz token formatı');
      return false;
    }

    // Token yapısını kontrol et (basit kontrol: JWT üç bölümden oluşur)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Geçersiz JWT token yapısı');
      return false;
    }

    // Token süre kontrolü (eğer decode edilebilirse)
    try {
      // Base64 encode edilmiş payload'ı çöz
      const payload = JSON.parse(atob(parts[1]));
      
      // Eğer expiration süresi varsa kontrol et
      if (payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
          console.error('Token süresi dolmuş');
          return false;
        }
      }
    } catch (err) {
      console.warn('Token payload decode edilemedi:', err);
      // Token'ı decode edemesek bile geçerli kabul edebiliriz
      // Backend zaten geçersiz tokenları reddedecektir
    }

    return true;
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    return false;
  }
};

/**
 * Token'dan kullanıcı ID'sini alma
 * JWT token'ın payload kısmından kullanıcı ID'sini çıkarır
 * 
 * @param {string} token - JWT token
 * @returns {string|null} Kullanıcı ID'si veya null
 */
export const getUserIdFromToken = (token) => {
  try {
    if (!token) return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.id || payload.userId || payload.sub || null;
  } catch (error) {
    console.error('Token payload okuma hatası:', error);
    return null;
  }
};