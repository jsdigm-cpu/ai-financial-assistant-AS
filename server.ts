import express from 'express';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // ── Stripe 결제 (기존 유지) ──────────────────────────────────
  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const { reportType, price } = req.body;
      const stripe = getStripe();

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'krw',
              product_data: {
                name: reportType === 'premium' ? '프리미엄 리포트' : '권리금 인증서',
                description: '사장님 든든 AI 경영 분석 리포트',
              },
              unit_amount: price,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/?success=true`,
        cancel_url: `${req.protocol}://${req.get('host')}/?canceled=true`,
      });

      res.json({ id: session.id });
    } catch (error: any) {
      console.error('Stripe error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ── 토스페이먼츠 결제 확인 ────────────────────────────────────
  app.post('/api/toss/confirm', async (req, res) => {
    const { paymentKey, orderId, amount } = req.body;

    if (!paymentKey || !orderId || !amount) {
      res.status(400).json({ success: false, error: '필수 파라미터가 누락되었습니다.' });
      return;
    }

    // 금액 검증: PDF 1건 = 1,000원
    if (Number(amount) !== 1000) {
      res.status(400).json({ success: false, error: '결제 금액이 올바르지 않습니다.' });
      return;
    }

    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      // 테스트 환경 또는 키 미설정 시 성공으로 처리 (개발용)
      console.warn('[Toss] TOSS_SECRET_KEY 미설정 - 테스트 모드로 결제 확인을 건너뜁니다.');
      res.json({ success: true, message: 'test_mode' });
      return;
    }

    try {
      const encoded = Buffer.from(`${secretKey}:`).toString('base64');
      const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${encoded}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[Toss] 결제 성공 - orderId: ${orderId}, amount: ${amount}원`);
        res.json({ success: true, data });
      } else {
        const errorData = await response.json();
        console.error('[Toss] 결제 확인 실패:', errorData);
        res.status(400).json({ success: false, error: errorData.message || '결제 확인에 실패했습니다.' });
      }
    } catch (error: any) {
      console.error('[Toss] 서버 오류:', error);
      res.status(500).json({ success: false, error: '결제 서버 오류가 발생했습니다.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
