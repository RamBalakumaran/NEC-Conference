const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const data = {
      userData: { email: 'test@a.com', name: 'Tester' },
      selectedEvents: [{ eventId: 'evt1', name: 'DemoEvent' }],
      amount: 10
    };

    const res = await fetch('http://localhost:5200/conference/user/cart/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response body:\n', text);
  } catch (err) {
    console.error('Request failed:', err);
    process.exitCode = 1;
  }
})();
