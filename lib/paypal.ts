async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");
  const res = await fetch(`${process.env.PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token as string;
}

export async function sendPayout(email: string, amount: number, note: string) {
  const token = await getAccessToken();
  const res = await fetch(`${process.env.PAYPAL_API_BASE}/v1/payments/payouts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: `pockit-${Date.now()}`,
        email_subject: "Your Pockit reimbursement",
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: { value: amount.toFixed(2), currency: "USD" },
          receiver: email,
          note,
          sender_item_id: `item-${Date.now()}`,
        },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data.batch_header.payout_batch_id as string;
}