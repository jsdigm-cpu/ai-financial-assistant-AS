import React from 'react';
import { BusinessInfo, UploadedFileInfo } from '../../types';

interface Props {
  businessInfo: BusinessInfo;
  uploadedFiles: UploadedFileInfo[];
}

const DataSourcesView: React.FC<Props> = ({ businessInfo, uploadedFiles }) => {
  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-color">
        <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-primary">business</span>
          비즈니스 정보
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 bg-surface-subtle rounded-xl border border-border-color">
            <span className="text-xs text-text-muted font-bold uppercase tracking-wider">상호명</span>
            <p className="text-sm font-bold text-text-primary mt-1">{businessInfo.name}</p>
          </div>
          <div className="p-4 bg-surface-subtle rounded-xl border border-border-color">
            <span className="text-xs text-text-muted font-bold uppercase tracking-wider">대표자</span>
            <p className="text-sm font-bold text-text-primary mt-1">{businessInfo.owner}</p>
          </div>
          <div className="p-4 bg-surface-subtle rounded-xl border border-border-color">
            <span className="text-xs text-text-muted font-bold uppercase tracking-wider">업종</span>
            <p className="text-sm font-bold text-text-primary mt-1">{businessInfo.type}</p>
          </div>
          <div className="p-4 bg-surface-subtle rounded-xl border border-border-color">
            <span className="text-xs text-text-muted font-bold uppercase tracking-wider">주요 품목</span>
            <p className="text-sm font-bold text-text-primary mt-1">{businessInfo.items}</p>
          </div>
          <div className="p-4 bg-surface-subtle rounded-xl border border-border-color">
            <span className="text-xs text-text-muted font-bold uppercase tracking-wider">계정 유형</span>
            <p className="text-sm font-bold text-text-primary mt-1">{businessInfo.accountType}</p>
          </div>
          {businessInfo.address && (
            <div className="p-4 bg-surface-subtle rounded-xl border border-border-color">
              <span className="text-xs text-text-muted font-bold uppercase tracking-wider">사업장 주소</span>
              <p className="text-sm font-bold text-text-primary mt-1">{businessInfo.address}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-color">
        <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-primary">description</span>
          업로드된 파일 목록
        </h3>
        <div className="space-y-3">
          {uploadedFiles.length > 0 ? (
            uploadedFiles.map((file, idx) => (
              <div key={`${file.name}-${idx}`} className="flex items-center justify-between p-4 bg-surface-subtle rounded-xl border border-border-color">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
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
              <span className="material-symbols-outlined text-4xl mb-2">cloud_off</span>
              <p>업로드된 파일이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataSourcesView;
