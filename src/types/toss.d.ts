// 토스페이먼츠 SDK 타입 선언
interface TossPaymentsInstance {
  requestPayment(
    method: '카드' | '가상계좌' | '계좌이체' | '휴대폰' | '상품권',
    options: TossPaymentRequestOptions
  ): Promise<void>;
}

interface TossPaymentRequestOptions {
  amount: number;
  orderId: string;
  orderName: string;
  customerName?: string;
  customerEmail?: string;
  successUrl: string;
  failUrl: string;
  useEscrow?: boolean;
  taxFreeAmount?: number;
}

declare function TossPayments(clientKey: string): TossPaymentsInstance;
