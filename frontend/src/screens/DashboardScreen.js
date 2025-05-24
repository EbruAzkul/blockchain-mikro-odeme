// frontend/src/screens/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Alert, Form, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';
import TransactionList from '../components/TransactionList';
import { getWalletBalance } from '../redux/slices/walletSlice';
import { getTransactions, createTransaction, resetCreateSuccess } from '../redux/slices/transactionSlice';
import axios from 'axios';
import SubscriptionWidget from '../components/SubscriptionWidget';


const DashboardScreen = () => {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [blockchainInfo, setBlockchainInfo] = useState(null);
  const [blockchainInfoLoading, setBlockchainInfoLoading] = useState(false);
  const [blockchainInfoError, setBlockchainInfoError] = useState(null);
  const [refreshingData, setRefreshingData] = useState(false);
  
  // Madencilik için state değişkenleri
  const [miningLoading, setMiningLoading] = useState(false);
  const [miningSuccess, setMiningSuccess] = useState('');
  const [miningError, setMiningError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state'leri
  const { userInfo } = useSelector((state) => state.auth);
  const { 
    balance, 
    pendingAmount, 
    loading: walletLoading, 
    error: walletError 
  } = useSelector((state) => state.wallet);
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
      return;
    } 
    
    // Veri yükleme işlemlerini başlat
    loadDashboardData();
  }, [userInfo, navigate]);

  // Dashboard verilerini yükleme fonksiyonu
  const loadDashboardData = () => {
    try {
      setRefreshingData(true);
      // Cüzdan bakiyesi ve işlemleri getir
      dispatch(getWalletBalance());
      dispatch(getTransactions()); // getAllTransactions değil, getTransactions kullan
      fetchBlockchainInfo();
    } catch (error) {
      console.error('Dashboard veri yükleme hatası:', error);
    } finally {
      setRefreshingData(false);
    }
  };

  // Verileri manuel olarak yenileme
  const handleRefreshData = () => {
    loadDashboardData();
  };

  // Blockchain bilgilerini getir
  const fetchBlockchainInfo = async () => {
    try {
      setBlockchainInfoLoading(true);
      setBlockchainInfoError(null);
      
      // Kullanıcı kontrolü
      if (!userInfo || !userInfo.token) {
        throw new Error('Kullanıcı oturumu geçersiz');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      console.log("Blockchain bilgisi getiriliyor...");
      const { data } = await axios.get('http://localhost:5000/api/blockchain/info', config);
      
      // Veri güvenlik kontrolü
      if (!data || typeof data !== 'object') {
        throw new Error('Geçersiz blockchain veri formatı');
      }
      
      console.log("Blockchain bilgisi alındı:", data);
      
      setBlockchainInfo(data);
    } catch (error) {
      console.error("Blockchain bilgisi alınamadı:", error);
      setBlockchainInfoError(error.message || 'Blockchain bilgisi alınamadı');
    } finally {
      setBlockchainInfoLoading(false);
    }
  };

  // Madencilik işlemi
  const handleMineTransactions = async () => {
    try {
      setMiningLoading(true);
      setMiningError('');
      
      // Kullanıcı kontrolü
      if (!userInfo || !userInfo.token || !userInfo.walletAddress) {
        throw new Error('Kullanıcı bilgileri eksik');
      }
      
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
      loadDashboardData();
      
      // Başarı mesajını göster
      setMiningSuccess('Madencilik başarılı! Yeni blok oluşturuldu.');
      
      // 3 saniye sonra başarı mesajını temizle
      setTimeout(() => {
        setMiningSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Madencilik hatası:', error);
      setMiningError(error.response?.data?.message || 'Madencilik işlemi sırasında bir hata oluştu.');
      
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
      loadDashboardData();
    }
  }, [createSuccess, dispatch]);

  // Ödeme oluşturma
  const handleCreateTransaction = (e) => {
    e.preventDefault();
    
    // Güvenlik kontrolü
    if (!toAddress || !amount || !privateKey) {
      return; // Form doğrulama tarayıcı tarafından yapılır
    }
    
    // Kendi adresime transfer engelleme
    if (toAddress === userInfo.walletAddress) {
      alert('Kendinize transfer yapamazsınız!');
      return;
    }
    
    dispatch(createTransaction({ 
      toAddress, 
      amount: parseFloat(amount), 
      description, 
      privateKey 
    }));
  };

  return (
    <>
      <h1 className="my-4">Dashboard</h1>

      {createSuccess && (
        <Alert variant="success">İşlem başarıyla oluşturuldu!</Alert>
      )}
      
      {miningSuccess && <Alert variant="success">{miningSuccess}</Alert>}
      {miningError && <Alert variant="danger">{miningError}</Alert>}
      
      {refreshingData && (
        <Alert variant="info">
          <Spinner animation="border" size="sm" className="me-2" />
          Veriler yenileniyor...
        </Alert>
      )}

      <Row>
        {/* Sol Panel - Cüzdan Bilgileri */}
        <Col md={4}>
          {walletLoading ? (
            <Loader />
          ) : walletError ? (
            <Message variant="danger">{walletError}</Message>
          ) : (
            <Card className="mb-4">
              <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                <span>Cüzdan Bilgileri</span>
                <Button 
                  variant="outline-primary"
                  size="sm"
                  onClick={handleRefreshData}
                  disabled={refreshingData}
                >
                  <i className="fas fa-sync-alt"></i>
                </Button>
              </Card.Header>
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
                  {/* Bekleyen bakiye gösterimi */}
                  {pendingAmount > 0 && (
                    <small className="text-warning">
                      (+{pendingAmount} MikroCoin beklemede)
                    </small>
                  )}
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
                  {miningLoading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Madencilik Yapılıyor...
                    </>
                  ) : (
                    'Madencilik Yap'
                  )}
                </Button>
                <Button
                    variant="info"
                    as={Link}
                    to="/subscriptions"
                    className="mb-2"
                >
                  <i className="fas fa-crown me-2"></i>
                  Abonelikler
                </Button>
                <Button variant="outline-primary" as={Link} to="/transactions">
                  Tüm İşlemlerimi Gör
                </Button>
              </div>
            </Card.Body>
          </Card>
          {userInfo && <SubscriptionWidget userInfo={userInfo} />}

          {/* Blockchain Bilgileri */}
          <Card>
            <Card.Header as="h5">Blockchain Durumu</Card.Header>
            <Card.Body>
              {blockchainInfoLoading ? (
                <Loader />
              ) : blockchainInfoError ? (
                <Message variant="danger">{blockchainInfoError}</Message>
              ) : blockchainInfo ? (
                <>
                  <p><strong>Zincir Uzunluğu:</strong> {blockchainInfo.chainLength || 0} blok</p>
                  <p><strong>Son Blok Hash:</strong> {blockchainInfo.latestBlock?.hash ? 
                    blockchainInfo.latestBlock.hash.substring(0, 16) + '...' : 'N/A'}</p>
                  <p><strong>Önceki Blok Hash:</strong> {blockchainInfo.latestBlock?.previousHash ? 
                    blockchainInfo.latestBlock.previousHash.substring(0, 16) + '...' : 'Genesis'}</p>
                  <p><strong>Zincir Geçerli Mi:</strong> {blockchainInfo.isValid ? 
                    <span className="text-success">Evet</span> : <span className="text-danger">Hayır</span>}</p>
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
                      {createLoading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          İşleniyor...
                        </>
                      ) : (
                        'Ödeme Gönder'
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                Son İşlemlerim
                <div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={handleRefreshData}
                    disabled={transactionsLoading}
                  >
                    <i className="fas fa-sync-alt me-1"></i>
                    Yenile
                  </Button>
                  <Button
                    variant="link"
                    as={Link}
                    to="/transactions"
                  >
                    Tümünü Gör
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                {transactionsLoading ? (
                  <Loader />
                ) : transactionsError ? (
                  <Message variant="danger">{transactionsError}</Message>
                ) : !transactions || transactions.length === 0 ? (
                  <div className="text-center">
                    <Message variant="info">Henüz işlem bulunamadı.</Message>
                    <Button 
                      variant="primary" 
                      className="mt-3"
                      onClick={() => dispatch(getTransactions())}
                    >
                      <i className="fas fa-sync-alt me-2"></i>
                      Yeniden Yükle
                    </Button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    {/* TransactionList bileşenini kullan - Bu, kullanıcı işlemlerini filtreleyecektir */}
                    <TransactionList 
                      transactions={transactions.slice(0, 5)} 
                      showDetails={false}
                    />
                    
                    <div className="text-center mt-3">
                      {transactions.length > 5 && (
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          as={Link}
                          to="/transactions"
                        >
                          Tüm İşlemlerimi Görüntüle ({transactions.length})
                        </Button>
                      )}
                    </div>
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