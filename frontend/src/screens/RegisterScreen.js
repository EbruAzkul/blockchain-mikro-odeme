// frontend/src/screens/RegisterScreen.js (devamı)
import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Spinner, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, resetAuthState } from '../redux/slices/authSlice';
import { AuthNavigator, EmergencyRedirectButton } from '../utils/NavigationHelper';

const RegisterScreen = () => {
  // State tanımlamaları
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  
  // Özel anahtar için modal state'leri
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [privateKeyCopied, setPrivateKeyCopied] = useState(false);
  const [keySavedConfirmed, setKeySavedConfirmed] = useState(false);
  
  // Hooks
  const dispatch = useDispatch();
  
  // Redux state'inden veri alma
  const { userInfo, isLoading, isError, errorMessage } = useSelector(state => state.auth);
  
  // Kullanıcı zaten giriş yapmışsa ve özel anahtar varsa modalı göster
  useEffect(() => {
    if (userInfo && userInfo.privateKey && !showPrivateKeyModal) {
      setPrivateKey(userInfo.privateKey);
      setShowPrivateKeyModal(true);
    }
    
    // Bileşen temizleme
    return () => {
      dispatch(resetAuthState());
    };
  }, [userInfo, dispatch, showPrivateKeyModal]);

  // Form doğrulama fonksiyonu
  const validateForm = () => {
    // Kullanıcı adı doğrulama
    if (!username || username.length < 3) {
      setFormError('Kullanıcı adı en az 3 karakter olmalıdır');
      return false;
    }
    
    // Email doğrulama
    if (!email) {
      setFormError('Lütfen email adresinizi girin');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError('Lütfen geçerli bir email adresi girin');
      return false;
    }
    
    // Şifre doğrulama
    if (!password || password.length < 6) {
      setFormError('Şifre en az 6 karakter olmalıdır');
      return false;
    }
    
    // Şifre eşleşme kontrolü
    if (password !== confirmPassword) {
      setPasswordError('Şifreler eşleşmiyor');
      return false;
    }
    
    // Form geçerli
    setFormError('');
    setPasswordError('');
    return true;
  };
  
  // Form gönderme işlemi
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Form doğrulama
    if (!validateForm()) {
      return;
    }
    
    dispatch(register({ username, email, password }));
  };
  
  // Alternatif kayıt yöntemi - doğrudan fetch kullanarak
  const handleDirectRegister = () => {
    if (!validateForm()) {
      return;
    }
    
    fetch('http://localhost:5000/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.token) {
          // Kullanıcı bilgilerini sakla
          localStorage.setItem('userInfo', JSON.stringify(data));
          
          // Özel anahtar varsa göster
          if (data.privateKey) {
            setPrivateKey(data.privateKey);
            setShowPrivateKeyModal(true);
          } else {
            // Özel anahtar yoksa doğrudan dashboard'a git
            window.location.href = '/dashboard';
          }
        } else {
          setFormError('Kayıt başarısız: ' + (data.message || 'Bilinmeyen hata'));
        }
      })
      .catch(error => {
        console.error('Direct register error:', error);
        setFormError('Kayıt hatası: ' + error.message);
      });
  };
  
  // Özel anahtarı kopyalama
  const copyPrivateKey = () => {
    navigator.clipboard.writeText(privateKey)
      .then(() => {
        setPrivateKeyCopied(true);
        setTimeout(() => setPrivateKeyCopied(false), 3000);
      })
      .catch((err) => {
        console.error('Kopyalama hatası:', err);
        alert('Özel anahtar kopyalanamadı. Lütfen manuel olarak kopyalayın.');
      });
  };
  
  // Modal kapatıldığında
  const handleClosePrivateKeyModal = () => {
    if (!keySavedConfirmed) {
      if (!window.confirm('Özel anahtarınızı kaydettiğinize emin misiniz? Bu anahtarı bir daha göremeyeceksiniz ve anahtarsız işlem yapamazsınız!')) {
        return;
      }
    }
    
    setShowPrivateKeyModal(false);
    window.location.href = '/dashboard';
  };
  
  return (
    <Container className="py-5">
      <Row className="justify-content-md-center">
        <Col xs={12} md={6}>
          <Card>
            <Card.Header as="h4" className="text-center bg-primary text-white">Kayıt Ol</Card.Header>
            <Card.Body>
              {/* Hata mesajları */}
              {isError && <Alert variant="danger">{errorMessage}</Alert>}
              {passwordError && <Alert variant="danger">{passwordError}</Alert>}
              {formError && <Alert variant="danger">{formError}</Alert>}
              
              {/* Kayıt başarılı mesajı ve yönlendirme */}
              {userInfo && !showPrivateKeyModal && (
                <Alert variant="success">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Kayıt tamamlandı! Dashboard'a yönlendiriliyorsunuz...</span>
                    <EmergencyRedirectButton to="/dashboard" text="Dashboard'a Git" variant="success" />
                  </div>
                </Alert>
              )}
              
              {/* Kayıt formu */}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Kullanıcı Adı</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Kullanıcı adınız"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setFormError('');
                    }}
                    required
                    disabled={isLoading || (userInfo && !showPrivateKeyModal)}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>E-posta</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="E-posta adresiniz"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFormError('');
                    }}
                    required
                    disabled={isLoading || (userInfo && !showPrivateKeyModal)}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Şifre</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Şifreniz"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError('');
                      setFormError('');
                    }}
                    required
                    disabled={isLoading || (userInfo && !showPrivateKeyModal)}
                  />
                  <Form.Text className="text-muted">
                    Şifreniz en az 6 karakter uzunluğunda olmalıdır.
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Şifre Tekrarı</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Şifrenizi tekrar girin"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError('');
                      setFormError('');
                    }}
                    required
                    disabled={isLoading || (userInfo && !showPrivateKeyModal)}
                  />
                </Form.Group>
                
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={isLoading || (userInfo && !showPrivateKeyModal)} 
                    className="py-2"
                  >
                    {isLoading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Kayıt Yapılıyor...
                      </>
                    ) : (
                      'Kayıt Ol'
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline-primary" 
                    onClick={handleDirectRegister}
                    disabled={isLoading || (userInfo && !showPrivateKeyModal)}
                  >
                    Alternatif Kayıt Yöntemi
                  </Button>
                </div>
              </Form>
              
              <div className="text-center mt-3">
                Zaten hesabınız var mı? <Link to="/login" className="text-primary">Giriş Yap</Link>
              </div>
              
              <div className="mt-4">
                <Alert variant="info" className="mb-0">
                  <p className="mb-1"><strong>Önemli Bilgilendirme:</strong></p>
                  <p className="mb-0">
                    <small>
                      Kayıt işleminiz tamamlandığında size özel bir blockchain cüzdanı oluşturulacak ve 
                      bir özel anahtar verilecektir. Bu özel anahtarı güvenli bir yerde saklamanız 
                      çok önemlidir. Anahtar olmadan blockchain üzerinde işlem yapamazsınız.
                    </small>
                  </p>
                </Alert>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Otomatik yönlendirme bileşeni - özel anahtar gösterilmiyorsa */}
      {userInfo && !showPrivateKeyModal && (
        <AuthNavigator requiredAuth={false} targetPath="/dashboard" waitTime={1500} />
      )}
      
      {/* Özel Anahtar Modal */}
      <Modal 
        show={showPrivateKeyModal} 
        onHide={handleClosePrivateKeyModal}
        backdrop="static" 
        keyboard={false}
        centered
      >
        <Modal.Header>
          <Modal.Title>
            <i className="fas fa-key text-warning me-2"></i>
            Özel Anahtarınız
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <Alert.Heading>DİKKAT: Bu çok önemli!</Alert.Heading>
            <p>
              Aşağıda görüntülenen özel anahtarınız, blockchain hesabınıza erişim sağlayan 
              tek anahtardır. Bu anahtarı <strong>güvenli bir şekilde saklayın</strong> ve 
              kimseyle paylaşmayın.
            </p>
            <p>
              <strong>Bu anahtarı sadece bir kez göreceksiniz!</strong> Kaybederseniz hesabınıza
              erişiminizi kaybedersiniz ve işlem yapamazsınız.
            </p>
          </Alert>
          
          <div className="bg-light p-3 mb-3 border rounded">
            <code className="user-select-all">{privateKey}</code>
          </div>
          
          <div className="d-grid gap-2 mb-3">
            <Button 
              variant="primary" 
              onClick={copyPrivateKey}
              className="d-flex align-items-center justify-content-center"
            >
              <i className="fas fa-copy me-2"></i>
              {privateKeyCopied ? 'Kopyalandı!' : 'Özel Anahtarı Kopyala'}
            </Button>
          </div>
          
          <Form.Check
            type="checkbox"
            id="keySavedCheck"
            className="mb-3"
            label="Özel anahtarımı güvenli bir yere kaydettim ve kaybetmeyeceğim."
            onChange={(e) => setKeySavedConfirmed(e.target.checked)}
            required
          />
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="success" 
            onClick={handleClosePrivateKeyModal}
            disabled={!keySavedConfirmed}
          >
            Dashboard'a Devam Et
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default RegisterScreen;