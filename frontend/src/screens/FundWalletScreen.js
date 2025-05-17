// C:\Users\HUAWEI\blockchain-mikro-odeme\frontend\src\screens\FundWalletScreen.js

import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';
import axios from 'axios';
import { getWalletBalance } from '../redux/slices/walletSlice';

const FundWalletScreen = () => {
  const [amount, setAmount] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state'leri
  const { userInfo } = useSelector((state) => state.auth);
  const { balance, loading: walletLoading } = useSelector((state) => state.wallet);

  useEffect(() => {
    // Kullanıcı girişi kontrolü
    if (!userInfo) {
      navigate('/login');
    } else {
      // Cüzdan bakiyesini getir
      dispatch(getWalletBalance());
    }
  }, [dispatch, navigate, userInfo]);

  const handleAddFunds = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      // Şimdilik doğrudan API'ye istek yapıyoruz, daha sonra Redux'a taşınabilir
      const { data } = await axios.post(
        'http://localhost:5000/api/wallet/add-funds',
        { amount: parseFloat(amount), privateKey },
        config
      );
      
      setSuccess(true);
      setAmount('');
      setPrivateKey('');
      
      // Bakiyeyi güncelle
      dispatch(getWalletBalance());
      
      // 3 saniye sonra başarı mesajını temizle
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Bir hata oluştu'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row className="justify-content-md-center my-3">
      <Col md={6}>
        <Card>
          <Card.Header as="h3">Bakiye Yükle</Card.Header>
          <Card.Body>
            {error && <Message variant="danger">{error}</Message>}
            {success && (
              <Alert variant="success">
                Bakiye başarıyla yüklendi! Yeni bakiyeniz: {balance} MikroCoin
              </Alert>
            )}

            <div className="mb-4">
              <h5>Mevcut Bakiye</h5>
              <h2 className="text-primary">{walletLoading ? <Loader /> : `${balance} MikroCoin`}</h2>
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
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="privateKey">
                <Form.Label>Özel Anahtar</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="İşlemi doğrulamak için özel anahtarınızı girin"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  required
                />
                <Form.Text className="text-muted">
                  Özel anahtarınız sunucuya kaydedilmez, sadece işlemi doğrulamak için kullanılır.
                </Form.Text>
              </Form.Group>

              <div className="d-grid">
                <Button type="submit" variant="success" disabled={loading}>
                  {loading ? 'Yükleniyor...' : 'Bakiye Yükle'}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default FundWalletScreen;