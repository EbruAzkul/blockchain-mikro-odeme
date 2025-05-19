// backend/middleware/adminMiddleware.js

/**
 * Admin yetki kontrolü middleware'i
 * Bu middleware, sadece admin kullanıcıların belirli route'lara erişmesini sağlar
 */
const isAdmin = (req, res, next) => {
  // Kullanıcı verisinin mevcut olduğunu kontrol et
  // Bu middleware, protect middleware'inden sonra çağrılmalıdır
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Yetkilendirme hatası. Lütfen önce giriş yapın.' 
    });
  }
  
  // Admin yetkisi kontrolü
  if (req.user.isAdmin) {
    // Admin kullanıcılar için sonraki middleware'e geç
    next();
  } else {
    // Admin olmayan kullanıcılar için erişim reddet
    res.status(403).json({ 
      message: 'Bu işlem için yönetici yetkileri gereklidir. Erişim reddedildi.' 
    });
  }
};

module.exports = { isAdmin };