import React from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Button } from 'react-bootstrap';

const HomeScreen = () => {
  return (
    <>
      <div className="jumbotron py-5 mb-4">
        <h1>Blockchain Mikro Ödeme Sistemi</h1>
        <p className="lead">
          Güvenli, değişmez ve şeffaf mikro ödemeler için blockchain tabanlı
          ödeme sistemi.
        </p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Hemen Başlayın
        </Link>
      </div>

      <h2 className="mb-4">Nasıl Çalışır?</h2>
      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <div className="text-center mb-3">
                <i className="fas fa-wallet fa-3x text-primary"></i>
              </div>
              <Card.Title className="text-center">Cüzdan Oluştur</Card.Title>
              <Card.Text>
                Hesap oluşturduğunuzda otomatik olarak size blockchain üzerinde
                bir cüzdan oluşturulur.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <div className="text-center mb-3">
                <i className="fas fa-exchange-alt fa-3x text-primary"></i>
              </div>
              <Card.Title className="text-center">İşlem Oluştur</Card.Title>
              <Card.Text>
                Alıcı adresini, miktarı ve açıklamayı girerek hızlıca ödeme
                oluşturabilirsiniz.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <div className="text-center mb-3">
                <i className="fas fa-shield-alt fa-3x text-primary"></i>
              </div>
              <Card.Title className="text-center">Güvenli İşlem</Card.Title>
              <Card.Text>
                Tüm işlemler blockchain üzerinde kaydedilir ve değiştirilemez,
                böylece her zaman güvendedir.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default HomeScreen;