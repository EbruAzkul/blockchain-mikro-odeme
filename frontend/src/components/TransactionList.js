// frontend/src/components/TransactionList.js
import React from 'react';
import { Table, Badge, Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';

const TransactionList = ({ transactions, showDetails, onProcessClick }) => {
  const { userInfo } = useSelector(state => state.auth);

  // Adres kısaltma yardımcı fonksiyonu - geliştirilmiş güvenlik
  const shortenAddress = (address) => {
    if (!address) return '';
    if (typeof address !== 'string') return String(address);
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };
  
  // Sadece kullanıcıya ait işlemleri filtreleme
  const userTransactionsOnly = transactions.filter(tx => 
    tx.from === userInfo?.walletAddress || 
    tx.to === userInfo?.walletAddress ||
    // Sistem işlemleri (madencilik ödülleri vb.) gösterilebilir
    tx.from === 'system' || tx.from === null
  );

  return (
    <div className="table-responsive">
      <Table striped hover>
        <thead>
          <tr>
            <th>İşlem ID</th>
            {showDetails && <th>Tarih</th>}
            <th>İşlem Tipi</th>
            <th>Karşı Taraf</th>
            <th>Miktar</th>
            {showDetails && <th>Açıklama</th>}
            <th>Durum</th>
            {onProcessClick && <th>İşlemler</th>}
          </tr>
        </thead>
        <tbody>
          {userTransactionsOnly.length > 0 ? (
            userTransactionsOnly.map((tx) => (
              <tr key={tx._id}>
                <td>{tx._id ? tx._id.substring(0, 8) + '...' : 'N/A'}</td>
                {showDetails && (
                  <td>{tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'N/A'}</td>
                )}
                <td>
                  {tx.from === userInfo.walletAddress ? (
                    <Badge bg="danger">Gönderim</Badge>
                  ) : (
                    <Badge bg="success">Alım</Badge>
                  )}
                </td>
                <td>
                  {tx.from === userInfo.walletAddress ? (
                    shortenAddress(tx.to)
                  ) : (
                    tx.from ? shortenAddress(tx.from) : 'Sistem'
                  )}
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
                {onProcessClick && tx.status === 'PENDING' && tx.from === userInfo.walletAddress && (
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
                {onProcessClick && (tx.status === 'COMPLETED' || tx.from !== userInfo.walletAddress) && (
                  <td>-</td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={showDetails ? 7 : 6} className="text-center">
                Henüz işlem bulunamadı.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default TransactionList;