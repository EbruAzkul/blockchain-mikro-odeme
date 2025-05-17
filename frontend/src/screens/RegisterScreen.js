import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../redux/slices/authSlice';

const RegisterScreen = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { loading, error } = useSelector(state => state.auth);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setPasswordError('Şifreler eşleşmiyor');
      return;
    }
    
    setPasswordError('');
    
    dispatch(register({ username, email, password }))
      .unwrap()
      .then((data) => {
        // Özel anahtar bilgisini bir kez göster
        alert(`Özel anahtarınız: ${data.privateKey}\n\nBu anahtarı güvenli bir yerde saklayın. Bu sizin tek görme şansınız!`);
        navigate('/dashboard');
      })
      .catch((err) => {
        console.error('Registration failed:', err);
      });
  };
  
  return (
    <Container className="py-5">
      <Row className="justify-content-md-center">
        <Col xs={12} md={6}>
          <Card>
            <Card.Header as="h4" className="text-center">Kayıt Ol</Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {passwordError && <Alert variant="danger">{passwordError}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Kullanıcı Adı</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Kullanıcı adınız"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>E-posta</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="E-posta adresiniz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Şifre</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Şifreniz"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Şifre Tekrarı</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Şifrenizi tekrar girin"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Form.Group>
                
                <div className="d-grid gap-2">
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
                  </Button>
                </div>
              </Form>
              
              <div className="text-center mt-3">
                Zaten hesabınız var mı? <Link to="/login">Giriş Yap</Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterScreen;