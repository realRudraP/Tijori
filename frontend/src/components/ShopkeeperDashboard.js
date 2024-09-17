import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert } from 'react-bootstrap';
import { ArrowClockwise, CheckCircleFill } from 'react-bootstrap-icons';

function ShopkeeperDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const serverURL = "http://192.168.1.12:6953";
  let es; // Declare EventSource outside of useEffect to ensure single instance

  useEffect(() => {
    fetchTransactions();

    // Create a new EventSource connection
    es = new EventSource(serverURL + '/events', {
      withCredentials: true
    });

    es.onmessage = function(event) {
      const eventData = JSON.parse(event.data);
      
      setTransactions(prevTransactions => [eventData, ...prevTransactions]);
      setNotification({
        nickname: eventData.nickname,
        amount: eventData.amount
      });
      playSound(eventData.amount);
      setTimeout(() => setNotification(null), 7000);
    };

    es.onerror = function() {
      setError('An error occurred with the EventSource connection');
    };

    // Clean up EventSource on component unmount
    return () => {
      es.close();
    };
  }, []); // empty dependency array ensures this effect runs only once

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch(serverURL + '/shopkeeper/transactions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
      } else {
        setError('Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('An error occurred while fetching transactions');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = transactions.reduce((total, transaction) => total + Number(transaction.amount), 0);

  const playSound = (amount) => {
    const audio = new Audio('ka-ching.mp3');
    audio.play();
    
    // Cancel ongoing speech
    window.speechSynthesis.cancel();
    
    const sayThis = new SpeechSynthesisUtterance(`Received ${amount} rupees`);
    window.speechSynthesis.speak(sayThis);
  };

  return (
    <Container fluid className="bg-dark text-light min-vh-100 py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="display-4">Shopkeeper Dashboard</h1>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={fetchTransactions}>
            <ArrowClockwise className="me-2" /> Refresh
          </Button>
        </Col>
      </Row>

      {loading ? (
        <Alert variant="info">Loading transactions...</Alert>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <>
          <Card className="mb-4 bg-primary text-white">
            <Card.Body>
              <Card.Title>Total Amount Received</Card.Title>
              <Card.Text className="display-3">₹{totalAmount.toFixed(2)}</Card.Text>
            </Card.Body>
          </Card>

          <Card className="bg-secondary">
            <Card.Body>
              <Table responsive striped hover variant="dark">
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Payee</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={index}>
                      <td className="text-primary">₹{Number(transaction.amount).toFixed(2)}</td>
                      <td>{transaction.nickname}</td>
                      <td>
                        {new Date(transaction.transaction_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      )}

      {notification && (
        <div className="position-fixed top-0 start-0 end-0 p-3" style={{ zIndex: 1050 }}>
          <Alert 
            variant="primary" 
            onClose={() => setNotification(null)} 
            dismissible
            className="d-flex align-items-center shadow-lg"
          >
            <CheckCircleFill className="flex-shrink-0 me-2 text-success" size={24} />
            <div className="flex-grow-1">
              <Alert.Heading className="mb-1">New Transaction</Alert.Heading>
              <p className="mb-0">
                <strong>{notification.nickname}</strong> paid
              </p>
              <p className="display-4 mb-0 text-success">
                ₹{Number(notification.amount).toFixed(2)}
              </p>
            </div>
          </Alert>
        </div>
      )}
    </Container>
  );
}

export default ShopkeeperDashboard;
