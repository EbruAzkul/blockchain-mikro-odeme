// C:\Users\HUAWEI\blockchain-mikro-odeme\backend\middleware\errorMiddleware.js

// 404 hatası (kaynak bulunamadı) işleme
const notFound = (req, res, next) => {
  const error = new Error(`${req.originalUrl} yolu bulunamadı`);
  res.status(404);
  next(error);
};

// Genel hata işleme middleware'i
const errorHandler = (err, req, res, next) => {
  // Durum kodu 200 ise (başarılı) ve bir hata varsa, 500 olarak ayarla
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode);
  
  // Hata yanıtı gönder
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};

module.exports = { notFound, errorHandler };