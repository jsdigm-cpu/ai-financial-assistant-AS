import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * HTMLElement를 캡처하여 PDF로 내보냅니다.
 * @param element - 캡처할 HTML 요소
 * @param title - PDF 내 표시 제목
 * @param businessName - 사업자명
 * @param filename - 저장 파일명 (확장자 제외)
 */
export const exportViewToPdf = async (
  element: HTMLElement,
  title: string,
  businessName: string,
  filename: string
): Promise<void> => {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  // 헤더 추가
  pdf.setFillColor(26, 26, 46); // brand-primary
  pdf.rect(0, 0, pdfWidth, 14, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`사장님 든든 | ${businessName} | ${title}`, 10, 9);
  pdf.setFontSize(8);
  pdf.text(new Date().toLocaleDateString('ko-KR'), pdfWidth - 10, 9, { align: 'right' });

  const contentStartY = 16;
  const availableHeight = pdfHeight - contentStartY - 10;

  if (imgHeight <= availableHeight) {
    pdf.addImage(imgData, 'PNG', 0, contentStartY, imgWidth, imgHeight);
  } else {
    // 여러 페이지로 분할
    let yOffset = 0;
    let isFirstPage = true;

    while (yOffset < imgHeight) {
      if (!isFirstPage) {
        pdf.addPage();
        // 이후 페이지 헤더
        pdf.setFillColor(26, 26, 46);
        pdf.rect(0, 0, pdfWidth, 14, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`사장님 든든 | ${businessName} | ${title}`, 10, 9);
        pdf.text(new Date().toLocaleDateString('ko-KR'), pdfWidth - 10, 9, { align: 'right' });
      }

      const sliceHeight = Math.min(availableHeight, imgHeight - yOffset);
      const sliceCanvas = document.createElement('canvas');
      const scale = canvas.width / imgWidth;
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeight * scale;

      const ctx = sliceCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(canvas, 0, yOffset * scale, canvas.width, sliceHeight * scale, 0, 0, canvas.width, sliceHeight * scale);
      }

      pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 0, contentStartY, imgWidth, sliceHeight);
      yOffset += availableHeight;
      isFirstPage = false;
    }
  }

  pdf.save(`${filename}.pdf`);
};

export const exportAIReportToPdf = async (
  element: HTMLElement,
  businessName: string,
  filename: string
): Promise<void> => {
  return exportViewToPdf(element, 'AI 분석 리포트', businessName, filename);
};
