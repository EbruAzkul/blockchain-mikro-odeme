// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  
  // Debug için daha fazla bilgi yazalım
  console.log('Authorization Header:', req.headers.authorization);
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Token'ı al
      token = req.headers.authorization.split(' ')[1];
      console.log('Alınan Token (ilk 20 karakter):', token.substring(0, 20) + '...');
      
      // Token'ı doğrula
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Çözülen JWT:', decoded);
      
      // Kullanıcıyı bul (şifre hariç)
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        console.error('Token geçerli ama kullanıcı bulunamadı:', decoded.id);
        return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
      }
      
      console.log('Kullanıcı bulundu:', req.user._id);
      next();
    } catch (error) {
      console.error('Token doğrulama hatası:', error);
      res.status(401).json({ message: 'Yetkilendirme başarısız, token geçersiz' });
    }
  } else {
    console.error('Token bulunamadı veya Bearer formatında değil');
    res.status(401).json({ message: 'Yetkilendirme başarısız, token bulunamadı' });
  }
};

module.exports = { protect };