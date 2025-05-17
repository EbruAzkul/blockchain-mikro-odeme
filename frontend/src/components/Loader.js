// C:\Users\HUAWEI\blockchain-mikro-odeme\frontend\src\components\Loader.js

import React from 'react';
import { Spinner } from 'react-bootstrap';

const Loader = ({ size }) => {
  // Size değerlerine göre spinner boyutunu belirle
  const getSize = () => {
    switch (size) {
      case 'sm':
        return {
          width: '20px',
          height: '20px'
        };
      case 'lg':
        return {
          width: '150px',
          height: '150px'
        };
      case 'md':
      default:
        return {
          width: '100px',
          height: '100px'
        };
    }
  };

  const dimensions = getSize();

  return (
    <Spinner
      animation="border"
      role="status"
      style={{
        width: dimensions.width,
        height: dimensions.height,
        margin: 'auto',
        display: 'block',
      }}
    >
      <span className="sr-only">Yükleniyor...</span>
    </Spinner>
  );
};

export default Loader;