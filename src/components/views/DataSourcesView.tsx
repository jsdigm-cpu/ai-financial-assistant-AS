import React, { useMemo } from 'react';
import { BusinessInfo, UploadedFileInfo, Transaction, Category } from '../../types';
import { CATEGORY_MAP } from '../../constants';

interface Props {
  businessInfo: BusinessInfo;
  uploadedFiles: UploadedFileInfo[];
  transactions?: Transaction[];
  categories?: Category[];
}

const fmt = (v: number) => {
  if (Math.abs(v) >= 100000000) return (v / 100000000).toFixed(1) + '억원';
  if (Math.abs(v) >= 10000) return (v / 10000).toFixed(0) + '만원';
  return v.toLocaleString('ko-KR') + '원';
};

const DataSourcesView: React.FC<Props> = ({ businessInfo, uploadedFiles, transactions = [], categories = [] }) => {
  const stats = useMemo(() => {
    const totalTx = transactions.length;
    const totalIncome = transactions.reduce((s, t) => s + t.credit, 0);
    const totalExpense = transactions.reduce((s, t) => s + t.debit, 0);
    const unclassified = transactions.filter(t => t.category === '기타매출' || t.category === '기타사업비').length;

    const dateRange = totalTx > 0 ? {
      from: transactions.reduce((min, t) => t.date < min ? t.date : min, transactions[0].date),
      to: transactions.reduce((max, t) => t.date > max ? t.date : max, transactions[0].date),
    } : null;

    const catDist: Record<string, number> = {};
    transactions.forEach(t => {
      catDist[t.category] = (catDist[t.category] || 0) + 1;
    });

    const topCats = Object.entries(catDist)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { totalTx, totalIncome, totalExpense, unclassified, dateRange, topCats };
  }, [transactions]);

  const classificationRate = stats.totalTx > 0
    ? Math.round((1 - stats.unclassified / stats.totalTx) * 100)
    : 0;

  const infoItems = [
    { label: '상호명', value: businessInfo.name, icon: 'store' },
    { label: '대표자', value: businessInfo.owner, icon: 'person' },
    { label: '업종', value: businessInfo.type, icon: 'category' },
    { label: '주요 품목', value: businessInfo.items, icon: 'inventory' },
    { label: '계정 유형', value: businessInfo.accountType, icon: 'account_balance' },
    ...(businessInfo.address ? [{ label: '사업장 주소', value: businessInfo.address, icon: 'location_on' }] : []),
    ...(businessInfo.rawMaterialSuppliers ? [{ label: '원재료 공급처', value: businessInfo.rawMaterialSuppliers, icon: 'local_shipping' }] : []),
    ...(businessInfo.onlinePlatforms ? [{ label: '온라인 플랫폼', value: businessInfo.onlinePlatforms, icon: 'devices' }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* 분석 현황 요약 */}
      {stats.totalTx > 0 && (
        <div className="bg-white rounded-2xl border border-border-color p-6">
          <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-primary">analytics</span>
            데이터 분석 현황
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-brand-primary/5 rounded-xl border border-brand-primary/10">
              <p className="text-xs font-bold text-text-muted">총 거래 건수</p>
              <p className="text-2xl font-black text-brand-primary">{stats.totalTx.toLocaleString()}건</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs font-bold text-text-muted">총 입금</p>
              <p className="text-2xl font-black text-emerald-600">{fmt(stats.totalIncome)}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <p className="text-xs font-bold text-text-muted">총 출금</p>
              <p className="text-2xl font-black text-red-600">{fmt(stats.totalExpense)}</p>
            </div>
            <div className="p-4 bg-surface-subtle rounded-xl border border-border-color">
              <p className="text-xs font-bold text-text-muted">순 손익</p>
              <p className={`text-2xl font-black ${stats.totalIncome - stats.totalExpense >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {fmt(stats.totalIncome - stats.totalExpense)}
              </p>
            </div>
          </div>

          {/* 분류 완성도 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-bold text-text-primary">분류 완성도</span>
                <span className={`text-sm font-black ${classificationRate >= 90 ? 'text-emerald-600' : classificationRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                  {classificationRate}%
                </span>
              </div>
              <div className="h-3 bg-surface-subtle rounded-full overflow-hidden border border-border-color">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${classificationRate >= 90 ? 'bg-emerald-500' : classificationRate >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${classificationRate}%` }}
                />
              </div>
              {stats.unclassified > 0 && (
                <p className="text-xs text-amber-600 mt-1 font-medium">
                  미분류 {stats.unclassified}건이 있습니다. 카테고리 관리에서 분류하세요.
                </p>
              )}
            </div>

            {stats.dateRange && (
              <div className="p-3 bg-surface-subtle rounded-xl border border-border-color">
                <p className="text-xs font-bold text-text-muted mb-1">데이터 기간</p>
                <p className="text-sm font-bold text-text-primary">
                  {stats.dateRange.from.toLocaleDateString('ko-KR')} ~
                </p>
                <p className="text-sm font-bold text-text-primary">
                  {stats.dateRange.to.toLocaleDateString('ko-KR')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 비즈니스 정보 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-color">
        <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-primary">business</span>
          비즈니스 정보
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {infoItems.map(item => (
            <div key={item.label} className="p-4 bg-surface-subtle rounded-xl border border-border-color">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-brand-primary/60 text-sm">{item.icon}</span>
                <span className="text-xs text-text-muted font-bold uppercase tracking-wider">{item.label}</span>
              </div>
              <p className="text-sm font-bold text-text-primary">{item.value || '-'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 업로드된 파일 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-color">
        <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-primary">description</span>
          업로드된 파일 목록
          <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">{uploadedFiles.length}개</span>
        </h3>
        <div className="space-y-3">
          {uploadedFiles.length > 0 ? (
            uploadedFiles.map((file, idx) => (
              <div key={`${file.name}-${idx}`} className="flex items-center justify-between p-4 bg-surface-subtle rounded-xl border border-border-color">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-xl">
                    <span className="material-symbols-outlined text-emerald-600">table_view</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{file.title || file.name}</p>
                    <p className="text-xs text-text-muted">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100 uppercase tracking-wider">
                  분석 완료
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-text-muted">
              <span className="material-symbols-outlined text-4xl mb-2 block">cloud_off</span>
              <p className="text-sm">업로드된 파일이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* 상위 카테고리 분포 */}
      {stats.topCats.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-color">
          <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-primary">bar_chart</span>
            카테고리별 거래 건수 (상위 5개)
          </h3>
          <div className="space-y-3">
            {stats.topCats.map(([catName, count], i) => {
              const pct = Math.round(count / stats.totalTx * 100);
              const type = CATEGORY_MAP[catName]?.type;
              const barColor = type?.includes('income') ? 'bg-emerald-500' : 'bg-red-500';
              return (
                <div key={catName} className="flex items-center gap-3">
                  <span className="w-4 text-xs font-bold text-text-muted text-right">{i + 1}</span>
                  <span className="text-sm font-medium text-text-primary w-28 truncate">{catName}</span>
                  <div className="flex-1 h-5 bg-surface-subtle rounded-full overflow-hidden border border-border-color/50">
                    <div className={`h-full rounded-full ${barColor} transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-text-muted w-16 text-right">{count}건 ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSourcesView;
