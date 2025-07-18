class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectInterval = 5000;
    this.shouldReconnect = true;
    this.messageHandlers = new Map();
  }

  connect(token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = `ws://localhost:8000/ws/bookings/?token=${token}`;
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.shouldReconnect = true;
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message:', data);
      
      // Call registered handlers
      if (this.messageHandlers.has(data.type)) {
        this.messageHandlers.get(data.type)(data);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(token), this.reconnectInterval);
      }
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  acceptBooking(bookingId) {
    this.send({
      action: 'accept_booking',
      booking_id: bookingId
    });
  }

  rejectBooking(bookingId) {
    this.send({
      action: 'reject_booking',
      booking_id: bookingId
    });
  }

  on(eventType, handler) {
    this.messageHandlers.set(eventType, handler);
  }

  off(eventType) {
    this.messageHandlers.delete(eventType);
  }
}

export default new WebSocketService(); 