// frontend/src/screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, resetAuthState } from '../redux/slices/authSlice';
import { AuthNavigator, EmergencyRedirectButton } from '../utils/NavigationHelper';

const LoginScreen = () => {
  // State tanımlamaları
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  
  // Hook'lar
  const dispatch = useDispatch();
  
  // Redux state'inden veri alma
  const { userInfo, isLoading, isError, errorMessage } = useSelector(state => state.auth);
  
  // Bileşen temizleme - mount/unmount durumunda
  useEffect(() => {
    return () => {
      dispatch(resetAuthState());
    };
  }, [dispatch]);

  // Form doğrulama
  const validateForm = () => {
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
    if (!password) {
      setFormError('Lütfen şifrenizi girin');
      return false;
    }
    
    if (password.length < 6) {
      setFormError('Şifre en az 6 karakter olmalıdır');
      return false;
    }
    
    // Form geçerli
    setFormError('');
    return true;
  };
  
  // Form submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Form doğrulama
    if (!validateForm()) {
      return;
    }
    
    dispatch(login({ email, password }));
  };
  
  // Doğrudan window.location ile yönlendirme yapan giriş işlemi
  const handleDirectLogin = () => {
    if (!validateForm()) {
      return;
    }
    
    fetch('http://localhost:5000/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.token) {
          // Kullanıcı bilgilerini localStorage'a kaydet
          localStorage.setItem('userInfo', JSON.stringify(data));
          // Sayfayı yeniden yükleyerek dashboard'a yönlendir
          window.location.href = '/dashboard';
        } else {
          setFormError('Giriş yapılamadı: ' + (data.message || 'Bilinmeyen hata'));
        }
      })
      .catch(error => {
        console.error('Direct login error:', error);
        setFormError('Giriş hatası: ' + error.message);
      });
  };
  
  // Render
  return (
    <Container className="py-5">
      <Row className="justify-content-md-center">
        <Col xs={12} md={6}>
          <Card>
            <Card.Header as="h4" className="text-center bg-primary text-white">Giriş</Card.Header>
            <Card.Body>
              {/* Hata mesajları */}
              {isError && <Alert variant="danger">{errorMessage}</Alert>}
              {formError && <Alert variant="danger">{formError}</Alert>}
              
              {/* Giriş başarılı mesajı ve yönlendirme */}
              {userInfo && (
                <Alert variant="success">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Giriş yapıldı! Dashboard'a yönlendiriliyorsunuz...</span>
                    <EmergencyRedirectButton to="/dashboard" text="Dashboard'a Git" variant="success" />
                  </div>
                </Alert>
              )}
              
              {/* Giriş formu */}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>E-posta</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="E-posta adresiniz"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFormError(''); // Input değiştiğinde hata mesajını temizle
                    }}
                    required
                    disabled={isLoading || userInfo}
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
                      setFormError(''); // Input değiştiğinde hata mesajını temizle
                    }}
                    required
                    disabled={isLoading || userInfo}
                  />
                </Form.Group>
                
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={isLoading || userInfo}
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
                        Giriş Yapılıyor...
                      </>
                    ) : (
                      'Giriş Yap'
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline-primary" 
                    onClick={handleDirectLogin}
                    disabled={isLoading || userInfo}
                  >
                    Alternatif Giriş Yöntemi
                  </Button>
                </div>
              </Form>
              
              <div className="text-center mt-3">
                Hesabınız yok mu? <Link to="/register" className="text-primary">Kayıt Ol</Link>
              </div>
              
              <div className="mt-4">
                <Alert variant="info" className="mb-0">
                  <p className="mb-1">
                    <strong>Blockchain Mikro Ödeme Sistemi</strong>'ne hoş geldiniz!
                  </p>
                  <p className="mb-0">
                    <small>
                      Güvenli, değişmez ve şeffaf mikro ödemeler için blockchain teknolojisini kullanıyoruz.
                      Hesabınızın güvenliği için lütfen özel anahtarınızı güvenli bir yerde saklayın.
                    </small>
                  </p>
                </Alert>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Otomatik yönlendirme bileşeni */}
      {userInfo && <AuthNavigator requiredAuth={false} targetPath="/dashboard" waitTime={1500} />}
    </Container>
  );
};

export default LoginScreen;