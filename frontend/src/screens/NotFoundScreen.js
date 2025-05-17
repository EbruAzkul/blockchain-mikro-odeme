// C:\Users\HUAWEI\blockchain-mikro-odeme\frontend\src\screens\NotFoundScreen.js

import React from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Button } from 'react-bootstrap';

const NotFoundScreen = () => {
  return (
    <Row className="justify-content-center text-center py-5">
      <Col md={6}>
        <h1 className="display-4">404</h1>
        <h2>Sayfa Bulunamadı</h2>
        <p className="lead">
          Aradığınız sayfa bulunamadı veya taşınmış olabilir.
        </p>
        <Link to="/">
          <Button variant="primary">Ana Sayfaya Dön</Button>
        </Link>
      </Col>
    </Row>
  );
};

export default NotFoundScreen;