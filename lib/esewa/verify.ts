import crypto from 'crypto';
import { ESEWA_VERIFY_URL, ESEWA_SECRET_KEY, ESEWA_MERCHANT_CODE } from './config';

export interface EsewaVerificationResult {
  verified: boolean;
  status: string;
  refId?: string;
  totalAmount?: string | number;
  productCode?: string;
  raw?: any;
}

function generateVerificationSignature(transactionUuid: string) {
  const message = `transaction_uuid=${transactionUuid}`;
  const hmac = crypto.createHmac('sha256', ESEWA_SECRET_KEY);
  hmac.update(message);
  return hmac.digest('base64');
}

/**
 * Verify a transaction with eSewa transaction status endpoint.
 * Returns a normalized result similar to the API route.
 */
export async function verifyTransaction(
  transactionUuid: string,
  productCode?: string,
  totalAmount?: string | number
): Promise<EsewaVerificationResult> {
  if (!ESEWA_SECRET_KEY) {
    throw new Error('ESEWA_SECRET_KEY not configured');
  }

  const normalizedAmount = totalAmount ? Number(totalAmount) : undefined;
  const prod = productCode || ESEWA_MERCHANT_CODE;

  const verifyUrl = `${ESEWA_VERIFY_URL}?product_code=${prod}${
    normalizedAmount ? `&total_amount=${normalizedAmount}` : ''
  }&transaction_uuid=${transactionUuid}`;

  const signature = generateVerificationSignature(transactionUuid);

  const res = await fetch(verifyUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // signature header kept for parity if needed by upstream
      Authorization: `Signature ${signature}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`eSewa verify HTTP ${res.status}: ${text}`);
  }

  const data = await res.json().catch(() => ({}));

  const status = data?.status || String(data || '').toUpperCase() || 'UNKNOWN';

  return {
    verified: status === 'COMPLETE',
    status,
    refId: data?.ref_id,
    totalAmount: data?.total_amount,
    productCode: data?.product_code,
    raw: data,
  };
}

export default verifyTransaction;
