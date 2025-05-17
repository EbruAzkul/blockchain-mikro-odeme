// C:\Users\HUAWEI\blockchain-mikro-odeme\frontend\src\components\Footer.js

import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer>
      <Container>
        <Row>
          <Col className="text-center py-3">
            &copy; {new Date().getFullYear()} Blockchain Mikro Ödeme Sistemi
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;