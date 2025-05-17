// C:\Users\HUAWEI\blockchain-mikro-odeme\frontend\src\screens\TransactionsScreen.js

import React, { useEffect, useState } from 'react';
import { Container, Card, Alert, Spinner, Table, Badge, Button, Form, Modal } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { getAllTransactions, processTransaction } from '../redux/slices/transactionSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';

const TransactionsScreen = () => {
  const dispatch = useDispatch();
  const { transactions, loading, error, processLoading, processError, processSuccess } = useSelector(state => state.transactions);
  const { userInfo } = useSelector(state => state.auth);
  
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [privateKey, setPrivateKey] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    dispatch(getAllTransactions());
  }, [dispatch]);
  
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
    }
  }, [processSuccess]);
  
  // Open process modal
  const handleProcessClick = (tx) => {
    setSelectedTx(tx);
    setShowProcessModal(true);
  };
  
  // Handle process transaction
  const handleProcessTransaction = (e) => {
    e.preventDefault();
    if (selectedTx && privateKey) {
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
  
  return (
    <Container className="py-4">
      <h1 className="mb-4">İşlem Geçmişi</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      
      <Card>
        <Card.Header as="h5">Tüm İşlemler</Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-3">
              <Spinner animation="border" />
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="text-center py-3">
              <p className="mb-0">Henüz işlem bulunmuyor.</p>
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
                  {transactions.map((tx) => (
                    <tr key={tx._id || `tx-${Math.random()}`}>
                      <td>{tx._id ? tx._id.substring(0, 8) + '...' : 'N/A'}</td>
                      <td>{tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'N/A'}</td>
                      <td className={tx.from === userInfo?.walletAddress ? 'text-primary' : ''}>
                        {tx.from ? shortenAddress(tx.from) : 'Sistem'}
                      </td>
                      <td className={tx.to === userInfo?.walletAddress ? 'text-primary' : ''}>
                        {shortenAddress(tx.to)}
                      </td>
                      <td>{tx.amount || 0} MikroCoin</td>
                      <td>{tx.description || '-'}</td>
                      <td>
                        {tx.status === 'COMPLETED' ? (
                          <Badge bg="success">Tamamlandı</Badge>
                        ) : (
                          <Badge bg="warning">Beklemede</Badge>
                        )}
                      </td>
                      <td>
                        {tx.status === 'PENDING' && (
                          <Button 
                            size="sm" 
                            variant="primary"
                            onClick={() => handleProcessClick(tx)}
                          >
                            İşle
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