// C:\Users\HUAWEI\blockchain-mikro-odeme\backend\blockchain\Wallet.js
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const crypto = require('crypto');

class Wallet {
  constructor() {
    this.keyPair = null;
    this.publicKey = null;
    this.privateKey = null;
    this.testMode = process.env.USE_TEST_MODE === 'true' || process.env.NODE_ENV === 'development';
  }

  generateKeyPair() {
    this.keyPair = ec.genKeyPair();
    this.publicKey = this.keyPair.getPublic('hex');
    this.privateKey = this.keyPair.getPrivate('hex');
    
    return {
      publicKey: this.publicKey,
      privateKey: this.privateKey
    };
  }

  getKeyPairFromPrivateKey(privateKey) {
    try {
      console.log(`getKeyPairFromPrivateKey çağrıldı. Test modu: ${this.testMode}, Anahtar uzunluğu: ${privateKey.length}`);
      
      // Test modu kontrolü
      if (this.testMode) {
        console.log('Test modu aktif: Basitleştirilmiş anahtar doğrulama kullanılıyor');
        
        // Test modunda sadece basit doğrulama
        if (!privateKey || privateKey.length < 10) {
          throw new Error('Özel anahtar en az 10 karakter olmalıdır');
        }
        
        // Test modunda geçici key pair oluştur
        this.publicKey = 'TEST_PUBLIC_KEY_' + privateKey.substring(0, 8);
        this.privateKey = privateKey;
        
        // Sahte keyPair nesnesi oluştur
        this.keyPair = {
          getPublic: () => this.publicKey,
          getPrivate: () => this.privateKey,
          sign: (data) => {
            // Test modunda basit imzalama
            return {
              toDER: () => Buffer.from('TEST_SIGNATURE_' + Date.now()),
              r: 'test_r',
              s: 'test_s'
            };
          }
        };
        
        return {
          publicKey: this.publicKey,
          privateKey: this.privateKey
        };
      }
      
      // Gerçek mod için elliptic kütüphanesini kullan
      try {
        // Özel anahtarın hex olduğundan emin ol
        // Eğer özel anahtar hex formatında değilse, dönüştürmeyi dene
        let hexPrivateKey = privateKey;
        
        // Hex kontrolü (sadece hex karakterleri içeriyor mu?)
        const hexRegex = /^[0-9a-fA-F]+$/;
        if (!hexRegex.test(privateKey)) {
          console.log('Özel anahtar hex formatında değil, dönüştürülüyor...');
          // String'i hex'e çevir
          const hash = crypto.createHash('sha256').update(privateKey).digest('hex');
          hexPrivateKey = hash;
          console.log('Dönüştürülmüş hex anahtar:', hexPrivateKey);
        }
        
        this.keyPair = ec.keyFromPrivate(hexPrivateKey);
        this.publicKey = this.keyPair.getPublic('hex');
        this.privateKey = privateKey; // Orijinal anahtar
        
        return {
          publicKey: this.publicKey,
          privateKey: this.privateKey
        };
      } catch (ellipticError) {
        console.error('Elliptic doğrulama hatası:', ellipticError);
        throw new Error(`Özel anahtar doğrulanamadı: ${ellipticError.message}`);
      }
    } catch (error) {
      console.error('getKeyPairFromPrivateKey hatası:', error);
      throw error;
    }
  }

  signTransaction(transaction) {
    try {
      console.log('signTransaction çağrıldı. Test modu:', this.testMode);
      
      if (!this.keyPair) {
        throw new Error('Anahtar çifti mevcut değil!');
      }
      
      // Test modu kontrolü
      if (this.testMode) {
        console.log('Test modu aktif: Basit imzalama kullanılıyor');
        // Test modunda basit imzalama
        transaction.signature = 'TEST_SIGNATURE_' + Date.now() + '_' + this.privateKey.substring(0, 5);
        return transaction.signature;
      }
      
      // Gerçek imzalama
      return transaction.signTransaction(this.keyPair);
    } catch (error) {
      console.error('İmzalama hatası:', error);
      throw error;
    }
  }
}

module.exports = Wallet;