import * as XLSX from 'xlsx';
import { Transaction, ProcessedData } from '../types';

/**
 * 은행 엑셀/CSV 파일을 파싱하여 Transaction 배열로 변환합니다.
 */
export const parseFile = async (file: File, title: string): Promise<ProcessedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // 모든 데이터를 2차원 배열로 변환
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

        if (jsonData.length < 2) {
          resolve({ transactions: [], errors: [`${file.name}: 데이터가 부족하거나 비어있는 파일입니다.`] });
          return;
        }

        // 헤더 행 찾기 (날짜/거래일 키워드가 있는 행)
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
          const row = jsonData[i];
          if (row.some(cell => {
            const s = String(cell);
            return s.includes('날짜') || s.includes('거래일') || s.includes('거래일자');
          })) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          // 헤더를 못 찾으면 첫 번째 행을 헤더로 가정
          headerRowIndex = 0;
        }

        const headers = jsonData[headerRowIndex].map(h => String(h).trim());
        const rows = jsonData.slice(headerRowIndex + 1);

        // 주요 컬럼 인덱스 찾기
        const dateIdx = headers.findIndex(h => h.includes('날짜') || h.includes('거래일'));
        const descIdx = headers.findIndex(h => h.includes('적요') || h.includes('내용') || h.includes('거래내용') || h.includes('상호') || h.includes('기재사항'));
        const debitIdx = headers.findIndex(h => h.includes('출금') || h.includes('지급') || h.includes('보내신'));
        const creditIdx = headers.findIndex(h => h.includes('입금') || h.includes('맡기신') || h.includes('받으신'));
        const balanceIdx = headers.findIndex(h => h.includes('잔액'));
        const bankIdx = headers.findIndex(h => h.includes('거래점') || h.includes('취급점') || h.includes('은행') || h.includes('메모'));

        const transactions: Transaction[] = [];
        const errors: string[] = [];

        rows.forEach((row, idx) => {
          // 날짜가 없으면 건너뜀
          if (dateIdx === -1 || !row[dateIdx] || String(row[dateIdx]).trim() === '') return;

          try {
            const dateValue = row[dateIdx];
            let date: Date;
            
            if (dateValue instanceof Date) {
              date = dateValue;
            } else {
              // 문자열 날짜 처리 (예: 2024.01.01, 2024-01-01, 2024/01/01)
              const dateStr = String(dateValue).replace(/\./g, '-');
              date = new Date(dateStr);
            }

            if (isNaN(date.getTime())) return;

            // 금액 처리 (콤마 제거 등)
            const parseAmount = (val: any) => {
              if (val === undefined || val === null || val === '') return 0;
              const s = String(val).replace(/[^0-9.-]+/g, "");
              const n = parseFloat(s);
              return isNaN(n) ? 0 : n;
            };

            const debit = parseAmount(row[debitIdx]);
            const credit = parseAmount(row[creditIdx]);
            const balance = parseAmount(row[balanceIdx]);

            // 입금/출금이 모두 0이면 의미 없는 행으로 간주할 수 있으나 일단 포함
            if (debit === 0 && credit === 0 && balance === 0 && !row[descIdx]) return;

            transactions.push({
              id: `${file.name}-${idx}-${date.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
              date,
              description: String(row[descIdx] || '').trim(),
              debit,
              credit,
              balance,
              bank: String(row[bankIdx] || title).trim(),
              category: '미분류'
            });
          } catch (err) {
            errors.push(`${file.name}: ${idx + headerRowIndex + 2}행 파싱 중 오류 발생`);
          }
        });

        if (transactions.length === 0) {
          errors.push(`${file.name}: 유효한 거래 내역을 찾을 수 없습니다. 컬럼명을 확인해주세요.`);
        }

        resolve({ transactions, errors });
      } catch (err) {
        console.error('File parse error:', err);
        resolve({ transactions: [], errors: [`${file.name}: 파일을 읽는 중 오류가 발생했습니다. (${err instanceof Error ? err.message : '알 수 없는 오류'})`] });
      }
    };

    reader.onerror = () => {
      resolve({ transactions: [], errors: [`${file.name}: 파일을 읽지 못했습니다.`] });
    };

    reader.readAsArrayBuffer(file);
  });
};
