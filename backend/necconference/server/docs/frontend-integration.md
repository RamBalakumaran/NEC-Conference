Frontend integration examples — POST actions to `/conference/track/action`

Use these samples to send action events from your frontend when users login, signup, add/remove cart items, register, pay, or leave without completing payment.

1) Minimal helper (vanilla fetch)

```javascript
async function postAction(actionPayload, token) {
  // actionPayload example: { action: 'login', email: 'a@b.com', details: { name: 'A' } }
  const res = await fetch('/conference/track/action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(actionPayload)
  });
  return res.json();
}
```

2) Examples

- After successful signup (from frontend signup flow):

```javascript
postAction({ action: 'signup', email, details: { name } });
```

- On login success:

```javascript
postAction({ action: 'login', email, details: { name } });
```

- When user adds to cart:

```javascript
postAction({ action: 'cart_add', email, details: { item: { eventId, name }, name } });
```

- When user removes from cart:

```javascript
postAction({ action: 'cart_remove', email, details: { item: { eventId, name }, name } });
```

- When user registers but payment pending (reminder candidate):

```javascript
postAction({ action: 'registered_pending', userId, email, details: { registrationId, name }, amount });
```

- When registration is paid (send confirmation + QR already handled by backend):

```javascript
postAction({ action: 'registered_paid', userId, email, details: { transactionId, name, role }, amount });
```

- When user leaves without paying (treat as failed):

```javascript
postAction({ action: 'left_without_payment', userId, email, details: { registrationId, name } });
```

3) Notes

- The server will attempt to attach a user id if only email is provided.
- You can include `department` and `eventId` fields at top-level to improve admin reporting.
- Protect admin calls with an admin JWT (see `middleware/authAdmin.js`).
