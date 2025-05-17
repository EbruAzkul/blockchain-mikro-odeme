// C:\Users\HUAWEI\blockchain-mikro-odeme\frontend\src\screens\ProfileScreen.js

import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { updateProfile } from '../redux/slices/authSlice';

const ProfileScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userInfo, isLoading, isError, errorMessage, isSuccess } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    } else {
      setName(userInfo.name);
      setEmail(userInfo.email);
    }
  }, [navigate, userInfo]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Şifreler eşleşmiyor!');
    } else {
      dispatch(
        updateProfile({
          id: userInfo._id,
          name,
          email,
          password: password ? password : undefined,
        })
      );
      setMessage(null);
    }
  };

  return (
    <Row>
      <Col md={6} className="mx-auto">
        <h2>Kullanıcı Profili</h2>
        {message && <Message variant="danger">{message}</Message>}
        {isError && <Message variant="danger">{errorMessage}</Message>}
        {isSuccess && <Message variant="success">Profil güncellendi</Message>}
        {isLoading && <Loader />}
        <Form onSubmit={submitHandler}>
          <Form.Group controlId="name" className="mb-3">
            <Form.Label>Ad Soyad</Form.Label>
            <Form.Control
              type="name"
              placeholder="Ad Soyad girin"
              value={name}
              onChange={(e) => setName(e.target.value)}
            ></Form.Control>
          </Form.Group>

          <Form.Group controlId="email" className="mb-3">
            <Form.Label>Email Adresi</Form.Label>
            <Form.Control
              type="email"
              placeholder="Email girin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            ></Form.Control>
          </Form.Group>

          <Form.Group controlId="password" className="mb-3">
            <Form.Label>Şifre</Form.Label>
            <Form.Control
              type="password"
              placeholder="Şifre girin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            ></Form.Control>
          </Form.Group>

          <Form.Group controlId="confirmPassword" className="mb-3">
            <Form.Label>Şifre Tekrar</Form.Label>
            <Form.Control
              type="password"
              placeholder="Şifreyi tekrar girin"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            ></Form.Control>
          </Form.Group>

          <Button type="submit" variant="primary">
            Güncelle
          </Button>
        </Form>
      </Col>
    </Row>
  );
};

export default ProfileScreen;