// frontend/src/components/Header.js
import React from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';

const Header = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Geliştirilmiş çıkış işleyicisi
  const logoutHandler = () => {
    try {
      // Tüm state'i temizleyen çıkış fonksiyonunu çağır
      dispatch(logout());
      // Logout işleminden sonra ana sayfaya yönlendir
      navigate('/');
      
      // Sayfayı yenileme seçeneği (çok gerekli olursa)
      // window.location.href = '/';
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
      // Hataya rağmen kullanıcıyı giriş sayfasına yönlendir
      navigate('/login');
    }
  };

  return (
    <header>
      <Navbar bg="dark" variant="dark" expand="lg" collapseOnSelect>
        <Container>
          <Navbar.Brand as={Link} to="/">Blockchain Mikro Ödeme</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              {userInfo ? (
                <>
                  <Nav.Link as={Link} to="/dashboard">
                    <i className="fas fa-tachometer-alt"></i> Dashboard
                  </Nav.Link>
                  <Nav.Link as={Link} to="/transactions">
                    <i className="fas fa-exchange-alt"></i> İşlemler
                  </Nav.Link>
                  <Nav.Link as={Link} to="/subscriptions">
                    <i className="fas fa-exchange-alt"></i> Abonelik Sistemi
                  </Nav.Link>
                  <NavDropdown 
                    title={
                      <>
                        <i className="fas fa-user"></i> {userInfo.username || userInfo.name}
                      </>
                    } 
                    id="username"
                  >
                    <NavDropdown.Item as={Link} to="/profile">
                      <i className="fas fa-id-card"></i> Profil
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={logoutHandler}>
                      <i className="fas fa-sign-out-alt"></i> Çıkış Yap
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to="/login">
                    <i className="fas fa-user"></i> Giriş Yap
                  </Nav.Link>
                  <Nav.Link as={Link} to="/register">
                    <i className="fas fa-user-plus"></i> Kayıt Ol
                  </Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;