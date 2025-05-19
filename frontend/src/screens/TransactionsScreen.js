// frontend/src/screens/TransactionsScreen.js
import React, { useEffect, useState } from 'react';
import { Container, Card, Alert, Spinner, Table, Badge, Button, Form, Modal, Row, Col } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getTransactions, processTransaction } from '../redux/slices/transactionSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';
import axios from 'axios';
import TransactionList from '../components/TransactionList';

const TransactionsScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { transactions, loading, error, processLoading, processError, processSuccess } = useSelector(state => state.transactions);
  const { userInfo } = useSelector(state => state.auth);
  
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [privateKey, setPrivateKey] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL', 'COMPLETED', 'PENDING'
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'SENT', 'RECEIVED'
  const [manualLoading, setManualLoading] = useState(false);
  const [debugMessage, setDebugMessage] = useState('');
  
  // Kullanıcının kendi işlemlerini getiren fonksiyon
  const fetchMyTransactions = async () => {
    try {
      setManualLoading(true);
      setDebugMessage('Kullanıcı işlemleri yükleniyor...');
      
      if (!userInfo || !userInfo.token) {
        setDebugMessage('Kullanıcı bilgisi veya token bulunamadı');
        return;
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      // Doğrudan kullanıcının kendi işlemlerini al
      console.log('Kullanıcı işlemleri API isteği gönderiliyor...');
      const response = await axios.get('http://localhost:5000/api/transactions/my', config);
      console.log('API yanıtı (my transactions):', response);
      
      if (response.data && Array.isArray(response.data)) {
        // Filtreleme işlemleri
        let userTransactions = [...response.data];
        
        // İşlem tipi filtresi uygula
        if (filterType === 'SENT' && userInfo) {
          userTransactions = userTransactions.filter(tx => tx.from === userInfo.walletAddress);
        } else if (filterType === 'RECEIVED' && userInfo) {
          userTransactions = userTransactions.filter(tx => tx.to === userInfo.walletAddress);
        }
        
        // Durum filtresi uygula
        if (filterStatus !== 'ALL') {
          userTransactions = userTransactions.filter(tx => tx.status === filterStatus);
        }
        
        setFilteredTransactions(userTransactions);
        setDebugMessage(`${userTransactions.length} kullanıcı işlemi başarıyla yüklendi`);
      } else {
        setFilteredTransactions([]);
        setDebugMessage('API verisi alındı fakat işlem bulunamadı veya veri dizi değil');
      }
    } catch (error) {
      console.error('Kullanıcı işlemleri getirme hatası:', error);
      setDebugMessage(`Hata: ${error.message || 'Bilinmeyen hata'}`);
    } finally {
      setManualLoading(false);
    }
  };
  
  useEffect(() => {
    // Sadece kullanıcının kendi işlemlerini yükle - tüm işlemleri değil
    dispatch(getTransactions());
    fetchMyTransactions();
  }, [dispatch]);
  
  // Redux state'inden veri alınırsa burası çalışacak
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      console.log('Redux\'tan işlemler alındı:', transactions);
      
      // Redux'tan gelen verileri de göster
      let reduxTransactions = [...transactions];
      
      // İşlem tipi filtresi uygula
      if (filterType === 'SENT' && userInfo) {
        reduxTransactions = reduxTransactions.filter(tx => tx.from === userInfo.walletAddress);
      } else if (filterType === 'RECEIVED' && userInfo) {
        reduxTransactions = reduxTransactions.filter(tx => tx.to === userInfo.walletAddress);
      }
      
      // Durum filtresi uygula
      if (filterStatus !== 'ALL') {
        reduxTransactions = reduxTransactions.filter(tx => tx.status === filterStatus);
      }
      
      // Eğer filtrelenmiş işlemler boşsa ve Redux'tan gelen veriler varsa
      if (filteredTransactions.length === 0 && reduxTransactions.length > 0) {
        setFilteredTransactions(reduxTransactions);
        setDebugMessage(`${reduxTransactions.length} işlem Redux'tan yüklendi`);
      }
    }
  }, [transactions, userInfo, filterStatus, filterType]);
  
  // Process success handler
  useEffect(() => {
    if (processSuccess) {
      setShowProcessModal(false);
      setPrivateKey('');
      setSelectedTx(null);
      setSuccessMessage('İşlem başarıyla işlendi!');
      
      // Success message timeout
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      // İşlemleri yeniden yükle
      dispatch(getTransactions());
      fetchMyTransactions();
    }
  }, [processSuccess, dispatch]);
  
  // Filtre değiştiğinde işlemleri filtrele
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      let filtered = [...transactions];
      
      // İşlem tipi filtresi
      if (filterType === 'SENT' && userInfo) {
        filtered = filtered.filter(tx => tx.from === userInfo.walletAddress);
      } else if (filterType === 'RECEIVED' && userInfo) {
        filtered = filtered.filter(tx => tx.to === userInfo.walletAddress);
      }
      
      // Durum filtresi
      if (filterStatus !== 'ALL') {
        filtered = filtered.filter(tx => tx.status === filterStatus);
      }
      
      setFilteredTransactions(filtered);
    }
  }, [filterStatus, filterType, transactions, userInfo]);
  
  // Verileri yeniden yükleme
  const handleRefresh = () => {
    setDebugMessage('Veriler yeniden yükleniyor...');
    dispatch(getTransactions());
    fetchMyTransactions();
  };
  
  // Open process modal
  const handleProcessClick = (tx) => {
    // İşlemin bu kullanıcı tarafından yapılabileceğinden emin ol
    if (tx.from !== userInfo.walletAddress) {
      alert('Sadece kendi gönderdiğiniz işlemleri işleyebilirsiniz!');
      return;
    }
    
    setSelectedTx(tx);
    setShowProcessModal(true);
  };
  
  // Handle process transaction
  const handleProcessTransaction = (e) => {
    e.preventDefault();
    if (selectedTx && privateKey) {
      // Güvenlik kontrolü
      if (selectedTx.from !== userInfo.walletAddress) {
        alert('Bu işlemi işleme yetkiniz yok!');
        setShowProcessModal(false);
        return;
      }
      
      dispatch(processTransaction({
        transactionId: selectedTx._id,
        privateKey
      }));
    }
  };
  
  // Address shortener - safety checks added
  const shortenAddress = (address) => {
    if (!address) return 'N/A';
    if (typeof address !== 'string') return String(address);
    if (address.length < 14) return address;
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };
  
  // Tarihi formatlama
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('tr-TR');
    } catch (error) {
      console.error('Tarih formatlama hatası:', error);
      return dateString;
    }
  };
  
  return (
    <Container className="py-4">
      <h1 className="mb-4">İşlem Geçmişim</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {debugMessage && <Alert variant="info" dismissible onClose={() => setDebugMessage('')}>{debugMessage}</Alert>}
      
      <Card className="mb-4">
        <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
          <span>Filtreler</span>
          <div>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={handleRefresh}
              disabled={loading || manualLoading}
              className="me-2"
            >
              <i className="fas fa-sync-alt me-1"></i> İşlemlerimi Yenile
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>İşlem Durumu</Form.Label>
                <Form.Select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="ALL">Tümü</option>
                  <option value="COMPLETED">Tamamlandı</option>
                  <option value="PENDING">Beklemede</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>İşlem Tipi</Form.Label>
                <Form.Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="ALL">Tümü</option>
                  <option value="SENT">Gönderilen</option>
                  <option value="RECEIVED">Alınan</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Header as="h5">İşlemlerim</Card.Header>
        <Card.Body>
          {(loading || manualLoading) ? (
            <div className="text-center py-3">
              <Spinner animation="border" />
              <p className="mt-2">İşlemler yükleniyor...</p>
            </div>
          ) : !filteredTransactions || filteredTransactions.length === 0 ? (
            <div className="text-center py-3">
              <p className="mb-3">Seçilen kriterlere uygun işlem bulunamadı.</p>
              <div className="d-flex justify-content-center gap-2">
                <Button 
                  variant="primary" 
                  onClick={handleRefresh}
                >
                  <i className="fas fa-sync-alt me-2"></i> Yeniden Dene
                </Button>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <TransactionList 
                transactions={filteredTransactions}
                showDetails={true}
                onProcessClick={handleProcessClick}
              />
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Process Transaction Modal */}
      <Modal show={showProcessModal} onHide={() => setShowProcessModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>İşlemi Onayla</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {processError && <Alert variant="danger">{processError}</Alert>}
          
          {selectedTx && (
            <>
              <p>Aşağıdaki işlemi onaylamak üzeresiniz:</p>
              <ul className="list-unstyled">
                <li><strong>ID:</strong> {selectedTx._id}</li>
                <li><strong>Alıcı:</strong> {shortenAddress(selectedTx.to)}</li>
                <li><strong>Miktar:</strong> {selectedTx.amount} MikroCoin</li>
                <li><strong>Açıklama:</strong> {selectedTx.description || '-'}</li>
                <li><strong>Tarih:</strong> {formatDate(selectedTx.timestamp)}</li>
              </ul>
              
              <Form onSubmit={handleProcessTransaction}>
                <Form.Group className="mb-3">
                  <Form.Label>Özel Anahtarınız</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="İşlemi onaylamak için özel anahtarınızı girin"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    required
                  />
                  <Form.Text className="text-muted">
                    Özel anahtarınız sunucuya kaydedilmez, sadece işlemi onaylamak için kullanılır.
                  </Form.Text>
                </Form.Group>
                
                <div className="d-grid">
                  <Button type="submit" variant="primary" disabled={processLoading}>
                    {processLoading ? 'İşleniyor...' : 'İşlemi Onayla'}
                  </Button>
                </div>
              </Form>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default TransactionsScreen;