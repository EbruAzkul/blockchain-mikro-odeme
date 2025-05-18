// frontend/src/screens/FundWalletScreen.js
import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Alert, Spinner } from 'react-bootstrap'; // Spinner'ı import ettik
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { getWalletBalance } from '../redux/slices/walletSlice';
import { addFunds } from '../redux/slices/walletSlice';

const FundWalletScreen = () => {
  const [amount, setAmount] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state'leri
  const { userInfo } = useSelector((state) => state.auth);
  const { 
    balance, 
    loading: walletLoading, 
    error: walletError,
    addFundsLoading,
    addFundsError,
    addFundsSuccess
  } = useSelector((state) => state.wallet);

  useEffect(() => {
    // Kullanıcı girişi kontrolü
    if (!userInfo) {
      navigate('/login');
      return;
    }
    
    // Cüzdan bakiyesini getir
    dispatch(getWalletBalance());
    
    // Ekran ilk açıldığında bir bilgi mesajı göster
    setInfoMessage('Bakiye yüklemek için miktar girin ve işlemi özel anahtarınızla onaylayın.');
    
    // 5 saniye sonra bilgi mesajını kaldır
    const timer = setTimeout(() => {
      setInfoMessage('');
    }, 5000);
    
    // Cleanup timer
    return () => clearTimeout(timer);
  }, [dispatch, navigate, userInfo]);

  // Başarılı bakiye yükleme sonrası
  useEffect(() => {
    if (addFundsSuccess) {
      // Formu temizle
      setAmount('');
      setPrivateKey('');
      
      // 3 saniye sonra Dashboard'a yönlendir
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    }
  }, [addFundsSuccess, navigate]);

  const handleAddFunds = (e) => {
    e.preventDefault();
    
    // Miktar doğrulama
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Lütfen geçerli bir miktar girin.');
      return;
    }
    
    // Private key kontrolü
    if (!privateKey || privateKey.length < 10) {
      alert('Lütfen geçerli bir özel anahtar girin.');
      return;
    }
    
    // Bakiye yükleme işlemi
    dispatch(addFunds({ 
      amount: parsedAmount, 
      privateKey 
    }));
  };

  return (
    <Row className="justify-content-md-center my-3">
      <Col md={6}>
        <Card>
          <Card.Header as="h3">Bakiye Yükle</Card.Header>
          <Card.Body>
            {walletError && <Message variant="danger">{walletError}</Message>}
            {addFundsError && <Message variant="danger">{addFundsError}</Message>}
            {addFundsSuccess && (
              <Alert variant="success">
                <Alert.Heading>İşlem Başarılı!</Alert.Heading>
                <p>Bakiye başarıyla yüklendi! Yeni bakiyeniz: <strong>{balance} MikroCoin</strong></p>
                <p className="mb-0">Birkaç saniye içinde dashboard'a yönlendirileceksiniz...</p>
              </Alert>
            )}
            {infoMessage && <Alert variant="info">{infoMessage}</Alert>}

            <div className="mb-4">
              <h5>Mevcut Bakiye</h5>
              <h2 className="text-primary">{walletLoading ? <Loader size="sm" /> : `${balance} MikroCoin`}</h2>
            </div>

            <Form onSubmit={handleAddFunds}>
              <Form.Group className="mb-3" controlId="amount">
                <Form.Label>Yüklenecek Miktar (MikroCoin)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="Yüklenecek miktarı girin"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  disabled={addFundsLoading || addFundsSuccess}
                />
                <Form.Text className="text-muted">
                  Minimum 0.001 MikroCoin yükleyebilirsiniz.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3" controlId="privateKey">
                <Form.Label>Özel Anahtar</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="İşlemi doğrulamak için özel anahtarınızı girin"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  required
                  disabled={addFundsLoading || addFundsSuccess}
                />
                <Form.Text className="text-muted">
                  Özel anahtarınız sunucuya kaydedilmez, sadece işlemi doğrulamak için kullanılır.
                </Form.Text>
              </Form.Group>

              <div className="d-grid">
                <Button 
                  type="submit" 
                  variant="success" 
                  disabled={addFundsLoading || addFundsSuccess}
                >
                  {addFundsLoading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Yükleniyor...
                    </>
                  ) : addFundsSuccess ? (
                    'Başarıyla Yüklendi!'
                  ) : (
                    'Bakiye Yükle'
                  )}
                </Button>
              </div>
            </Form>
            
            {/* Açıklama kartı */}
            <Card className="mt-4 bg-light">
              <Card.Body>
                <Card.Title as="h5">Bakiye Yükleme Hakkında</Card.Title>
                <Card.Text>
                  <small>
                    Yüklenen bakiye, blockchain ağı üzerinde doğrulanır ve hesabınıza işlenir. 
                    İşlem onaylandıktan sonra bakiyeniz güncellenecektir. Madencilik işlemleri
                    otomatik olarak gerçekleştirilir ve bakiye yükleme işlemi genellikle birkaç
                    saniye içinde tamamlanır.
                  </small>
                </Card.Text>
              </Card.Body>
            </Card>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default FundWalletScreen;