// frontend/src/utils/SessionManager.js

/**
 * Oturum yönetim fonksiyonları
 * Kullanıcı oturumunu yönetmek için yardımcı fonksiyonlar
 */

/**
 * Kullanıcı oturumunu başlatma
 * @param {object} userData - Kullanıcı bilgileri
 */
export const initSession = (userData) => {
  try {
    // Ana kullanıcı bilgilerini localStorage'a kaydet
    localStorage.setItem('userInfo', JSON.stringify(userData));
    
    // Oturum başlangıç zamanını kaydet
    sessionStorage.setItem('sessionStartTime', Date.now().toString());
    
    // Oturum aktif olarak işaretle
    sessionStorage.setItem('sessionActive', 'true');
    
    console.log('Kullanıcı oturumu başlatıldı');
  } catch (error) {
    console.error('Oturum başlatma hatası:', error);
    throw new Error('Oturum başlatılamadı');
  }
};

/**
 * Kullanıcı oturumunu sonlandırma
 */
export const destroySession = () => {
  try {
    // Kullanıcıya ait tüm verileri localStorage'dan temizle
    localStorage.removeItem('userInfo');
    
    // Oturum verisini temizle
    sessionStorage.removeItem('sessionStartTime');
    sessionStorage.removeItem('sessionActive');
    
    // Ek olarak diğer tüm cache'lenmiş verileri temizle
    // Blockchain uygulamaları için önemli
    const blockchainKeys = findLocalStorageItemsWithPrefix('blockchain_');
    blockchainKeys.forEach(key => localStorage.removeItem(key));
    
    console.log('Kullanıcı oturumu sonlandırıldı');
  } catch (error) {
    console.error('Oturum sonlandırma hatası:', error);
  }
};

/**
 * Oturumun aktif olup olmadığını kontrol et
 * @returns {boolean} Oturum aktif mi
 */
export const isSessionActive = () => {
  try {
    const sessionActive = sessionStorage.getItem('sessionActive');
    const userInfo = localStorage.getItem('userInfo');
    
    return sessionActive === 'true' && userInfo !== null;
  } catch (error) {
    console.error('Oturum kontrolü hatası:', error);
    return false;
  }
};

/**
 * Oturum zaman aşımı kontrolü
 * @param {number} timeoutMinutes - Zaman aşımı süresi (dakika)
 * @returns {boolean} Oturum zaman aşımına uğramış mı
 */
export const isSessionTimedOut = (timeoutMinutes = 60) => {
  try {
    const sessionStartTime = parseInt(sessionStorage.getItem('sessionStartTime') || '0');
    const currentTime = Date.now();
    const sessionDurationMs = currentTime - sessionStartTime;
    const timeoutMs = timeoutMinutes * 60 * 1000;
    
    return sessionDurationMs > timeoutMs;
  } catch (error) {
    console.error('Oturum zaman aşımı kontrolü hatası:', error);
    return true; // Hata durumunda güvenli tarafta kal
  }
};

/**
 * Oturum süresini yenile
 */
export const refreshSession = () => {
  try {
    // Oturum başlangıç zamanını güncelle
    sessionStorage.setItem('sessionStartTime', Date.now().toString());
  } catch (error) {
    console.error('Oturum yenileme hatası:', error);
  }
};

/**
 * Belirli bir prefikse sahip localStorage öğelerini bulma
 * @param {string} prefix - Öğe anahtarı öneki
 * @returns {Array} Eşleşen anahtarların listesi
 */
export const findLocalStorageItemsWithPrefix = (prefix) => {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keys.push(key);
    }
  }
  return keys;
};

/**
 * Kullanıcı kimliğini localStorage'dan al
 * @returns {string|null} Kullanıcı kimliği
 */
export const getUserIdFromStorage = () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
    return userInfo && userInfo._id ? userInfo._id : null;
  } catch (error) {
    console.error('Kullanıcı kimliği okuma hatası:', error);
    return null;
  }
};

/**
 * Kullanıcı cüzdan adresini localStorage'dan al
 * @returns {string|null} Kullanıcı cüzdan adresi
 */
export const getWalletAddressFromStorage = () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
    return userInfo && userInfo.walletAddress ? userInfo.walletAddress : null;
  } catch (error) {
    console.error('Cüzdan adresi okuma hatası:', error);
    return null;
  }
};