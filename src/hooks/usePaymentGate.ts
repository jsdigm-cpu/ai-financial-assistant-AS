/**
 * 토스페이먼츠 결제 게이트 훅
 * - PDF 다운로드 전 1,000원 결제 처리
 * - 결제 성공 후 sessionStorage에 토큰 저장, PDF 자동 실행
 */

export const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
export const PDF_PRICE = 1000; // 1,000원

export interface PendingPdf {
  type: 'dashboard' | 'deepdive' | 'plan' | 'value' | 'exit';
  orderId: string;
  businessName: string;
  timestamp: number;
}

const PENDING_KEY = 'sajangnim_pdf_pending';
const PAID_KEY    = 'sajangnim_pdf_paid';

/** 결제 전 대기 중인 PDF 정보를 sessionStorage에 저장 */
export function savePendingPdf(info: PendingPdf) {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(info));
}

/** 대기 중인 PDF 정보 조회 */
export function getPendingPdf(): PendingPdf | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** 결제 완료 후 PDF 다운로드 가능 토큰 저장 */
export function savePaidToken(orderId: string) {
  sessionStorage.setItem(PAID_KEY, JSON.stringify({ orderId, ts: Date.now() }));
}

/** 유효한 결제 토큰이 있는지 확인 후 소비 (1회용) */
export function consumePaidToken(orderId: string): boolean {
  try {
    const raw = sessionStorage.getItem(PAID_KEY);
    if (!raw) return false;
    const token = JSON.parse(raw);
    if (token.orderId !== orderId) return false;
    // 5분 이내 토큰만 유효
    if (Date.now() - token.ts > 5 * 60 * 1000) {
      sessionStorage.removeItem(PAID_KEY);
      return false;
    }
    sessionStorage.removeItem(PAID_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    return true;
  } catch {
    return false;
  }
}

/** orderId 생성 (영문+숫자, 6~64자) */
export function generateOrderId(type: string): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PDF-${type.toUpperCase()}-${rand}-${Date.now()}`;
}

/**
 * 토스페이먼츠 결제 요청
 * 결제 성공 시 successUrl로 리다이렉트됩니다.
 */
export async function requestTossPayment(info: PendingPdf): Promise<void> {
  if (typeof TossPayments === 'undefined') {
    throw new Error('토스페이먼츠 SDK가 로드되지 않았습니다. 인터넷 연결을 확인해주세요.');
  }

  savePendingPdf(info);

  const toss = TossPayments(TOSS_CLIENT_KEY);
  const baseUrl = window.location.origin + window.location.pathname;

  await toss.requestPayment('카드', {
    amount: PDF_PRICE,
    orderId: info.orderId,
    orderName: `사장님든든 PDF 리포트 (${info.businessName})`,
    customerName: info.businessName,
    successUrl: `${baseUrl}?payment=success&orderId=${info.orderId}&amount=${PDF_PRICE}`,
    failUrl: `${baseUrl}?payment=fail&orderId=${info.orderId}`,
  });
}

/**
 * 서버에 결제 확인 요청
 */
export async function confirmTossPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<boolean> {
  try {
    const res = await fetch('/api/toss/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}
