// frontend/src/components/SubscriptionWidget.js
import React, { useEffect, useState } from 'react';
import { Card, Badge, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

const SubscriptionWidget = ({ userInfo }) => {
    const [activeSubscriptions, setActiveSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActiveSubscriptions();
    }, []);

    const fetchActiveSubscriptions = async () => {
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
                // Sadece aktif abonelikleri filtrele
                const active = response.data.subscriptions.filter(sub => sub.isActive);
                setActiveSubscriptions(active);
            }
        } catch (error) {
            console.error('Abonelik bilgisi alınamadı:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className="mb-4">
                <Card.Body className="text-center">
                    <Spinner animation="border" size="sm" />
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="mb-4">
            <Card.Header as="h5">
                <i className="fas fa-crown text-warning me-2"></i>
                Aktif Abonelikler
            </Card.Header>
            <Card.Body>
                {activeSubscriptions.length > 0 ? (
                    <>
                        {activeSubscriptions.map(sub => (
                            <div key={sub._id} className="mb-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="mb-1">{sub.serviceName}</h6>
                                        <small className="text-muted">
                                            {sub.daysRemaining} gün kaldı
                                        </small>
                                    </div>
                                    <Badge bg="success">Aktif</Badge>
                                </div>
                                {sub.autoRenew && (
                                    <small className="text-success">
                                        <i className="fas fa-sync-alt me-1"></i>
                                        Otomatik yenileme açık
                                    </small>
                                )}
                            </div>
                        ))}
                        <div className="d-grid mt-3">
                            <Button variant="outline-primary" size="sm" as={Link} to="/subscriptions">
                                Abonelikleri Yönet
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="text-center">
                        <p className="text-muted mb-3">Aktif aboneliğiniz yok</p>
                        <Button variant="primary" size="sm" as={Link} to="/subscriptions">
                            Planlara Göz At
                        </Button>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default SubscriptionWidget;