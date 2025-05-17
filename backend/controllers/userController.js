// backend/controllers/userController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const blockchainService = require('../services/blockchainService');

// JWT Token oluştur
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET tanımlanmamış!');
    throw new Error('JWT Secret tanımlanmamış');
  }
  
  console.log('Token oluşturuluyor, ID:', id);
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
  console.log('Oluşturulan token (ilk 20 karakter):', token.substring(0, 20) + '...');
  
  return token;
};

// Kullanıcı kaydı
exports.registerUser = async (req, res) => {
  try {
    console.log('Register isteği alındı:', req.body);
    const { username, email, password } = req.body;
    
    // Kullanıcı var mı kontrolü
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('Kullanıcı zaten var:', email);
      return res.status(400).json({ message: 'Bu e-posta ile kayıtlı kullanıcı zaten var' });
    }
    
    // Blockchain wallet oluşturma
    console.log('Blockchain wallet oluşturuluyor...');
    const wallet = blockchainService.createWallet();
    console.log('Wallet oluşturuldu:', {
      publicKey: wallet.publicKey.substring(0, 10) + '...',
      privateKey: 'gizli'
    });
    
    // Kullanıcı oluşturma
    const user = await User.create({
      username,
      email,
      password,
      walletAddress: wallet.publicKey
    });
    console.log('Kullanıcı oluşturuldu:', user._id);
    
    // Token oluşturma
    const token = generateToken(user._id);
    
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      walletAddress: user.walletAddress,
      token,
      // privateKey ile güvenli bir şekilde dönüş yapılmalı (gerçek senaryoda)
      privateKey: wallet.privateKey
    });
  } catch (error) {
    console.error('Register hatası:', error);
    res.status(500).json({ message: error.message });
  }
};

// Kullanıcı girişi
exports.loginUser = async (req, res) => {
  try {
    console.log('Login isteği alındı:', { email: req.body.email });
    const { email, password } = req.body;
    
    // Kullanıcıyı bul
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('Kullanıcı bulunamadı:', email);
      return res.status(401).json({ message: 'Hatalı e-posta veya şifre' });
    }
    
    // Şifre kontrolü
    const isMatch = await user.matchPassword(password);
    console.log('Şifre eşleşmesi:', isMatch);
    
    if (isMatch) {
      // Token oluşturma
      const token = generateToken(user._id);
      
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress,
        token
      });
    } else {
      console.log('Şifre eşleşmedi:', email);
      res.status(401).json({ message: 'Hatalı e-posta veya şifre' });
    }
  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({ message: error.message });
  }
};

// Kullanıcı profili
exports.getUserProfile = async (req, res) => {
  try {
    console.log('Kullanıcı profili isteği, ID:', req.user._id);
    const user = await User.findById(req.user._id);
    
    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        walletAddress: user.walletAddress
      });
    } else {
      console.log('Kullanıcı bulunamadı, ID:', req.user._id);
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
  } catch (error) {
    console.error('Profil getirme hatası:', error);
    res.status(500).json({ message: error.message });
  }
};

// Profil güncelleme
exports.updateUserProfile = async (req, res) => {
  try {
    console.log('Profil güncelleme isteği, ID:', req.user._id);
    const user = await User.findById(req.user._id);
    
    if (user) {
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
      
      if (req.body.password) {
        user.password = req.body.password;
      }
      
      const updatedUser = await user.save();
      console.log('Kullanıcı güncellendi, ID:', updatedUser._id);
      
      // Token oluşturma
      const token = generateToken(updatedUser._id);
      
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        walletAddress: updatedUser.walletAddress,
        token
      });
    } else {
      console.log('Kullanıcı bulunamadı, ID:', req.user._id);
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    res.status(500).json({ message: error.message });
  }
};