/**
 * 사장님든든 - 전문 PDF 리포트 생성기
 *
 * jsPDF(헤더/푸터) + html2canvas(콘텐츠) 하이브리드 방식
 * - 브랜드 헤더: 로고 텍스트 + 사업체명 + 리포트 제목
 * - 콘텐츠: html2canvas로 고해상도 캡처
 * - 푸터: 페이지 번호 + 생성일 + 저작권
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ─── 브랜드 컬러 (RGB) ─────────────────────────────────────────
const COLOR = {
  primary:   [26,  26,  46]  as [number, number, number],
  gold:      [200, 149,  58]  as [number, number, number],
  accent:    [49, 130, 246]  as [number, number, number],
  white:     [255, 255, 255]  as [number, number, number],
  gray:      [120, 120, 138]  as [number, number, number],
  lightGray: [240, 240, 245]  as [number, number, number],
  border:    [220, 220, 230]  as [number, number, number],
  text:      [30,  30,  50]   as [number, number, number],
};

// ─── A4 치수 (mm) ─────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const HEADER_H = 22;   // 헤더 높이
const FOOTER_H = 12;   // 푸터 높이
const MARGIN_X = 12;   // 좌우 여백
const CONTENT_Y = HEADER_H + 4;  // 콘텐츠 시작 Y
const CONTENT_H = PAGE_H - CONTENT_Y - FOOTER_H - 4;  // 콘텐츠 영역 높이
const CONTENT_W = PAGE_W - MARGIN_X * 2;

/** 헤더 그리기 */
function drawHeader(pdf: jsPDF, businessName: string, reportTitle: string, pageNum: number) {
  // 배경 그라데이션 효과 (단색으로 대체)
  pdf.setFillColor(...COLOR.primary);
  pdf.rect(0, 0, PAGE_W, HEADER_H, 'F');

  // 좌측: 로고 + 서비스명
  pdf.setTextColor(...COLOR.gold);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('사장님든든', MARGIN_X, 8.5);

  // 구분선
  pdf.setDrawColor(...COLOR.gold);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN_X + 24, 5, MARGIN_X + 24, 16);

  // 리포트 제목
  pdf.setTextColor(...COLOR.white);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(reportTitle, MARGIN_X + 27, 8.5);

  // 우측: 사업체명
  pdf.setTextColor(200, 200, 220);
  pdf.setFontSize(8);
  pdf.text(businessName, PAGE_W - MARGIN_X, 8.5, { align: 'right' });

  // 하단 구분선
  pdf.setDrawColor(...COLOR.gold);
  pdf.setLineWidth(0.5);
  pdf.line(0, HEADER_H, PAGE_W, HEADER_H);

  // 2번째 줄: 생성일 + 페이지 (헤더 내)
  pdf.setTextColor(180, 180, 200);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  pdf.text(`생성일: ${today}`, MARGIN_X, 17);
  if (pageNum > 0) {
    pdf.text(`Page ${pageNum}`, PAGE_W - MARGIN_X, 17, { align: 'right' });
  }
}

/** 푸터 그리기 */
function drawFooter(pdf: jsPDF, pageNum: number, totalPages: number, businessName: string) {
  const y = PAGE_H - FOOTER_H;

  pdf.setDrawColor(...COLOR.border);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);

  pdf.setTextColor(...COLOR.gray);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');

  // 좌측: 면책 문구
  pdf.text('본 리포트는 사장님든든 AI 분석 자료로, 전문 컨설팅을 대체하지 않습니다.', MARGIN_X, y + 5);

  // 우측: 페이지 번호
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${pageNum} / ${totalPages}`, PAGE_W - MARGIN_X, y + 5, { align: 'right' });
}

/** 섹션 타이틀 그리기 (페이지 상단 위치 결정용) */
function drawSectionBadge(pdf: jsPDF, title: string, y: number) {
  pdf.setFillColor(...COLOR.lightGray);
  pdf.roundedRect(MARGIN_X, y, CONTENT_W, 7, 1, 1, 'F');
  pdf.setTextColor(...COLOR.primary);
  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, MARGIN_X + 4, y + 5);
}

/**
 * HTMLElement를 캡처하여 여러 장의 전문 PDF로 내보냅니다.
 *
 * @param element     캡처할 HTML 요소
 * @param reportTitle 리포트 제목 (헤더에 표시)
 * @param businessName 사업체명 (헤더 + 파일명에 사용)
 * @param filename    저장 파일명 (확장자 제외)
 */
export const exportViewToPdf = async (
  element: HTMLElement,
  reportTitle: string,
  businessName: string,
  filename: string
): Promise<void> => {

  // ── 1. 콘텐츠 캡처 (html2canvas) ─────────────────────────────
  const canvas = await html2canvas(element, {
    scale: 2.5,            // 고해상도 (A4 출력 최적화)
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    removeContainer: true,
  });

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // ── 2. 페이지 분할 계산 ───────────────────────────────────────
  // 콘텐츠 영역 (mm) → 픽셀 변환
  const pxPerMm = canvas.width / CONTENT_W;
  const contentHeightPx = CONTENT_H * pxPerMm;
  const totalPages = Math.ceil(canvas.height / contentHeightPx);

  // ── 3. 각 페이지 생성 ─────────────────────────────────────────
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (pageNum > 1) pdf.addPage();

    // 헤더 그리기
    drawHeader(pdf, businessName, reportTitle, pageNum);

    // 콘텐츠 슬라이스 캡처
    const sliceStartY = (pageNum - 1) * contentHeightPx;
    const sliceH = Math.min(contentHeightPx, canvas.height - sliceStartY);

    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width  = canvas.width;
    sliceCanvas.height = Math.round(sliceH);

    const ctx = sliceCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(canvas, 0, -sliceStartY);
    }

    const sliceImg = sliceCanvas.toDataURL('image/jpeg', 0.92);
    const sliceHeightMm = sliceH / pxPerMm;

    pdf.addImage(
      sliceImg, 'JPEG',
      MARGIN_X, CONTENT_Y,
      CONTENT_W, Math.min(sliceHeightMm, CONTENT_H)
    );

    // 푸터 그리기
    drawFooter(pdf, pageNum, totalPages, businessName);
  }

  // ── 4. PDF 저장 ───────────────────────────────────────────────
  const safeFilename = filename.replace(/[^\w\s가-힣-]/g, '').trim() || 'report';
  pdf.save(`${safeFilename}.pdf`);
};

/**
 * AI 리포트 전용 래퍼 (reportTitle 기본값 적용)
 */
export const exportAIReportToPdf = async (
  element: HTMLElement,
  businessName: string,
  filename: string
): Promise<void> => {
  return exportViewToPdf(element, 'AI 경영 분석 리포트', businessName, filename);
};
