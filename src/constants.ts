import { Category, BusinessType, CostGroup } from './types';

// ============================================================
// 헬퍼 함수: 카테고리 생성
// ============================================================
const inc = (name: string): Category => ({
  name, level1: '수입', level2: '영업 수익', costGroup: null, type: 'operating_income'
});
const incNon = (name: string): Category => ({
  name, level1: '수입', level2: '영업외 수익', costGroup: null, type: 'non_operating_income'
});
const exp = (name: string, costGroup: CostGroup): Category => ({
  name, level1: '지출', level2: '영업 비용', costGroup, type: 'operating_expense'
});
const expNon = (name: string): Category => ({
  name, level1: '지출', level2: '사업외 지출', costGroup: null, type: 'non_operating_expense'
});

// ============================================================
// 3단계 계정과목 목록 (경영분석보고서 기준)
// ============================================================

// ▶ 영업 수익 (사업 매출) — 통장 입금 방식 기준 분류
export const OPERATING_INCOME_CATEGORIES: Category[] = [
  inc('카드매출'),         // 카드단말기(POS) → VAN사 정산 입금
  inc('배달매출'),         // 배달앱(배달의민족·쿠팡이츠·요기요) 정산 입금
  inc('간편결제'),         // 네이버페이·카카오페이·토스 등 (POS 미등록, 직접 통장 입금)
  inc('지역화폐'),         // 제로페이·지역사랑상품권 (POS 현금 잡히지만 별도 서비스 정산)
  inc('현금매출'),         // 직접 받는 현금 (POS 현금결제, 손님이 직접 낸 돈)
  inc('입점몰매출'),       // 쿠팡·스마트스토어·11번가 등 플랫폼 대행 정산
  inc('세금계산서매출'),   // B2B 거래처 계좌이체 (세금계산서 발행분)
  inc('기타매출'),         // 미분류 입금 기본값
];

// ▶ 영업외 수익 — 사업 매출 외 기타 입금
export const NON_OPERATING_INCOME_CATEGORIES: Category[] = [
  incNon('정부지원금'),     // 소상공인 지원금·보조금·재난지원금 등
  incNon('차입금'),         // 대출 실행·지인 차입 (원금 상환 시 현금 감소, 손익 참고 표시)
  incNon('부업·사이드수입'), // 주업 외 다른 수입원 (투잡, 강의, 용역 등)
  incNon('보험금·환급금'),   // 보험사 지급금, 세금환급, 보증금 반환 등
  incNon('이자수익'),        // 예금·적금 이자
  incNon('기타입금'),        // 미분류 입금 기본값
];

// ▶ 영업 비용 - 인건비
export const COST_LABOR_CATEGORIES: Category[] = [
  exp('인건비(정규)', '인건비'),
  exp('인건비(알바)', '인건비'),
];

// ▶ 영업 비용 - 재료비
export const COST_MATERIAL_CATEGORIES: Category[] = [
  exp('원재료(식자재)', '재료비'),
  exp('부자재(식용류)', '재료비'),
  exp('부자재(주류)', '재료비'),
  exp('부자재(음료)', '재료비'),
  exp('부자재(기타)', '재료비'),
];

// ▶ 영업 비용 - 고정비
export const COST_FIXED_CATEGORIES: Category[] = [
  exp('임대료·관리비', '고정비'),
  exp('도시가스비', '고정비'),
  exp('전기요금', '고정비'),
  exp('통신·IT비', '고정비'),
  exp('포스·시스템비', '고정비'),
  exp('렌탈비', '고정비'),
  exp('보험료', '고정비'),
];

// ▶ 영업 비용 - 변동비
export const COST_VARIABLE_CATEGORIES: Category[] = [
  exp('마트·편의점구입', '변동비'),
  exp('배달수수료', '변동비'),
  exp('광고비', '변동비'),
  exp('수선유지비', '변동비'),
  exp('세금·공과금', '변동비'),
  exp('기타사업비', '변동비'),
];

// ▶ 사업외 지출 — 통장에서 나가지만 사업 운영 비용이 아닌 것
// [부채/금융] 대출·카드 관련
export const NON_OP_EXP_DEBT: Category[] = [
  expNon('대출원금상환'),   // 금융권·지인 차입금 원금 상환 (손익 계산 참고 표시)
  expNon('이자비용'),       // 대출 이자·카드론 이자 (개인 대출 기준)
  expNon('신용카드대금'),   // 카드사 월 결제 대금
];
// [개인 생활비] 일상 소비
export const NON_OP_EXP_LIFE: Category[] = [
  expNon('병원·약국비'),    // 의료비 (병원, 한의원, 약국)
  expNon('개인식비'),       // 개인 식사, 경조사비, 모임 비용
  expNon('개인통신·보험'),  // 가족 통신비, 개인 보험료
  expNon('유류비·교통비'),  // 개인 차량 주유·주차, 대중교통비
];
// [이전/이체] 가족·저축
export const NON_OP_EXP_TRANSFER: Category[] = [
  expNon('가족용돈·생활비'), // 배우자·자녀 이체, 부모님 용돈, 생활비
  expNon('개인저축·투자'),   // 적금, 펀드, 주식 투자
];
// [기타] 미분류
export const NON_OP_EXP_MISC: Category[] = [
  expNon('기타출금'),        // 미분류 개인 출금 기본값 (하위 호환)
];

// 전체 사업외 지출 (위 그룹 합산)
export const NON_OPERATING_EXPENSE_CATEGORIES: Category[] = [
  ...NON_OP_EXP_DEBT,
  ...NON_OP_EXP_LIFE,
  ...NON_OP_EXP_TRANSFER,
  ...NON_OP_EXP_MISC,
];

// 전체 영업 비용
export const OPERATING_EXPENSE_CATEGORIES: Category[] = [
  ...COST_LABOR_CATEGORIES,
  ...COST_MATERIAL_CATEGORIES,
  ...COST_FIXED_CATEGORIES,
  ...COST_VARIABLE_CATEGORIES,
];

// 전체 카테고리 (모든 계정)
export const DEFAULT_CATEGORIES: Category[] = [
  ...OPERATING_INCOME_CATEGORIES,
  ...NON_OPERATING_INCOME_CATEGORIES,
  ...OPERATING_EXPENSE_CATEGORIES,
  ...NON_OPERATING_EXPENSE_CATEGORIES,
];

// ============================================================
// 대시보드 손익 계산용 카테고리 그룹 상수
// ============================================================

/** 차입금 입금 카테고리 (통장에 들어오지만 수익이 아닌 부채) */
export const LOAN_IN_CATEGORIES = new Set(['차입금']);
/** 원금 상환 카테고리 (나가는 돈이지만 비용이 아닌 부채 상환) */
export const LOAN_OUT_CATEGORIES = new Set(['대출원금상환']);
/** 부채/금융 지출 카테고리 전체 */
export const DEBT_EXPENSE_CATEGORIES = new Set(NON_OP_EXP_DEBT.map(c => c.name));
/** 개인 생활비 카테고리 */
export const PERSONAL_LIFE_CATEGORIES = new Set(NON_OP_EXP_LIFE.map(c => c.name));
/** 이전/이체 카테고리 */
export const TRANSFER_CATEGORIES = new Set(NON_OP_EXP_TRANSFER.map(c => c.name));

// 하위 호환: 기존 코드에서 참조하는 상수들
export const CATEGORY_NON_OPERATING_INCOME: Category = incNon('정부지원금');
export const CATEGORY_NON_OPERATING_EXPENSE: Category = expNon('기타출금');

export const DEFAULT_CATEGORY_INCOME = '기타매출';
export const DEFAULT_CATEGORY_EXPENSE = '기타사업비';

export const NON_MODIFIABLE_CATEGORIES = [
  DEFAULT_CATEGORY_INCOME,
  DEFAULT_CATEGORY_EXPENSE,
  '기타입금',
  '기타출금',
];

// ============================================================
// 통장 구분별 기본 카테고리 프리셋
// ============================================================

// ▶ 개인통장용 카테고리
const pInc = (name: string): Category => ({
  name, level1: '수입', level2: '영업 수익', costGroup: null, type: 'operating_income'
});
const pIncNon = (name: string): Category => ({
  name, level1: '수입', level2: '영업외 수익', costGroup: null, type: 'non_operating_income'
});
const pExp = (name: string): Category => ({
  name, level1: '지출', level2: '영업 비용', costGroup: null, type: 'operating_expense'
});
const pExpNon = (name: string): Category => ({
  name, level1: '지출', level2: '사업외 지출', costGroup: null, type: 'non_operating_expense'
});

export const PERSONAL_CATEGORIES: Category[] = [
  pInc('급여·용돈'),
  pInc('부업·알바수입'),
  pInc('기타매출'),
  pIncNon('이자수익'),
  pIncNon('환급금'),
  pIncNon('기타수입'),
  pExp('식비'),
  pExp('교통비'),
  pExp('통신비'),
  pExp('생활용품'),
  pExp('의류·미용'),
  pExp('문화·여가'),
  pExp('교육비'),
  pExp('의료비'),
  pExp('보험료'),
  pExp('공과금'),
  pExp('기타사업비'),
  pExpNon('주거비(월세·관리비)'),
  pExpNon('대출상환'),
  pExpNon('저축·투자'),
  pExpNon('경조사비'),
  pExpNon('기타출금'),
];

// ▶ 법인사업자용 카테고리
const cInc = (name: string): Category => ({
  name, level1: '수입', level2: '영업 수익', costGroup: null, type: 'operating_income'
});
const cIncNon = (name: string): Category => ({
  name, level1: '수입', level2: '영업외 수익', costGroup: null, type: 'non_operating_income'
});
const cExp = (name: string, costGroup: CostGroup): Category => ({
  name, level1: '지출', level2: '영업 비용', costGroup, type: 'operating_expense'
});
const cExpNon = (name: string): Category => ({
  name, level1: '지출', level2: '사업외 지출', costGroup: null, type: 'non_operating_expense'
});

export const CORPORATION_CATEGORIES: Category[] = [
  cInc('매출'),
  cInc('용역매출'),
  cInc('기타매출'),
  cIncNon('이자수익'),
  cIncNon('배당금수익'),
  cIncNon('유형자산처분이익'),
  cIncNon('기타수입'),
  cExp('매출원가', '재료비'),
  cExp('급여', '인건비'),
  cExp('퇴직급여', '인건비'),
  cExp('복리후생비', '인건비'),
  cExp('임차료', '고정비'),
  cExp('접대비', '변동비'),
  cExp('감가상각비', '고정비'),
  cExp('통신비', '고정비'),
  cExp('수도광열비', '고정비'),
  cExp('세금과공과', '변동비'),
  cExp('보험료', '고정비'),
  cExp('광고선전비', '변동비'),
  cExp('운반비', '변동비'),
  cExp('소모품비', '변동비'),
  cExp('수선비', '변동비'),
  cExp('차량유지비', '변동비'),
  cExp('여비교통비', '변동비'),
  cExp('기타사업비', '변동비'),
  cExpNon('이자비용'),
  cExpNon('유형자산처분손실'),
  cExpNon('법인세비용'),
  cExpNon('기타출금'),
];

// 통장 구분에 따른 기본 카테고리 반환
export function getDefaultCategoriesByAccountType(accountType?: string): Category[] {
  switch (accountType) {
    case '개인통장': return PERSONAL_CATEGORIES;
    case '법인사업자': return CORPORATION_CATEGORIES;
    case '개인사업자':
    default: return DEFAULT_CATEGORIES;
  }
}

// 카테고리 이름으로 Category 객체를 찾는 맵 (모든 프리셋 포함)
export const CATEGORY_MAP: Record<string, Category> = {};
// 개인사업자, 개인통장, 법인사업자 카테고리 모두 맵에 등록
[...DEFAULT_CATEGORIES, ...PERSONAL_CATEGORIES, ...CORPORATION_CATEGORIES].forEach(c => {
  CATEGORY_MAP[c.name] = c;
});

// ============================================================
// AI 분류 결과 정규화: AI가 반환한 이름을 표준 계정명으로 매칭
// ============================================================
const ALL_CATEGORY_NAMES = DEFAULT_CATEGORIES.map(c => c.name);

// 정규화 키 생성: 공백, 특수문자 제거 후 소문자
const normalizeKey = (s: string): string => {
  return s
    .replace(/[\s·\-\/\\·・・]/g, '')  // 공백, 가운데점, 대시, 슬래시 제거
    .replace(/[（）\(\)]/g, '')         // 전각/반각 괄호 제거
    .toLowerCase();
};

// 표준 계정명별 정규화 키 맵 (미리 계산)
const NORMALIZED_CATEGORY_INDEX: Map<string, string> = new Map();
ALL_CATEGORY_NAMES.forEach(name => {
  NORMALIZED_CATEGORY_INDEX.set(normalizeKey(name), name);
});

// 별칭 매핑 (AI가 자주 틀리는 패턴 + 구 카테고리명 → 신 카테고리명)
const CATEGORY_ALIASES: Record<string, string> = {
  // ── 매출 ──
  '카드 매출': '카드매출',
  '신용카드매출': '카드매출',
  '배달 매출': '배달매출',
  '배달앱매출': '배달매출',
  '지역 화폐': '지역화폐',
  '제로페이': '지역화폐',
  '지역사랑상품권': '지역화폐',
  '간편 결제': '간편결제',
  '네이버페이매출': '간편결제',
  '카카오페이매출': '간편결제',
  '현금 매출': '현금매출',
  '현금결제': '현금매출',
  '입점몰 매출': '입점몰매출',
  '스마트스토어': '입점몰매출',
  '쿠팡매출': '입점몰매출',
  '세금계산서 매출': '세금계산서매출',
  'B2B매출': '세금계산서매출',
  '기타 매출': '기타매출',
  // ── 영업외 수익 ──
  '정부 지원금': '정부지원금',
  '소상공인지원금': '정부지원금',
  '재난지원금': '정부지원금',
  '차입': '차입금',
  '대출': '차입금',
  '대출실행': '차입금',
  '부업수입': '부업·사이드수입',
  '사이드수입': '부업·사이드수입',
  '보험금': '보험금·환급금',
  '환급금': '보험금·환급금',
  '세금환급': '보험금·환급금',
  '보증금반환': '보험금·환급금',
  '이자': '이자수익',
  '외부입금': '기타입금',
  '기타수입': '기타입금',
  '영업외수익': '기타입금',
  '영업외수입': '기타입금',
  // ── 인건비 ──
  '인건비 정규': '인건비(정규)',
  '인건비 알바': '인건비(알바)',
  '정규 인건비': '인건비(정규)',
  '알바 인건비': '인건비(알바)',
  '급여': '인건비(정규)',
  '알바비': '인건비(알바)',
  // ── 재료비 ──
  '원재료': '원재료(식자재)',
  '식자재': '원재료(식자재)',
  '원재료 식자재': '원재료(식자재)',
  '식용류': '부자재(식용류)',
  '식용유': '부자재(식용류)',
  '부자재 식용류': '부자재(식용류)',
  '주류': '부자재(주류)',
  '부자재 주류': '부자재(주류)',
  '음료': '부자재(음료)',
  '부자재 음료': '부자재(음료)',
  '부자재 기타': '부자재(기타)',
  // ── 고정비 ──
  '임대료': '임대료·관리비',
  '관리비': '임대료·관리비',
  '임대료 관리비': '임대료·관리비',
  '임대료/관리비': '임대료·관리비',
  '가스비': '도시가스비',
  '가스': '도시가스비',
  '도시가스': '도시가스비',
  '전기': '전기요금',
  '전기세': '전기요금',
  '통신비': '통신·IT비',
  '통신 IT비': '통신·IT비',
  '포스': '포스·시스템비',
  '시스템비': '포스·시스템비',
  '포스 시스템비': '포스·시스템비',
  '렌탈': '렌탈비',
  '보험': '보험료',
  // ── 변동비 ──
  '마트': '마트·편의점구입',
  '편의점': '마트·편의점구입',
  '마트 편의점': '마트·편의점구입',
  '배달 수수료': '배달수수료',
  '수선 유지비': '수선유지비',
  '세금': '세금·공과금',
  '공과금': '세금·공과금',
  '세금 공과금': '세금·공과금',
  '기타 사업비': '기타사업비',
  // ── 사업외 지출 (구 → 신 매핑 포함) ──
  '신용카드': '신용카드대금',
  '신용카드 대금': '신용카드대금',
  '카드대금': '신용카드대금',
  '대출상환': '대출원금상환',
  '원금상환': '대출원금상환',
  '대출 원금상환': '대출원금상환',
  '이자비용': '이자비용',
  '대출이자': '이자비용',
  '카드론이자': '이자비용',
  '병원': '병원·약국비',
  '약국': '병원·약국비',
  '의료비': '병원·약국비',
  '의료비(병원·약국)': '병원·약국비',
  '개인사비': '개인식비',
  '개인식비유흥': '개인식비',
  '경조사비': '개인식비',
  '유류': '유류비·교통비',
  '주유비': '유류비·교통비',
  '유류비': '유류비·교통비',
  '통신 IT비 개인': '개인통신·보험',
  '개인 통신비': '개인통신·보험',
  '문자수수료': '개인통신·보험',
  '문자통지수수료': '개인통신·보험',
  '가족용돈': '가족용돈·생활비',
  '생활비': '가족용돈·생활비',
  '용돈': '가족용돈·생활비',
  '저축': '개인저축·투자',
  '투자': '개인저축·투자',
  '적금': '개인저축·투자',
  '개인출금·차입금반환': '대출원금상환',
  '개인출금': '기타출금',
  '기타 출금': '기타출금',
  '기타개인출금': '기타출금',
};

// 별칭 맵도 정규화 키로 인덱싱
const NORMALIZED_ALIAS_INDEX: Map<string, string> = new Map();
Object.entries(CATEGORY_ALIASES).forEach(([alias, standard]) => {
  NORMALIZED_ALIAS_INDEX.set(normalizeKey(alias), standard);
});

/**
 * AI가 반환한 카테고리 이름을 표준 계정명으로 매칭합니다.
 * 1단계: 정확한 이름 매칭
 * 2단계: 정규화 키로 매칭 (공백/특수문자 제거 후)
 * 3단계: 별칭 매칭
 * 4단계: 부분 문자열 매칭
 * 실패 시: 수입/지출 기본 카테고리 반환
 */
export function normalizeCategoryName(aiName: string, isIncome: boolean): string {
  const trimmed = aiName.trim();
  
  // 1단계: 정확한 매칭
  if (CATEGORY_MAP[trimmed]) return trimmed;
  
  // 2단계: 정규화 키 매칭
  const nKey = normalizeKey(trimmed);
  const exactNormalized = NORMALIZED_CATEGORY_INDEX.get(nKey);
  if (exactNormalized) return exactNormalized;
  
  // 3단계: 별칭 매칭
  const aliasMatch = NORMALIZED_ALIAS_INDEX.get(nKey);
  if (aliasMatch) return aliasMatch;
  
  // 4단계: 부분 문자열 매칭 (AI가 이름을 약간 변형한 경우)
  for (const standardName of ALL_CATEGORY_NAMES) {
    if (trimmed.includes(standardName) || standardName.includes(trimmed)) {
      return standardName;
    }
  }
  
  // 5단계: 정규화 키 부분 매칭
  for (const [stdKey, stdName] of NORMALIZED_CATEGORY_INDEX.entries()) {
    if (nKey.includes(stdKey) || stdKey.includes(nKey)) {
      return stdName;
    }
  }
  
  // 실패 시 기본값
  console.warn(`[카테고리 매칭 실패] AI 반환값: "${aiName}" → 기본 카테고리 사용`);
  return isIncome ? DEFAULT_CATEGORY_INCOME : DEFAULT_CATEGORY_EXPENSE;
}

// 카테고리 이름으로 level2를 반환하는 헬퍼
export function getCategoryLevel2(categoryName: string): string {
  return CATEGORY_MAP[categoryName]?.level2 || '사업외 지출';
}

// 카테고리 이름으로 costGroup을 반환하는 헬퍼
export function getCostGroup(categoryName: string): CostGroup {
  return CATEGORY_MAP[categoryName]?.costGroup || null;
}

// ============================================================
// 컬럼 매핑 (엑셀 파싱용)
// ============================================================
export const COLUMN_MAPPINGS: { [key: string]: string[] } = {
  date: ['거래일시', '거래일', '일시', 'date', 'transaction date'],
  description: ['적요', '내용', '거래내역', 'description', 'details'],
  debit: ['출금액', '출금', 'debit', 'withdraw'],
  credit: ['입금액', '입금', 'credit', 'deposit'],
  balance: ['잔액', 'balance'],
};

// ============================================================
// 업종별 프리셋
// ============================================================
export interface BusinessPreset {
  items: string;
  rawMaterialSuppliers: string;
  subsidiaryMaterialSuppliers: string;
  onlinePlatforms: string;
  otherRevenueSources: string;
  salaryInfo: string;
}

export const BUSINESS_PRESETS: Partial<Record<BusinessType, BusinessPreset>> = {
  [BusinessType.RESTAURANT_GENERAL]: {
    items: '한식, 백반, 찌개, 반찬',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '배달의민족, 쿠팡이츠, 요기요',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.RESTAURANT_CAFE]: {
    items: '커피, 음료, 디저트, 케이크',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '배달의민족, 쿠팡이츠',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.RESTAURANT_BAR]: {
    items: '주류, 안주, 맥주, 소주',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '배달의민족',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.RETAIL_FASHION]: {
    items: '의류, 잡화, 액세서리',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '스마트스토어, 쿠팡, 카카오톡스토어',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.RETAIL_GROCERY]: {
    items: '신선식품, 가공식품, 생활용품',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.RETAIL_GENERAL]: {
    items: '생활용품, 잡화',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '스마트스토어, 쿠팡',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.RETAIL_ECOMMERCE]: {
    items: '',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '스마트스토어, 쿠팡, 11번가, G마켓',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.SERVICE_BEAUTY]: {
    items: '헤어커트, 염색, 파마, 네일아트',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '네이버 예약, 카카오 예약',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.SERVICE_EDUCATION]: {
    items: '수업료, 교재, 교육 프로그램',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.SERVICE_FITNESS]: {
    items: '회원권, PT, 운동 프로그램',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.SERVICE_PROFESSIONAL]: {
    items: '컨설팅, 디자인, 전문 서비스',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.SERVICE_ACCOMMODATION]: {
    items: '숙박, 객실, 부대시설',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '야놀자, 여기어때, 에어비앤비',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.SERVICE_Hospital]: {
    items: '진료비, 처방, 시술',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '',
    otherRevenueSources: '건강보험공단 청구',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.MANUFACTURING]: {
    items: '',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '',
    otherRevenueSources: '',
    salaryInfo: '매월 급여 이체',
  },
  [BusinessType.ETC]: {
    items: '',
    rawMaterialSuppliers: '',
    subsidiaryMaterialSuppliers: '',
    onlinePlatforms: '',
    otherRevenueSources: '',
    salaryInfo: '',
  },
};

// ============================================================
// 기본 키워드 분류 규칙 (AI 없이도 기본 분류 가능)
// ============================================================
import { CategoryRule } from './types';

export const DEFAULT_KEYWORD_RULES: CategoryRule[] = [
  // ── 매출 (입금) ──
  { keyword: '카드매출', category: '카드매출', source: 'ai' },
  { keyword: '신용카드매출', category: '카드매출', source: 'ai' },
  { keyword: 'VAN정산', category: '카드매출', source: 'ai' },
  { keyword: '카드정산', category: '카드매출', source: 'ai' },
  { keyword: 'POS정산', category: '카드매출', source: 'ai' },
  { keyword: '배달의민족', category: '배달매출', source: 'ai' },
  { keyword: '쿠팡이츠', category: '배달매출', source: 'ai' },
  { keyword: '요기요', category: '배달매출', source: 'ai' },
  { keyword: '배달정산', category: '배달매출', source: 'ai' },
  { keyword: '지역화폐', category: '지역화폐', source: 'ai' },
  { keyword: '제로페이', category: '지역화폐', source: 'ai' },
  { keyword: '지역사랑상품권', category: '지역화폐', source: 'ai' },
  { keyword: '온누리상품권', category: '지역화폐', source: 'ai' },
  { keyword: '카카오페이', category: '간편결제', source: 'ai' },
  { keyword: '네이버페이', category: '간편결제', source: 'ai' },
  { keyword: '토스페이', category: '간편결제', source: 'ai' },
  { keyword: '스마트스토어', category: '입점몰매출', source: 'ai' },
  { keyword: '쿠팡판매', category: '입점몰매출', source: 'ai' },
  { keyword: '11번가', category: '입점몰매출', source: 'ai' },
  { keyword: 'G마켓', category: '입점몰매출', source: 'ai' },
  { keyword: '옥션', category: '입점몰매출', source: 'ai' },

  // ── 영업외 수익: 환급·환불 (입금 → 방향 검증으로 출금엔 자동 배제) ──
  { keyword: '환급금', category: '보험금·환급금', source: 'ai' },
  { keyword: '수수료환급', category: '보험금·환급금', source: 'ai' },
  { keyword: '우대환급', category: '보험금·환급금', source: 'ai' },
  { keyword: '가맹점환급', category: '보험금·환급금', source: 'ai' },
  { keyword: '세금환급', category: '보험금·환급금', source: 'ai' },
  { keyword: '부가세환급', category: '보험금·환급금', source: 'ai' },
  { keyword: '종합소득세환급', category: '보험금·환급금', source: 'ai' },
  { keyword: '보증금반환', category: '보험금·환급금', source: 'ai' },
  { keyword: '보험금', category: '보험금·환급금', source: 'ai' },
  { keyword: '환불', category: '보험금·환급금', source: 'ai' },
  // ── 영업외 수익: 지원금 ──
  { keyword: '정부지원', category: '정부지원금', source: 'ai' },
  { keyword: '소상공인지원', category: '정부지원금', source: 'ai' },
  { keyword: '재난지원금', category: '정부지원금', source: 'ai' },
  { keyword: '보조금', category: '정부지원금', source: 'ai' },
  { keyword: '지원금', category: '정부지원금', source: 'ai' },
  { keyword: '배달택배비지원', category: '정부지원금', source: 'ai' },
  { keyword: '배달비지원', category: '정부지원금', source: 'ai' },
  // ── 영업외 수익: 대출 ──
  { keyword: '대출실행', category: '차입금', source: 'ai' },
  { keyword: '한도대출', category: '차입금', source: 'ai' },
  { keyword: '신규대출', category: '차입금', source: 'ai' },
  // ── 영업외 수익: 이자 ──
  { keyword: '이자수익', category: '이자수익', source: 'ai' },
  { keyword: '예금이자', category: '이자수익', source: 'ai' },
  { keyword: '적금이자', category: '이자수익', source: 'ai' },

  // ── 인건비 ──
  { keyword: '급여이체', category: '인건비(정규)', source: 'ai' },
  { keyword: '월급', category: '인건비(정규)', source: 'ai' },
  { keyword: '급여', category: '인건비(정규)', source: 'ai' },
  { keyword: '알바비', category: '인건비(알바)', source: 'ai' },
  { keyword: '아르바이트', category: '인건비(알바)', source: 'ai' },
  { keyword: '파트타임', category: '인건비(알바)', source: 'ai' },

  // ── 재료비 ──
  { keyword: '식자재', category: '원재료(식자재)', source: 'ai' },
  { keyword: '식품유통', category: '원재료(식자재)', source: 'ai' },
  { keyword: '농수산', category: '원재료(식자재)', source: 'ai' },

  // ── 고정비 ──
  { keyword: '임대료', category: '임대료·관리비', source: 'ai' },
  { keyword: '월세', category: '임대료·관리비', source: 'ai' },
  { keyword: '관리비', category: '임대료·관리비', source: 'ai' },
  { keyword: '도시가스', category: '도시가스비', source: 'ai' },
  { keyword: '가스요금', category: '도시가스비', source: 'ai' },
  { keyword: '전기요금', category: '전기요금', source: 'ai' },
  { keyword: '한국전력', category: '전기요금', source: 'ai' },
  { keyword: 'KT', category: '통신·IT비', source: 'ai' },
  { keyword: 'SKT', category: '통신·IT비', source: 'ai' },
  { keyword: 'LGU', category: '통신·IT비', source: 'ai' },
  { keyword: '보험료', category: '보험료', source: 'ai' },
  // 보험사 이름 패턴: 출금→보험료, 입금→보험금·환급금 (방향 검증으로 자동 처리)
  { keyword: '한화생명', category: '보험료', source: 'ai' },
  { keyword: '삼성생명', category: '보험료', source: 'ai' },
  { keyword: '교보생명', category: '보험료', source: 'ai' },
  { keyword: '흥국생명', category: '보험료', source: 'ai' },
  { keyword: '현대해상', category: '보험료', source: 'ai' },
  { keyword: '동부화재', category: '보험료', source: 'ai' },
  { keyword: 'DB손해보험', category: '보험료', source: 'ai' },
  { keyword: '메리츠', category: '보험료', source: 'ai' },
  { keyword: '롯데손보', category: '보험료', source: 'ai' },

  // ── 변동비 ──
  { keyword: '배달수수료', category: '배달수수료', source: 'ai' },
  { keyword: '플랫폼수수료', category: '배달수수료', source: 'ai' },
  { keyword: '광고비', category: '광고비', source: 'ai' },
  { keyword: '부가세', category: '세금·공과금', source: 'ai' },
  { keyword: '재산세', category: '세금·공과금', source: 'ai' },
  { keyword: '국민연금', category: '세금·공과금', source: 'ai' },
  { keyword: '건강보험', category: '세금·공과금', source: 'ai' },
  { keyword: '고용보험', category: '세금·공과금', source: 'ai' },
  { keyword: '산재보험', category: '세금·공과금', source: 'ai' },
  { keyword: '주유', category: '유류비·교통비', source: 'ai' }, // 사업용 주유

  // ── 사업외 지출: 부채/금융 ──
  { keyword: '대출원금', category: '대출원금상환', source: 'ai' },
  { keyword: '원금상환', category: '대출원금상환', source: 'ai' },
  { keyword: '대출이자', category: '이자비용', source: 'ai' },
  { keyword: '이자납입', category: '이자비용', source: 'ai' },
  { keyword: '카드대금', category: '신용카드대금', source: 'ai' },
  { keyword: '카드결제대금', category: '신용카드대금', source: 'ai' },

  // ── 사업외 지출: 개인 생활 ──
  { keyword: '병원', category: '병원·약국비', source: 'ai' },
  { keyword: '약국', category: '병원·약국비', source: 'ai' },
  { keyword: '의원', category: '병원·약국비', source: 'ai' },
  { keyword: '치과', category: '병원·약국비', source: 'ai' },
  { keyword: '한의원', category: '병원·약국비', source: 'ai' },
  { keyword: '고속도로', category: '유류비·교통비', source: 'ai' },
  { keyword: '하이패스', category: '유류비·교통비', source: 'ai' },
  { keyword: '주차비', category: '유류비·교통비', source: 'ai' },
  { keyword: '버스', category: '유류비·교통비', source: 'ai' },
  { keyword: '지하철', category: '유류비·교통비', source: 'ai' },
  { keyword: '택시', category: '유류비·교통비', source: 'ai' },
  { keyword: 'KTX', category: '유류비·교통비', source: 'ai' },

  // ── 사업외 지출: 이전/저축 ──
  { keyword: '적금', category: '개인저축·투자', source: 'ai' },
  { keyword: '펀드', category: '개인저축·투자', source: 'ai' },
  { keyword: '증권', category: '개인저축·투자', source: 'ai' },
];
