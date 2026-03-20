/**
 * Vercel Serverless Function: 토스페이먼츠 결제 확인
 * POST /api/toss/confirm
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentKey, orderId, amount } = req.body || {};

  if (!paymentKey || !orderId || !amount) {
    return res.status(400).json({ success: false, error: '필수 파라미터가 누락되었습니다.' });
  }

  // 금액 검증: PDF 1건 = 1,000원
  if (Number(amount) !== 1000) {
    return res.status(400).json({ success: false, error: '결제 금액이 올바르지 않습니다.' });
  }

  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    // 키 미설정 시 테스트 모드로 성공 처리
    console.warn('[Toss] TOSS_SECRET_KEY 미설정 - 테스트 모드로 결제 확인을 건너뜁니다.');
    return res.status(200).json({ success: true, message: 'test_mode' });
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
      return res.status(200).json({ success: true, data });
    } else {
      const errorData = await response.json();
      console.error('[Toss] 결제 확인 실패:', errorData);
      return res.status(400).json({ success: false, error: errorData.message || '결제 확인에 실패했습니다.' });
    }
  } catch (error) {
    console.error('[Toss] 서버 오류:', error);
    return res.status(500).json({ success: false, error: '결제 서버 오류가 발생했습니다.' });
  }
}
