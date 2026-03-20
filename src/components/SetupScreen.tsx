import React, { useState, useCallback, useEffect } from 'react';
import { ProcessedData, BusinessInfo, BusinessType, AccountType, BusinessScale, UploadedFileInfo } from '../types';
import { parseFile } from '../services/parser';
import { Transaction } from '../types';
import { BUSINESS_PRESETS } from '../constants';
import { setGeminiApiKey, hasEnvApiKey, getEffectiveApiKey } from '../services/geminiService';

interface UploadedFile {
  file: File;
  title: string;
}

interface Props {
  onDataProcessed: (data: ProcessedData, info: BusinessInfo, files: UploadedFileInfo[]) => void;
  onGoBack?: () => void;
  savedSession?: { businessInfo: BusinessInfo; savedAt: string; transactions: any[] } | null;
  onRestoreSession?: () => void;
  onImportSession?: (data: any) => void;
}

const STORAGE_KEY_API = 'ai_finance_gemini_api_key';
const STORAGE_KEY_BIZ = 'ai_finance_last_business_info';

const SetupScreen: React.FC<Props> = ({ onDataProcessed, onGoBack, savedSession, onRestoreSession, onImportSession }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyGuide, setShowApiKeyGuide] = useState(false);
  const envApiKeyAvailable = hasEnvApiKey();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [accountType, setAccountType] = useState<string>(AccountType.SOLE_PROPRIETOR);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: '',
    owner: '',
    type: BusinessType.RESTAURANT_GENERAL,
    items: '',
    businessScale: '소규모',
    address: '',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '',
    otherRevenueSources: '',
    salaryInfo: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 저장된 API 키와 사업자 정보 복원
  useEffect(() => {
    const savedKey = localStorage.getItem(STORAGE_KEY_API);
    if (savedKey) {
      setApiKey(savedKey);
      setGeminiApiKey(savedKey);
    }
    const savedBiz = localStorage.getItem(STORAGE_KEY_BIZ);
    if (savedBiz) {
      try {
        const parsed = JSON.parse(savedBiz);
        if (parsed.accountType) setAccountType(parsed.accountType);
        setBusinessInfo(prev => ({ ...prev, ...parsed }));
      } catch (e) { /* 무시 */ }
    }
  }, []);

  // 업종 변경 시 프리셋 자동 채움
  const handleTypeChange = (newType: string) => {
    const preset = BUSINESS_PRESETS[newType as BusinessType];
    setBusinessInfo(prev => ({
      ...prev,
      type: newType,
      // 프리셋이 있고, 사용자가 아직 입력하지 않은 필드만 자동 채움
      items: prev.items || preset?.items || '',
      rawMaterialSuppliers: prev.rawMaterialSuppliers || preset?.rawMaterialSuppliers || '',
      subsidiaryMaterialSuppliers: prev.subsidiaryMaterialSuppliers || preset?.subsidiaryMaterialSuppliers || '',
      onlinePlatforms: prev.onlinePlatforms || preset?.onlinePlatforms || '',
      otherRevenueSources: prev.otherRevenueSources || preset?.otherRevenueSources || '',
      salaryInfo: prev.salaryInfo || preset?.salaryInfo || '',
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map((file: File) => ({
        file,
        title: file.name
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
    if(event.target) {
        event.target.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileTitleChange = (index: number, newTitle: string) => {
    setFiles(prevFiles => {
      const updatedFiles = [...prevFiles];
      updatedFiles[index] = { ...updatedFiles[index], title: newTitle };
      return updatedFiles;
    });
  };
  
  const handleInfoChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    if (name === 'type') {
      handleTypeChange(value);
    } else {
      setBusinessInfo(prev => ({...prev, [name]: value }));
    }
  }

  const processData = useCallback(async () => {
    // API 키: 사용자 입력 → 환경변수 → 로컬스토리지 순서로 확인
    const effectiveKey = apiKey.trim() || getEffectiveApiKey();
    if (!effectiveKey && !envApiKeyAvailable) {
      setError("Gemini API 키를 입력해주세요. AI 분류 기능을 사용하려면 키가 필요합니다.");
      return;
    }
    const isPersonal = accountType === AccountType.PERSONAL;
    if (files.length === 0 || !businessInfo.name || !businessInfo.owner || (!isPersonal && !businessInfo.items)) {
      setError(isPersonal
        ? "이름을 입력하고, 하나 이상의 파일을 업로드해주세요."
        : "상호명, 대표자명, 주요 취급 품목을 입력하고, 하나 이상의 파일을 업로드해주세요.");
      return;
    }

    const finalBusinessInfo = { ...businessInfo, accountType };

    // API 키 설정 및 저장 (입력한 경우에만 저장)
    if (effectiveKey) {
      setGeminiApiKey(effectiveKey);
      if (apiKey.trim()) {
        localStorage.setItem(STORAGE_KEY_API, apiKey.trim());
      }
    }
    localStorage.setItem(STORAGE_KEY_BIZ, JSON.stringify(finalBusinessInfo));

    setIsLoading(true);
    setError(null);

    const promises = files.map(f => parseFile(f.file, f.title));
    const results = await Promise.all(promises);

    let allTransactions: Transaction[] = [];
    const allErrors: string[] = [];

    results.forEach(result => {
      allTransactions.push(...result.transactions);
      allErrors.push(...result.errors);
    });
    
    allTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());
    setIsLoading(false);
    
    const fileInfos: UploadedFileInfo[] = files.map(f => ({
      name: f.file.name,
      size: f.file.size,
      title: f.title
    }));
    
    onDataProcessed({ transactions: allTransactions, errors: allErrors }, finalBusinessInfo, fileInfos);

  }, [files, businessInfo, accountType, apiKey, onDataProcessed]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">AI 재무 분석 시작하기 (Setup)</h2>
          <p className="text-text-muted">성공적인 비즈니스를 위해 필요한 기본 정보를 설정해 주세요.</p>
        </div>
        {onGoBack && (
          <div className="flex items-center gap-3">
            <button
              onClick={onGoBack}
              className="px-4 py-2 bg-white rounded-xl border border-border-color text-sm font-bold text-text-muted hover:text-text-primary transition-all shadow-sm flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              대시보드로 돌아가기
            </button>
          </div>
        )}
      </div>

      <div className="space-y-10">
          
          {/* 이전 분석 불러오기 */}
          {(savedSession || onImportSession) && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-emerald-800">이전 분석 불러오기</h3>
              </div>
              
              <div className="space-y-4">
                {savedSession && onRestoreSession && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <div className="mb-3 sm:mb-0">
                      <p className="text-lg font-bold text-text-primary">{savedSession.businessInfo.name}</p>
                      <p className="text-sm text-text-muted mt-1">
                        {new Date(savedSession.savedAt).toLocaleDateString('ko-KR')} 저장 · {savedSession.transactions.length.toLocaleString()}건
                      </p>
                    </div>
                    <button
                      onClick={onRestoreSession}
                      className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-base transition-colors shadow-sm"
                    >
                      바로 불러오기
                    </button>
                  </div>
                )}
                {onImportSession && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <div className="mb-3 sm:mb-0">
                      <p className="text-base font-bold text-text-primary">백업 파일(.json)에서 불러오기</p>
                      <p className="text-sm text-text-muted mt-1">이전에 다운로드한 백업 파일이 있다면 선택하세요.</p>
                    </div>
                    <label className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl text-base cursor-pointer border-2 border-emerald-200 transition-colors text-center">
                      파일 찾기
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            try {
                              const data = JSON.parse(ev.target?.result as string);
                              if (data.businessInfo && data.transactions) {
                                onImportSession(data);
                              } else {
                                alert('올바른 백업 파일이 아닙니다.');
                              }
                            } catch {
                              alert('파일을 읽을 수 없습니다.');
                            }
                          };
                          reader.readAsText(file);
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 0: API 키 */}
          <div className="bg-surface-subtle rounded-2xl border border-border-color p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand-primary shadow-sm border border-border-color">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-text-primary">Google Gemini API 키</h3>
              </div>
              {!envApiKeyAvailable && (
                <button
                  onClick={() => setShowApiKeyGuide(!showApiKeyGuide)}
                  className="text-sm font-semibold text-brand-accent hover:text-brand-primary transition-colors underline underline-offset-4"
                >
                  {showApiKeyGuide ? '설명 닫기' : '발급 방법 보기'}
                </button>
              )}
            </div>

            {envApiKeyAvailable ? (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-bold text-emerald-800">AI 키가 자동으로 설정되었습니다</p>
                  <p className="text-sm text-emerald-700 mt-0.5">별도 입력 없이 AI 분류 기능을 바로 사용할 수 있습니다.</p>
                </div>
              </div>
            ) : (
              <>
                {showApiKeyGuide && (
                  <div className="mb-6 p-5 bg-white rounded-xl border border-border-color text-base text-text-muted space-y-2 shadow-sm">
                    <p className="font-medium text-text-primary mb-2">API 키 발급 순서:</p>
                    <p>1. <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-accent font-semibold hover:underline">Google AI Studio</a>에 접속합니다.</p>
                    <p>2. Google 계정으로 로그인합니다.</p>
                    <p>3. <span className="font-semibold">"API 키 만들기"</span> 버튼을 클릭합니다.</p>
                    <p>4. 생성된 긴 문자열(키)을 복사하여 아래에 붙여넣기 합니다.</p>
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-sm text-amber-800 font-medium">API 키는 본인만 사용하세요. 브라우저에만 안전하게 저장됩니다.</p>
                    </div>
                  </div>
                )}
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-white border-2 border-border-color rounded-xl px-4 py-4 text-lg focus:ring-4 focus:ring-brand-accent/20 focus:border-brand-accent text-text-primary transition-all shadow-sm"
                  placeholder="AIzaSy... 로 시작하는 키를 입력하세요"
                  autoComplete="off"
                />
                {apiKey && <p className="text-sm font-medium text-emerald-600 mt-3 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> API 키가 입력되었습니다.</p>}
              </>
            )}
          </div>

          {/* Step 0.5: 통장 구분 선택 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">1</div>
              <h3 className="text-2xl font-bold text-text-primary">통장 구분 선택</h3>
            </div>
            <p className="text-base text-text-muted ml-0 md:ml-14 mb-6">사용하시는 통장 종류를 선택해 주세요. 최적의 분류 항목이 자동 설정됩니다.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-0 md:ml-14">
              {[
                { value: AccountType.PERSONAL, label: '개인 통장', desc: '개인 생활비, 용돈 관리', icon: '👤' },
                { value: AccountType.SOLE_PROPRIETOR, label: '개인 사업자', desc: '자영업, 소상공인 사업용', icon: '🏪' },
                { value: AccountType.CORPORATION, label: '법인 사업자', desc: '법인 회사 사업용', icon: '🏢' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAccountType(opt.value)}
                  className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
                    accountType === opt.value
                      ? 'border-brand-accent bg-blue-50 shadow-md transform -translate-y-1'
                      : 'border-border-color bg-white hover:border-brand-accent/50 hover:bg-surface-subtle'
                  }`}
                >
                  <div className="text-3xl mb-3">{opt.icon}</div>
                  <div className={`font-bold text-xl mb-2 ${accountType === opt.value ? 'text-brand-primary' : 'text-text-primary'}`}>{opt.label}</div>
                  <div className="text-sm text-text-muted leading-relaxed">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-border-color ml-0 md:ml-14" />

          {/* Step 1: 기본 정보 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">2</div>
              <h3 className="text-2xl font-bold text-text-primary">
                {accountType === AccountType.PERSONAL ? '기본 정보 입력' : '사업 정보 입력'}
              </h3>
            </div>
            <p className="text-base text-text-muted ml-0 md:ml-14 mb-6">분석 보고서에 표시될 기본 정보를 입력해주세요.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-0 md:ml-14">
              <div>
                <label htmlFor="name" className="block text-base font-bold text-text-primary mb-2">
                  {accountType === AccountType.PERSONAL ? '이름 (또는 별칭)' : '상호명'} <span className="text-red-500">*</span>
                </label>
                <input type="text" name="name" id="name" value={businessInfo.name} onChange={handleInfoChange} className="w-full bg-white border-2 border-border-color rounded-xl px-4 py-3 text-lg focus:ring-4 focus:ring-brand-accent/20 focus:border-brand-accent text-text-primary transition-all shadow-sm" autoComplete="off" placeholder={accountType === AccountType.PERSONAL ? '예: 홍길동' : '예: 토담옛날통닭'}/>
              </div>
              <div>
                <label htmlFor="owner" className="block text-base font-bold text-text-primary mb-2">
                  {accountType === AccountType.PERSONAL ? '메모' : '대표자명'} <span className="text-red-500">*</span>
                </label>
                <input type="text" name="owner" id="owner" value={businessInfo.owner} onChange={handleInfoChange} className="w-full bg-white border-2 border-border-color rounded-xl px-4 py-3 text-lg focus:ring-4 focus:ring-brand-accent/20 focus:border-brand-accent text-text-primary transition-all shadow-sm" autoComplete="off" placeholder={accountType === AccountType.PERSONAL ? '예: 2024년 생활비 통장' : '예: 홍길동'}/>
              </div>
              
              {accountType !== AccountType.PERSONAL && (
                <>
                  <div>
                    <label htmlFor="type" className="block text-base font-bold text-text-primary mb-2">업종 선택</label>
                    <div className="relative">
                      <select name="type" id="type" value={businessInfo.type} onChange={handleInfoChange} className="w-full bg-white border-2 border-border-color rounded-xl px-4 py-3 text-lg appearance-none focus:ring-4 focus:ring-brand-accent/20 focus:border-brand-accent text-text-primary transition-all shadow-sm cursor-pointer">
                        {Object.values(BusinessType).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted">
                        <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="items" className="block text-base font-bold text-text-primary mb-2">주요 취급 품목 <span className="text-red-500">*</span></label>
                    <input type="text" name="items" id="items" value={businessInfo.items} onChange={handleInfoChange} className="w-full bg-white border-2 border-border-color rounded-xl px-4 py-3 text-lg focus:ring-4 focus:ring-brand-accent/20 focus:border-brand-accent text-text-primary transition-all shadow-sm" autoComplete="off" placeholder="예: 후라이드 치킨, 양념 치킨 (쉼표로 구분)"/>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-base font-bold text-text-primary mb-2">
                      사업장 규모 <span className="text-xs font-normal text-text-muted">(AI 카테고리 최적화에 사용됩니다)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { value: '소규모' as BusinessScale, label: '소규모', desc: '월매출 3천만원 이하', icon: '🏠', sub: '1인~3인 운영' },
                        { value: '중규모' as BusinessScale, label: '중규모', desc: '월매출 3천만~1억원', icon: '🏪', sub: '4인~10인 운영' },
                        { value: '대규모' as BusinessScale, label: '대규모', desc: '월매출 1억원 이상', icon: '🏢', sub: '10인 이상 운영' },
                      ]).map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setBusinessInfo(prev => ({ ...prev, businessScale: opt.value }))}
                          className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                            businessInfo.businessScale === opt.value
                              ? 'border-brand-accent bg-blue-50 shadow-md'
                              : 'border-border-color bg-white hover:border-brand-accent/50 hover:bg-surface-subtle'
                          }`}
                        >
                          <div className="text-2xl mb-1">{opt.icon}</div>
                          <div className={`font-bold text-base ${businessInfo.businessScale === opt.value ? 'text-brand-primary' : 'text-text-primary'}`}>{opt.label}</div>
                          <div className="text-xs text-text-muted mt-0.5">{opt.desc}</div>
                          <div className="text-xs text-text-muted">{opt.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Step 2: 추가 정보 (접이식) - 사업자만 표시 */}
          {accountType !== AccountType.PERSONAL && (
            <div className="ml-0 md:ml-14 bg-surface-subtle rounded-2xl border border-border-color overflow-hidden transition-all">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-border-color/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-brand-primary shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">추가 정보 입력 (선택사항)</h3>
                    <p className="text-sm text-text-muted mt-1">입력하시면 AI가 거래처를 더 정확하게 분류합니다.</p>
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {showAdvanced && (
                <div className="p-6 pt-0 border-t border-border-color/50 mt-2 space-y-5">
                  <div>
                    <label htmlFor="address" className="block text-sm font-bold text-text-primary mb-2">사업장 주소</label>
                    <input type="text" name="address" id="address" value={businessInfo.address} onChange={handleInfoChange} className="w-full bg-white border border-border-color rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-text-primary shadow-sm" placeholder="예: 서울특별시 강남구 테헤란로 123" autoComplete="off" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="rawMaterialSuppliers" className="block text-sm font-bold text-text-primary mb-2">주요 원재료 매입처</label>
                      <input type="text" name="rawMaterialSuppliers" id="rawMaterialSuppliers" value={businessInfo.rawMaterialSuppliers} onChange={handleInfoChange} className="w-full bg-white border border-border-color rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-text-primary shadow-sm" placeholder="예: OO유통, 가나다 식자재" autoComplete="off" />
                    </div>
                    <div>
                      <label htmlFor="subsidiaryMaterialSuppliers" className="block text-sm font-bold text-text-primary mb-2">부재료/기타 매입처</label>
                      <input type="text" name="subsidiaryMaterialSuppliers" id="subsidiaryMaterialSuppliers" value={businessInfo.subsidiaryMaterialSuppliers} onChange={handleInfoChange} className="w-full bg-white border border-border-color rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-text-primary shadow-sm" placeholder="예: 포장용기 업체" autoComplete="off" />
                    </div>
                    <div>
                      <label htmlFor="onlinePlatforms" className="block text-sm font-bold text-text-primary mb-2">온라인/플랫폼 매출처</label>
                      <input type="text" name="onlinePlatforms" id="onlinePlatforms" value={businessInfo.onlinePlatforms} onChange={handleInfoChange} className="w-full bg-white border border-border-color rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-text-primary shadow-sm" placeholder="예: 배달의민족, 쿠팡이츠" autoComplete="off" />
                    </div>
                    <div>
                      <label htmlFor="otherRevenueSources" className="block text-sm font-bold text-text-primary mb-2">기타 매출처</label>
                      <input type="text" name="otherRevenueSources" id="otherRevenueSources" value={businessInfo.otherRevenueSources} onChange={handleInfoChange} className="w-full bg-white border border-border-color rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-text-primary shadow-sm" placeholder="예: 단체 주문 업체" autoComplete="off" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="salaryInfo" className="block text-sm font-bold text-text-primary mb-2">급여 지급 정보</label>
                    <input type="text" name="salaryInfo" id="salaryInfo" value={businessInfo.salaryInfo} onChange={handleInfoChange} className="w-full bg-white border border-border-color rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-text-primary shadow-sm" placeholder="예: 매월 25일, '급여' 또는 직원 이름 포함" autoComplete="off" />
                  </div>
                </div>
              )}
            </div>
          )}

          <hr className="border-border-color ml-0 md:ml-14" />

          {/* Step 3: 파일 업로드 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">3</div>
              <h3 className="text-2xl font-bold text-text-primary">거래내역 파일 업로드</h3>
            </div>
            <p className="text-base text-text-muted ml-0 md:ml-14 mb-6">은행에서 다운로드한 입출금 내역 파일(Excel, CSV)을 업로드해주세요.</p>
            
            <div className="ml-0 md:ml-14">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-accent to-brand-primary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex flex-col items-center justify-center p-10 bg-white border-2 border-dashed border-brand-accent/50 rounded-2xl hover:bg-blue-50/50 transition-colors">
                  <input type="file" id="file-upload" multiple onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv"/>
                  <label htmlFor="file-upload" className="cursor-pointer text-center w-full flex flex-col items-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-brand-accent shadow-sm group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    </div>
                    <p className="text-xl text-brand-primary font-bold mb-2">이곳을 클릭하여 파일 선택</p>
                    <p className="text-base text-text-muted">Excel (.xlsx, .xls) 또는 CSV 파일 (여러 개 선택 가능)</p>
                  </label>
                </div>
              </div>

              {files.length > 0 && (
                <div className="mt-6 bg-surface-subtle rounded-2xl p-6 border border-border-color">
                  <p className="font-bold text-lg text-text-primary mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    선택된 파일 ({files.length}개)
                  </p>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {files.map((f, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white rounded-xl border border-border-color shadow-sm">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-muted truncate mb-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            {f.file.name}
                          </p>
                          <input
                            type="text"
                            value={f.title}
                            onChange={(e) => handleFileTitleChange(index, e.target.value)}
                            className="w-full bg-surface-subtle border-2 border-border-color rounded-lg px-3 py-2 text-base font-bold focus:ring-2 focus:ring-brand-accent focus:border-brand-accent text-text-primary transition-colors"
                            placeholder="분석용 제목 (예: 신한은행 1분기)"
                          />
                        </div>
                        <button onClick={() => handleRemoveFile(index)} className="self-end sm:self-center w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors" title="삭제">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="ml-0 md:ml-14 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-red-700 text-base font-medium flex items-start gap-3 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="pt-8 border-t border-border-color flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-sm text-text-muted flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500">verified_user</span>
                입력하신 정보는 브라우저에만 안전하게 저장됩니다.
            </div>
            <button
              onClick={processData}
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-brand-primary to-indigo-700 hover:from-indigo-700 hover:to-brand-primary text-white font-bold text-xl rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 hover:shadow-2xl disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:transform-none disabled:from-slate-300 disabled:to-slate-300"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  분석 준비 중...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined mr-2">rocket_launch</span>
                  AI 분석 시작하기
                </>
              )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;
