import * as XLSX from 'xlsx';
import { ProcessedData, Transaction } from '../types';

export const parseFile = async (file: File, title: string): Promise<ProcessedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        const transactions: Transaction[] = [];
        const errors: string[] = [];

        // Find header row
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(json.length, 20); i++) {
          const row = json[i];
          if (row && row.some(cell => typeof cell === 'string' && (cell.includes('일시') || cell.includes('날짜') || cell.includes('거래일')))) {
            headerRowIdx = i;
            break;
          }
        }

        if (headerRowIdx === -1) {
          errors.push(`[${title}] 헤더 행을 찾을 수 없습니다.`);
          return resolve({ transactions, errors });
        }

        const headers = json[headerRowIdx].map(h => String(h || '').trim());
        const dateIdx = headers.findIndex(h => h.includes('일시') || h.includes('날짜') || h.includes('거래일'));
        const descIdx = headers.findIndex(h => h.includes('적요') || h.includes('내용') || h.includes('거래내용'));
        const depositIdx = headers.findIndex(h => h.includes('입금') || h.includes('맡기신'));
        const withdrawIdx = headers.findIndex(h => h.includes('출금') || h.includes('찾으신'));
        const balanceIdx = headers.findIndex(h => h.includes('잔액'));

        for (let i = headerRowIdx + 1; i < json.length; i++) {
          const row = json[i];
          if (!row || row.length === 0) continue;

          const dateStr = row[dateIdx];
          if (!dateStr) continue;

          const date = new Date(dateStr);
          if (isNaN(date.getTime())) continue;

          const desc = String(row[descIdx] || '');
          const deposit = Number(String(row[depositIdx] || '').replace(/,/g, '')) || 0;
          const withdraw = Number(String(row[withdrawIdx] || '').replace(/,/g, '')) || 0;
          const balance = Number(String(row[balanceIdx] || '').replace(/,/g, '')) || 0;

          transactions.push({
            id: Math.random().toString(36).substring(2, 9),
            date,
            description: desc,
            credit: deposit,
            debit: withdraw,
            balance,
            bank: title,
            category: '미분류'
          });
        }

        resolve({ transactions, errors });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};
