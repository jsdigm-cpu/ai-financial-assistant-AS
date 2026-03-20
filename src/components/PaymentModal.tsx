import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PendingPdf, requestTossPayment, PDF_PRICE } from '../hooks/usePaymentGate';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pdfInfo: PendingPdf;
}

const REPORT_LABELS: Record<PendingPdf['type'], string> = {
  dashboard: '종합 대시보드 리포트',
  deepdive:  'AI 심층 경영 진단 리포트',
  plan:      '창업 설계 리포트',
  value:     '사업체 가치 평가 리포트',
  exit:      '전략적 마무리 가이드',
};

const PaymentModal: React.FC<Props> = ({ isOpen, onClose, pdfInfo }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await requestTossPayment(pdfInfo);
      // 토스 결제창으로 리다이렉트됨 (이 이후 코드는 실행되지 않음)
    } catch (err: any) {
      setError(err.message || '결제 준비 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* 헤더 */}
            <div className="bg-gradient-to-br from-brand-primary to-indigo-700 p-8 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-4xl text-white">picture_as_pdf</span>
              </div>
              <h2 className="text-2xl font-black mb-1">PDF 리포트 다운로드</h2>
              <p className="text-white/80 text-sm">서비스 유지·고도화를 위한 소정의 기부금이 청구됩니다</p>
            </div>

            {/* 내용 */}
            <div className="p-8">
              {/* 주문 내역 */}
              <div className="bg-surface-subtle rounded-2xl border border-border-color p-5 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-brand-primary text-lg">description</span>
                  </div>
                  <div>
                    <p className="font-bold text-text-primary text-sm">{REPORT_LABELS[pdfInfo.type]}</p>
                    <p className="text-xs text-text-muted mt-0.5">{pdfInfo.businessName}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-border-color">
                  <span className="text-sm font-bold text-text-muted">기부금 (건당)</span>
                  <span className="text-2xl font-black text-brand-primary">
                    {PDF_PRICE.toLocaleString()}원
                  </span>
                </div>
              </div>

              {/* 포함 내용 안내 */}
              <div className="space-y-2 mb-6">
                {[
                  '전문 레이아웃의 고품질 PDF 리포트',
                  '사장님든든 브랜드 헤더 + 상호명 포함',
                  '페이지 번호 및 생성일 자동 삽입',
                  '인쇄·공유에 최적화된 A4 포맷',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-text-muted">
                    <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                    {item}
                  </div>
                ))}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <span className="font-bold">오류: </span>{error}
                </div>
              )}

              {/* 안내 문구 */}
              <p className="text-xs text-text-muted text-center mb-5 leading-relaxed">
                결제는 토스페이먼츠를 통해 안전하게 처리됩니다.<br />
                결제 완료 후 PDF 파일이 자동으로 다운로드됩니다.
              </p>

              {/* 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="flex-1 py-3.5 bg-surface-subtle border border-border-color text-text-muted font-bold rounded-2xl hover:bg-border-color/30 transition-all disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="flex-2 px-8 py-3.5 bg-[#3182f6] hover:bg-[#1b64da] text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                  style={{ minWidth: '160px' }}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      결제 준비 중...
                    </>
                  ) : (
                    <>
                      {/* 토스 로고 느낌의 아이콘 */}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="white"/>
                      </svg>
                      토스로 {PDF_PRICE.toLocaleString()}원 결제
                    </>
                  )}
                </button>
              </div>

              {/* 토스 배지 */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-muted">
                <span className="material-symbols-outlined text-sm text-green-500">lock</span>
                토스페이먼츠 보안 결제 · 언제든 영수증 발급 가능
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
