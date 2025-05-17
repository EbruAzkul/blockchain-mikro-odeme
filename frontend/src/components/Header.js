import React from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';

const Header = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const logoutHandler = () => {
    dispatch(logout());
    navigate('/login');
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
                  <NavDropdown title={userInfo.username} id="username">
                    <NavDropdown.Item as={Link} to="/profile">Profil</NavDropdown.Item>
                    <NavDropdown.Item onClick={logoutHandler}>
                      Çıkış Yap
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