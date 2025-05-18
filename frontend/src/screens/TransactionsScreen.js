// frontend/src/screens/TransactionsScreen.js - Doğrudan API sonuçlarını görüntüleyen versiyon
import React, { useEffect, useState } from 'react';
import { Container, Card, Alert, Spinner, Table, Badge, Button, Form, Modal, Row, Col } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { getAllTransactions, processTransaction } from '../redux/slices/transactionSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';
import axios from 'axios';

const TransactionsScreen = () => {
  const dispatch = useDispatch();
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
  const [apiResponse, setApiResponse] = useState(null);
  const [rawData, setRawData] = useState(null);
  
  // Doğrudan API'den veri alma fonksiyonu
  const fetchTransactionsDirectly = async () => {
    try {
      setManualLoading(true);
      setDebugMessage('API\'den veriler yükleniyor...');
      
      if (!userInfo || !userInfo.token) {
        setDebugMessage('Kullanıcı bilgisi veya token bulunamadı');
        return;
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      // API'den tüm işlemleri al
      console.log('İşlemler API isteği gönderiliyor...');
      const response = await axios.get('http://localhost:5000/api/transactions/all', config);
      console.log('API yanıtı:', response);
      
      // Ham veriyi sakla (hata ayıklama için)
      setRawData(response.data);
      setApiResponse(response);
      
      if (response.data && Array.isArray(response.data)) {
        setFilteredTransactions(response.data);
        setDebugMessage(`${response.data.length} işlem başarıyla yüklendi`);
      } else {
        setFilteredTransactions([]);
        setDebugMessage('API verisi alındı fakat işlem bulunamadı veya veri dizi değil');
      }
    } catch (error) {
      console.error('İşlemler getirme hatası:', error);
      setDebugMessage(`Hata: ${error.message || 'Bilinmeyen hata'}`);
      setApiResponse(error.response || error);
    } finally {
      setManualLoading(false);
    }
  };
  
  // Kullanıcının işlemlerini getir
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
      
      // API'den kullanıcının işlemlerini al
      console.log('Kullanıcı işlemleri API isteği gönderiliyor...');
      const response = await axios.get('http://localhost:5000/api/transactions/my', config);
      console.log('API yanıtı (my transactions):', response);
      
      // Ham veriyi sakla (hata ayıklama için)
      setRawData(response.data);
      setApiResponse(response);
      
      if (response.data && Array.isArray(response.data)) {
        setFilteredTransactions(response.data);
        setDebugMessage(`${response.data.length} kullanıcı işlemi başarıyla yüklendi`);
      } else {
        setFilteredTransactions([]);
        setDebugMessage('API verisi alındı fakat işlem bulunamadı veya veri dizi değil');
      }
    } catch (error) {
      console.error('Kullanıcı işlemleri getirme hatası:', error);
      setDebugMessage(`Hata: ${error.message || 'Bilinmeyen hata'}`);
      setApiResponse(error.response || error);
    } finally {
      setManualLoading(false);
    }
  };
  
  useEffect(() => {
    // Hem Redux ile hem de doğrudan API ile verileri yükle
    dispatch(getAllTransactions());
    fetchTransactionsDirectly();
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
      dispatch(getAllTransactions());
      fetchTransactionsDirectly();
    }
  }, [processSuccess, dispatch]);
  
  // Verileri yeniden yükleme
  const handleRefresh = () => {
    setDebugMessage('Veriler yeniden yükleniyor...');
    dispatch(getAllTransactions());
    fetchTransactionsDirectly();
  };
  
  // Backend API durum kontrolü
  const checkApiStatus = async () => {
    try {
      setManualLoading(true);
      setDebugMessage('API durumu kontrol ediliyor...');
      
      // API'nin durumunu kontrol et
      const response = await axios.get('http://localhost:5000/api/health');
      console.log('API durumu:', response);
      
      setApiResponse(response);
      setDebugMessage(`API durumu: ${response.status === 200 ? 'Çalışıyor' : 'Hata'}`);
    } catch (error) {
      console.error('API durum kontrolü hatası:', error);
      setApiResponse(error.response || error);
      setDebugMessage(`API durum hatası: ${error.message || 'Bilinmeyen hata'}`);
    } finally {
      setManualLoading(false);
    }
  };
  
  // Tüm işlemleri doğrudan görüntüleme
  const handleShowRawData = () => {
    if (rawData) {
      alert(JSON.stringify(rawData, null, 2));
    } else {
      alert('Henüz veri yüklenmedi.');
    }
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
      <h1 className="mb-4">İşlem Geçmişi</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {debugMessage && <Alert variant="info" dismissible onClose={() => setDebugMessage('')}>{debugMessage}</Alert>}
      
      <Card className="mb-4">
        <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
          <span>Veri Yükleme Seçenekleri</span>
          <div>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={handleRefresh}
              disabled={loading || manualLoading}
              className="me-2"
            >
              <i className="fas fa-sync-alt me-1"></i> Tüm İşlemleri Yükle
            </Button>
            <Button 
              variant="outline-info" 
              size="sm"
              onClick={fetchMyTransactions}
              disabled={manualLoading}
              className="me-2"
            >
              <i className="fas fa-user me-1"></i> Kullanıcı İşlemlerini Yükle
            </Button>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={checkApiStatus}
              disabled={manualLoading}
            >
              <i className="fas fa-server me-1"></i> API Durumu
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
          
          {apiResponse && (
            <div className="mt-3">
              <Alert variant="secondary">
                <strong>API Yanıt Durumu:</strong> {apiResponse.status || 'Bilinmiyor'} 
                <span className="ms-3">
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={handleShowRawData}
                  >
                    Ham Veriyi Göster
                  </Button>
                </span>
              </Alert>
            </div>
          )}
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Header as="h5">Tüm İşlemler</Card.Header>
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
                <Button 
                  variant="secondary" 
                  onClick={handleShowRawData}
                >
                  <i className="fas fa-code me-2"></i> API Yanıtını Göster
                </Button>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    <th>İşlem ID</th>
                    <th>Tarih</th>
                    <th>Gönderen</th>
                    <th>Alıcı</th>
                    <th>Miktar</th>
                    <th>Açıklama</th>
                    <th>Durum</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr key={tx._id || `tx-${Math.random()}`}>
                      <td>{tx._id ? tx._id.substring(0, 8) + '...' : 'N/A'}</td>
                      <td>{formatDate(tx.timestamp)}</td>
                      <td className={tx.from === userInfo?.walletAddress ? 'text-primary fw-bold' : ''}>
                        {tx.from ? shortenAddress(tx.from) : 'Sistem'}
                      </td>
                      <td className={tx.to === userInfo?.walletAddress ? 'text-primary fw-bold' : ''}>
                        {shortenAddress(tx.to)}
                      </td>
                      <td className="fw-bold">{tx.amount || 0} MikroCoin</td>
                      <td>{tx.description || '-'}</td>
                      <td>
                        {tx.status === 'COMPLETED' ? (
                          <Badge bg="success">Tamamlandı</Badge>
                        ) : (
                          <Badge bg="warning">Beklemede</Badge>
                        )}
                      </td>
                      <td>
                        {tx.status === 'PENDING' && tx.from === userInfo?.walletAddress && (
                          <Button 
                            size="sm" 
                            variant="primary"
                            onClick={() => handleProcessClick(tx)}
                            disabled={processLoading}
                          >
                            {processLoading ? 'İşleniyor...' : 'İşle'}
                          </Button>
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
                <li><strong>Gönderen:</strong> {selectedTx.from ? shortenAddress(selectedTx.from) : 'Sistem'}</li>
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