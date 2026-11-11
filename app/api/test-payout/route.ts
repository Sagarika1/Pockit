const MEMBER_EMAIL = "sb-5svzx53843471@personal.example.com";

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
  return data.access_token;
}

export async function GET() {
  const token = await getAccessToken();

  const res = await fetch(`${process.env.PAYPAL_API_BASE}/v1/payments/payouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: `test-${Date.now()}`,
        email_subject: "TripFund test reimbursement",
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: { value: "5.00", currency: "USD" },
          receiver: MEMBER_EMAIL,
          note: "Test reimbursement from TripFund",
          sender_item_id: `item-${Date.now()}`,
        },
      ],
    }),
  });

  const data = await res.json();
  return Response.json({ status: res.status, paypal: data });
}