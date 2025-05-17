import React from 'react';
import { Table, Badge, Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';

const TransactionList = ({ transactions, showDetails, onProcessClick }) => {
  const { userInfo } = useSelector(state => state.auth);

  // Adres kısaltma yardımcı fonksiyonu
  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  return (
    <div className="table-responsive">
      <Table striped hover>
        <thead>
          <tr>
            <th>İşlem ID</th>
            {showDetails && <th>Tarih</th>}
            <th>Gönderen</th>
            <th>Alıcı</th>
            <th>Miktar</th>
            {showDetails && <th>Açıklama</th>}
            <th>Durum</th>
            {onProcessClick && <th>İşlemler</th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx._id}>
              <td>{tx._id.substring(0, 8)}...</td>
              {showDetails && (
                <td>{new Date(tx.timestamp).toLocaleString()}</td>
              )}
              <td className={tx.from === userInfo.walletAddress ? 'text-primary' : ''}>
                {tx.from ? shortenAddress(tx.from) : 'Sistem'}
              </td>
              <td className={tx.to === userInfo.walletAddress ? 'text-primary' : ''}>
                {shortenAddress(tx.to)}
              </td>
              <td>
                {tx.from === userInfo.walletAddress ? (
                  <span className="text-danger">-{tx.amount}</span>
                ) : (
                  <span className="text-success">+{tx.amount}</span>
                )}
                &nbsp;MikroCoin
              </td>
              {showDetails && (
                <td>{tx.description || '-'}</td>
              )}
              <td>
                {tx.status === 'COMPLETED' ? (
                  <Badge bg="success">Tamamlandı</Badge>
                ) : (
                  <Badge bg="warning">Beklemede</Badge>
                )}
              </td>
              {onProcessClick && tx.status === 'PENDING' && (
                <td>
                  <Button 
                    size="sm" 
                    variant="primary"
                    onClick={() => onProcessClick(tx)}
                  >
                    İşle
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default TransactionList;