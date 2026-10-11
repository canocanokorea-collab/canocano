/**
 * Toss Payments Server API Client
 */

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R'; // 공식 토스 테스트 키

export async function confirmTossPayment(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
}) {
  const secretKey = process.env.TOSS_SECRET_KEY || TOSS_SECRET_KEY;
  const basicAuth = Buffer.from(`${secretKey}:`).toString('base64');

  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentKey: params.paymentKey,
      orderId: params.orderId,
      amount: params.amount,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `토스 결제 승인 실패 (${response.status})`);
  }

  return data;
}

export async function cancelTossPayment(params: {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number;
}) {
  const secretKey = process.env.TOSS_SECRET_KEY || TOSS_SECRET_KEY;
  const basicAuth = Buffer.from(`${secretKey}:`).toString('base64');

  const response = await fetch(`https://api.tosspayments.com/v1/payments/${params.paymentKey}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cancelReason: params.cancelReason,
      cancelAmount: params.cancelAmount,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `토스 결제 취소 실패 (${response.status})`);
  }

  return data;
}
