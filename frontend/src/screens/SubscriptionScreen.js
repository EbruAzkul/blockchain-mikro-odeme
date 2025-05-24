// frontend/src/screens/SubscriptionScreen.js
import React, { useState, useEffect } from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Alert,
    Modal,
    Form,
    Badge,
    Tabs,
    Tab,
    Spinner
} from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';

const SubscriptionScreen = () => {
    const [plans, setPlans] = useState({});
    const [mySubscriptions, setMySubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [privateKey, setPrivateKey] = useState('');
    const [duration, setDuration] = useState('1');
    const [autoRenew, setAutoRenew] = useState(false);
    const [activeTab, setActiveTab] = useState('plans');
    const [createLoading, setCreateLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
            return;
        }
        fetchData();
    }, [userInfo, navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchPlans(), fetchMySubscriptions()]);
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/subscriptions/plans');

            if (response.data.success) {
                setPlans(response.data.plans);
            }
        } catch (error) {
            console.error('Planları getirme hatası:', error);
            setError('Abonelik planları yüklenemedi');
        }
    };

    const fetchMySubscriptions = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`
                }
            };

            const response = await axios.get(
                'http://localhost:5000/api/subscriptions/my-subscriptions',
                config
            );

            if (response.data.success) {
                setMySubscriptions(response.data.subscriptions);
            }
        } catch (error) {
            console.error('Abonelikleri getirme hatası:', error);
            setError('Abonelikleriniz yüklenemedi');
        }
    };

    const handleSubscribe = async (e) => {
        e.preventDefault();

        if (!privateKey) {
            setError('Özel anahtarınızı girin');
            return;
        }

        if (!duration || parseInt(duration) < 1) {
            setError('Geçerli bir süre girin');
            return;
        }

        setCreateLoading(true);
        setError('');

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`
                }
            };

            const response = await axios.post(
                'http://localhost:5000/api/subscriptions/create',
                {
                    serviceId: selectedPlan,
                    duration: parseInt(duration),
                    autoRenew,
                    privateKey
                },
                config
            );

            if (response.data.success) {
                setSuccess(response.data.message);
                setModalVisible(false);
                setPrivateKey('');
                setDuration('1');
                setAutoRenew(false);
                fetchMySubscriptions();
                setActiveTab('my-subscriptions');

                // Başarı mesajını temizle
                setTimeout(() => setSuccess(''), 5000);
            }
        } catch (error) {
            console.error('Abonelik oluşturma hatası:', error);
            setError(error.response?.data?.message || 'Abonelik oluşturulamadı');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleCancelSubscription = async (subscriptionId) => {
        if (!window.confirm('Bu aboneliği iptal etmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`
                }
            };

            const response = await axios.post(
                `http://localhost:5000/api/subscriptions/${subscriptionId}/cancel`,
                { reason: 'Kullanıcı tarafından iptal edildi' },
                config
            );

            if (response.data.success) {
                setSuccess('Abonelik iptal edildi');
                fetchMySubscriptions();
                setTimeout(() => setSuccess(''), 5000);
            }
        } catch (error) {
            console.error('Abonelik iptal hatası:', error);
            setError(error.response?.data?.message || 'Abonelik iptal edilemedi');
        }
    };

    const toggleAutoRenew = async (subscriptionId) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`
                }
            };

            const response = await axios.patch(
                `http://localhost:5000/api/subscriptions/${subscriptionId}/auto-renew`,
                {},
                config
            );

            if (response.data.success) {
                setSuccess(response.data.message);
                fetchMySubscriptions();
                setTimeout(() => setSuccess(''), 5000);
            }
        } catch (error) {
            console.error('Otomatik yenileme hatası:', error);
            setError(error.response?.data?.message || 'İşlem başarısız');
        }
    };

    const renderPlanCard = (planId, plan) => {
        const hasActiveSubscription = mySubscriptions.some(
            sub => sub.serviceId === planId && sub.isActive
        );

        return (
            <Col md={4} key={planId} className="mb-4">
                <Card className={`h-100 ${hasActiveSubscription ? 'border-success' : ''}`}>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{plan.name}</h5>
                        {hasActiveSubscription && (
                            <Badge bg="success">Aktif</Badge>
                        )}
                    </Card.Header>
                    <Card.Body>
                        <h3 className="text-primary mb-3">
                            {plan.monthlyFee} MikroCoin
                            <small className="text-muted">/ay</small>
                        </h3>

                        <ul className="list-unstyled">
                            {plan.features.map((feature, index) => (
                                <li key={index} className="mb-2">
                                    <i className="fas fa-check-circle text-success me-2"></i>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </Card.Body>
                    <Card.Footer>
                        <Button
                            variant={hasActiveSubscription ? "secondary" : "primary"}
                            className="w-100"
                            onClick={() => {
                                if (!hasActiveSubscription) {
                                    setSelectedPlan(planId);
                                    setModalVisible(true);
                                }
                            }}
                            disabled={hasActiveSubscription}
                        >
                            {hasActiveSubscription ? "Aktif Abonelik" : "Abone Ol"}
                        </Button>
                    </Card.Footer>
                </Card>
            </Col>
        );
    };

    const renderSubscriptionCard = (subscription) => {
        const statusColors = {
            ACTIVE: 'success',
            CANCELLED: 'danger',
            EXPIRED: 'warning',
            SUSPENDED: 'warning'
        };

        const statusTexts = {
            ACTIVE: 'Aktif',
            CANCELLED: 'İptal Edildi',
            EXPIRED: 'Süresi Doldu',
            SUSPENDED: 'Askıda'
        };

        return (
            <Col md={6} key={subscription._id} className="mb-4">
                <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{subscription.serviceName}</h5>
                        <Badge bg={statusColors[subscription.status]}>
                            {statusTexts[subscription.status]}
                        </Badge>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col sm={6}>
                                <p className="mb-2">
                                    <strong>Aylık Ücret:</strong> {subscription.monthlyFee} MikroCoin
                                </p>
                                <p className="mb-2">
                                    <strong>Başlangıç:</strong> {new Date(subscription.startDate).toLocaleDateString('tr-TR')}
                                </p>
                                <p className="mb-2">
                                    <strong>Bitiş:</strong> {new Date(subscription.endDate).toLocaleDateString('tr-TR')}
                                </p>
                            </Col>
                            <Col sm={6}>
                                {subscription.isActive && (
                                    <p className="mb-2">
                                        <strong>Kalan Gün:</strong> {subscription.daysRemaining}
                                    </p>
                                )}
                                <p className="mb-2">
                                    <strong>Otomatik Yenileme:</strong>{' '}
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="p-0"
                                        onClick={() => toggleAutoRenew(subscription._id)}
                                        disabled={subscription.status !== 'ACTIVE'}
                                    >
                                        <Badge bg={subscription.autoRenew ? 'success' : 'secondary'}>
                                            {subscription.autoRenew ? 'Açık' : 'Kapalı'}
                                        </Badge>
                                    </Button>
                                </p>
                            </Col>
                        </Row>

                        {subscription.status === 'ACTIVE' && (
                            <div className="mt-3">
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleCancelSubscription(subscription._id)}
                                >
                                    Aboneliği İptal Et
                                </Button>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Col>
        );
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Loader />
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h1 className="mb-4">Abonelik Yönetimi</h1>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
            >
                <Tab eventKey="plans" title="Abonelik Planları">
                    <Row>
                        {Object.entries(plans).map(([planId, plan]) => renderPlanCard(planId, plan))}
                    </Row>
                </Tab>

                <Tab eventKey="my-subscriptions" title="Aboneliklerim">
                    {mySubscriptions.length > 0 ? (
                        <Row>
                            {mySubscriptions.map(subscription => renderSubscriptionCard(subscription))}
                        </Row>
                    ) : (
                        <div className="text-center py-5">
                            <i className="fas fa-inbox fa-4x text-muted mb-3"></i>
                            <p className="text-muted">Henüz aboneliğiniz bulunmuyor</p>
                            <Button variant="primary" onClick={() => setActiveTab('plans')}>
                                Planlara Göz At
                            </Button>
                        </div>
                    )}
                </Tab>
            </Tabs>

            {/* Abonelik Modal */}
            <Modal show={modalVisible} onHide={() => setModalVisible(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {selectedPlan && plans[selectedPlan]?.name} Aboneliği
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubscribe}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Süre (Ay)</Form.Label>
                            <Form.Control
                                type="number"
                                min="1"
                                max="12"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                required
                            />
                            <Form.Text className="text-muted">
                                1 ile 12 ay arası seçebilirsiniz
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Özel Anahtar</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Özel anahtarınızı girin"
                                value={privateKey}
                                onChange={(e) => setPrivateKey(e.target.value)}
                                required
                            />
                            <Form.Text className="text-muted">
                                İşlemi onaylamak için özel anahtarınız gereklidir
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Otomatik yenileme"
                                checked={autoRenew}
                                onChange={(e) => setAutoRenew(e.target.checked)}
                            />
                            <Form.Text className="text-muted">
                                Abonelik bitiminde otomatik olarak yenilensin
                            </Form.Text>
                        </Form.Group>

                        <Alert variant="info">
                            <strong>Toplam Tutar:</strong>{' '}
                            {selectedPlan && duration ?
                                `${plans[selectedPlan].monthlyFee * parseInt(duration || 1)} MikroCoin` :
                                '0 MikroCoin'
                            }
                        </Alert>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setModalVisible(false)}>
                            İptal
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={createLoading}
                        >
                            {createLoading ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                        className="me-2"
                                    />
                                    İşleniyor...
                                </>
                            ) : (
                                'Abone Ol'
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default SubscriptionScreen;