// C:\Users\HUAWEI\blockchain-mikro-odeme\frontend\src\screens\DashboardScreen.js

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Alert, Form, Table, Badge } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { getWalletBalance } from '../redux/slices/walletSlice';
import { getTransactions, createTransaction, resetCreateSuccess } from '../redux/slices/transactionSlice';
import axios from 'axios';

const DashboardScreen = () => {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [blockchainInfo, setBlockchainInfo] = useState(null);
  const [blockchainInfoLoading, setBlockchainInfoLoading] = useState(false);
  
  // Madencilik için state değişkenleri
  const [miningLoading, setMiningLoading] = useState(false);
  const [miningSuccess, setMiningSuccess] = useState('');
  const [miningError, setMiningError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state'leri
  const { userInfo } = useSelector((state) => state.auth);
  const { balance, loading: walletLoading, error: walletError } = useSelector((state) => state.wallet);
  const { 
    transactions, 
    loading: transactionsLoading, 
    error: transactionsError,
    createLoading,
    createError,
    createSuccess
  } = useSelector((state) => state.transactions);

  useEffect(() => {
    // Kullanıcı girişi kontrolü
    if (!userInfo) {
      navigate('/login');
    } else {
      // Cüzdan bakiyesi ve işlemleri getir
      dispatch(getWalletBalance());
      dispatch(getTransactions());
      fetchBlockchainInfo();
    }
  }, [dispatch, navigate, userInfo]);

  // Blockchain bilgilerini getir
  const fetchBlockchainInfo = async () => {
    try {
      setBlockchainInfoLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      console.log("Blockchain bilgisi getiriliyor...");
      const { data } = await axios.get('http://localhost:5000/api/blockchain/info', config);
      console.log("Blockchain bilgisi alındı:", data);
      
      setBlockchainInfo(data);
      setBlockchainInfoLoading(false);
    } catch (error) {
      console.error("Blockchain bilgisi alınamadı:", error);
      setBlockchainInfoLoading(false);
    }
  };

  // Madencilik işlemi
  const handleMineTransactions = async () => {
    try {
      setMiningLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.post(
        'http://localhost:5000/api/blockchain/mine',
        { minerAddress: userInfo.walletAddress },
        config
      );
      
      // Başarılı madencilik sonrası verileri yenile
      dispatch(getWalletBalance());
      dispatch(getTransactions());
      fetchBlockchainInfo();
      
      // Başarı mesajını göster
      setMiningSuccess('Madencilik başarılı! Yeni blok oluşturuldu.');
      
      // 3 saniye sonra başarı mesajını temizle
      setTimeout(() => {
        setMiningSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Madencilik hatası:', error);
      setMiningError('Madencilik işlemi sırasında bir hata oluştu.');
      
      // 3 saniye sonra hata mesajını temizle
      setTimeout(() => {
        setMiningError('');
      }, 3000);
    } finally {
      setMiningLoading(false);
    }
  };

  // İşlem başarıyla oluşturulduysa formu sıfırla
  useEffect(() => {
    if (createSuccess) {
      setShowTransactionForm(false);
      setToAddress('');
      setAmount('');
      setDescription('');
      setPrivateKey('');
      
      // Başarı durumunu sıfırla
      setTimeout(() => {
        dispatch(resetCreateSuccess());
      }, 3000);

      // Verileri yenile
      dispatch(getWalletBalance());
      dispatch(getTransactions());
      fetchBlockchainInfo();
    }
  }, [createSuccess, dispatch]);

  // Ödeme oluşturma
  const handleCreateTransaction = (e) => {
    e.preventDefault();
    dispatch(createTransaction({ 
      toAddress, 
      amount: parseFloat(amount), 
      description, 
      privateKey 
    }));
  };

  // Adres kısaltma
  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  return (
    <>
      <h1 className="my-4">Dashboard</h1>

      {createSuccess && (
        <Alert variant="success">İşlem başarıyla oluşturuldu!</Alert>
      )}
      
      {miningSuccess && <Alert variant="success">{miningSuccess}</Alert>}
      {miningError && <Alert variant="danger">{miningError}</Alert>}

      <Row>
        {/* Sol Panel - Cüzdan Bilgileri */}
        <Col md={4}>
          {walletLoading ? (
            <Loader />
          ) : walletError ? (
            <Message variant="danger">{walletError}</Message>
          ) : (
            <Card className="mb-4">
              <Card.Header as="h5">Cüzdan Bilgileri</Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <small className="text-muted">Adres:</small>
                  <div className="text-break d-flex align-items-center">
                    <small>{userInfo?.walletAddress}</small>
                    <Button
                      variant="link"
                      size="sm"
                      className="ms-2 p-0"
                      onClick={() => {
                        navigator.clipboard.writeText(userInfo?.walletAddress);
                        alert('Adres kopyalandı!');
                      }}
                    >
                      <i className="fas fa-copy"></i>
                    </Button>
                  </div>
                </div>
                <div>
                  <small className="text-muted">Bakiye:</small>
                  <h2 className="mb-0">{balance} MikroCoin</h2>
                </div>
              </Card.Body>
            </Card>
          )}

          <Card className="mb-4">
            <Card.Header as="h5">Hızlı İşlemler</Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button
                  variant="primary"
                  onClick={() => setShowTransactionForm(!showTransactionForm)}
                >
                  {showTransactionForm ? 'İptal' : 'Yeni İşlem'}
                </Button>
                <Button variant="success" as={Link} to="/fund-wallet">
                  Bakiye Yükle
                </Button>
                <Button 
                  variant="warning" 
                  onClick={handleMineTransactions}
                  disabled={miningLoading}
                >
                  {miningLoading ? 'Madencilik Yapılıyor...' : 'Madencilik Yap'}
                </Button>
                <Button variant="outline-primary" as={Link} to="/transactions">
                  Tüm İşlemleri Gör
                </Button>
              </div>
            </Card.Body>
          </Card>
          
          {/* Blockchain Bilgileri */}
          <Card>
            <Card.Header as="h5">Blockchain Durumu</Card.Header>
            <Card.Body>
              {blockchainInfoLoading ? (
                <Loader />
              ) : blockchainInfo ? (
                <>
                  <p><strong>Zincir Uzunluğu:</strong> {blockchainInfo.chainLength || 0} blok</p>
                  <p><strong>Son Blok Hash:</strong> {blockchainInfo.latestBlock?.hash ? 
                    blockchainInfo.latestBlock.hash.substring(0, 16) + '...' : 'N/A'}</p>
                  <p><strong>Önceki Blok Hash:</strong> {blockchainInfo.latestBlock?.previousHash ? 
                    blockchainInfo.latestBlock.previousHash.substring(0, 16) + '...' : 'Genesis'}</p>
                  <p><strong>Zincir Geçerli Mi:</strong> {blockchainInfo.isValid ? 
                    <Badge bg="success">Evet</Badge> : <Badge bg="danger">Hayır</Badge>}</p>
                  <p><strong>Bekleyen İşlemler:</strong> {blockchainInfo.pendingTransactions || 0}</p>
                  <p><strong>Son Güncelleme:</strong> {blockchainInfo.timestamp ? 
                    new Date(blockchainInfo.timestamp).toLocaleString() : 'Bilinmiyor'}</p>
                </>
              ) : (
                <Message variant="info">Blockchain bilgisi yüklenemedi.</Message>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Sağ Panel - İşlem Formu veya Son İşlemler */}
        <Col md={8}>
          {showTransactionForm ? (
            <Card>
              <Card.Header as="h5">Yeni İşlem</Card.Header>
              <Card.Body>
                {createError && <Message variant="danger">{createError}</Message>}
                <Form onSubmit={handleCreateTransaction}>
                  <Form.Group className="mb-3" controlId="to">
                    <Form.Label>Alıcı Adresi</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Alıcının cüzdan adresini girin"
                      value={toAddress}
                      onChange={(e) => setToAddress(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="amount">
                    <Form.Label>Miktar (MikroCoin)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      placeholder="Göndermek istediğiniz miktar"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="description">
                    <Form.Label>Açıklama</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="İşlem açıklaması (isteğe bağlı)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="privateKey">
                    <Form.Label>Özel Anahtar</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="İşlemi imzalamak için özel anahtarınızı girin"
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      required
                    />
                    <Form.Text className="text-muted">
                      Özel anahtarınız sunucuya kaydedilmez, sadece işlemi imzalamak için kullanılır.
                    </Form.Text>
                  </Form.Group>

                  <div className="d-grid">
                    <Button type="submit" variant="primary" disabled={createLoading}>
                      {createLoading ? 'İşleniyor...' : 'Ödeme Gönder'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Header as="h5">
                Son İşlemler
                <Button
                  variant="link"
                  className="float-end"
                  as={Link}
                  to="/transactions"
                >
                  Tümünü Gör
                </Button>
              </Card.Header>
              <Card.Body>
                {transactionsLoading ? (
                  <Loader />
                ) : transactionsError ? (
                  <Message variant="danger">{transactionsError}</Message>
                ) : transactions.length === 0 ? (
                  <Message variant="info">Henüz bir işlem yapılmamış.</Message>
                ) : (
                  <div className="table-responsive">
                    <Table className="table table-striped table-hover">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Tipi</th>
                          <th>Kimden/Kime</th>
                          <th>Miktar</th>
                          <th>Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.slice(0, 5).map((tx) => (
                          <tr key={tx._id || `tx-${Math.random()}`}>
                            <td>{tx._id ? tx._id.substring(0, 8) + '...' : 'N/A'}</td>
                            <td>
                              {tx.from === userInfo?.walletAddress ? (
                                <Badge bg="danger">Gönderim</Badge>
                              ) : (
                                <Badge bg="success">Alım</Badge>
                              )}
                            </td>
                            <td>
                              {tx.from === userInfo?.walletAddress
                                ? shortenAddress(tx.to)
                                : shortenAddress(tx.from)}
                            </td>
                            <td>{tx.amount || 0} MikroCoin</td>
                            <td>
                              {tx.status === 'COMPLETED' ? (
                                <Badge bg="success">Tamamlandı</Badge>
                              ) : (
                                <Badge bg="warning">Beklemede</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </>
  );
};

export default DashboardScreen;