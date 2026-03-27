import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Category, CategoryRule, AIReport, DeepDiveAIReport, LocationAnalysisReport, BusinessInfo } from '../types';

let apiKey: string | null = null;

// 빌드 시 환경변수로 제공된 API 키 (Vercel 환경변수 또는 .env 파일)
const ENV_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

/**
 * Gemini API 키를 설정합니다.
 */
export const setGeminiApiKey = (key: string) => {
  apiKey = key;
};

/**
 * 현재 설정된 API 키를 반환합니다 (환경변수 포함).
 */
export const getEffectiveApiKey = (): string => {
  return apiKey || localStorage.getItem('ai_finance_gemini_api_key') || ENV_API_KEY || '';
};

/**
 * 환경변수 API 키가 설정되어 있는지 확인합니다.
 */
export const hasEnvApiKey = (): boolean => {
  return !!ENV_API_KEY;
};

/**
 * Gemini API 인스턴스를 생성합니다.
 */
const getAI = () => {
  const key = getEffectiveApiKey();
  if (!key) {
    throw new Error("Gemini API 키가 설정되지 않았습니다. 설정 화면에서 키를 입력해주세요.");
  }
  if (!apiKey) apiKey = key; // 캐시
  return new GoogleGenAI({ apiKey: key });
};

/**
 * 거래 내역을 AI를 통해 카테고리화합니다.
 * @returns 거래 ID를 키로, 카테고리명을 값으로 하는 객체
 */
export const categorizeTransactions = async (
  transactions: Transaction[],
  categories: Category[],
  businessInfo: BusinessInfo
): Promise<Record<string, string>> => {
  const ai = getAI();
  
  const batchSize = 50;
  const results: Record<string, string> = {};
  
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    const incomeCategories = categories.filter(c => c.level1 === '수입').map(c => c.name).join(', ');
    const expenseCategories = categories.filter(c => c.level1 === '지출').map(c => c.name).join(', ');

    const prompt = `
당신은 소상공인 사업장의 통장 거래를 분류하는 전문 회계사입니다.

[사업장 정보]
업종: ${businessInfo.type} | 품목: ${businessInfo.items}
규모: ${businessInfo.businessScale || '소규모'} | 배달플랫폼: ${businessInfo.onlinePlatforms || '없음'}
원재료 매입처: ${businessInfo.rawMaterialSuppliers || '미상'}

[카테고리 - 방향별 분리]
▶ 수입 카테고리(입금 거래에만 사용 가능): ${incomeCategories}
▶ 지출 카테고리(출금 거래에만 사용 가능): ${expenseCategories}

[분류 원칙 - 반드시 준수]
★ 절대 규칙: 입금→수입 카테고리, 출금→지출 카테고리. 절대 혼용 금지.
  (이를 어기면 손익 계산 전체가 틀어짐)

★ 매출 패턴 (입금 → 수입):
- 배달의민족·배민·배민1·배민바로결제·배민포장주문·쿠팡이츠·쿠팡페이·요기요·먹깨비 입금 → 배달매출
- 배달수수료·메쉬·바로고·배민비즈머니 출금 → 배달수수료
- 땡겨요정산·땡겨요환급 입금 → 간편결제 (※배달매출 아님)
- 음식배달 입금 → 배달매출
- VAN정산·카드정산·POS정산 입금 → 카드매출
- "카드사명+숫자코드" 형태 입금(예: 삼성197963861, KB11610154, 신한13727349, 현142302158, NH17434147, 하나921404753, 우601987000, 롯데37865250, 739447034B, 739447034BC 등) → 카드매출
- 네이버페이정산·Npay·카카오페이·토스·엔에이치엔페이·페이코 입금 → 간편결제
- 시흥정산 입금 → 지역화폐 (※카드매출 아님, 시흥시 지역화폐)
- 제로페이·지역사랑상품권·온누리상품권 입금 → 지역화폐

★ 환급·환불 입금:
- "환급", "환불", "수수료환급", "우대환급", "KB환급", "삼성환급", "캐쉬백", "캐시백", "현금IC결제캐쉬백", "하나카드캐쉬백" 등 → 보험금·환급금
- "정부지원", "지원금", "보조금", "배달택배비지원" → 정부지원금
- "예금이자", "적금이자" → 이자수익

★ 보험사 패턴:
- 한화생명·삼성생명·교보생명·DB손해보험·DB손 + 출금 → 보험료
- 동일 보험사 + 입금 → 보험금·환급금

★ 대출/금융:
- "대출실행", "한도대출" 입금 → 차입금
- "원금상환", "대출이자" 출금 → 대출원금상환 / 이자비용
- 삼성카드·하나카드·신한카드대금·카드대금 출금 → 신용카드대금 (※삼성/하나 단독은 카드매출 아님)

★ 세금·공과금 (출금):
- 부가가치세·부가세·세외수입·세외수납·세외수입(ARS)·국세·종합소득세 → 세금·공과금
- 국민연금·건강보험·고용보험·산재보험·경찰청과태료·지방세 → 세금·공과금

★ 재료·식자재 납품업체 (출금):
- 강봉기(토담 옛날통닭)·참진푸드·스마일푸드·대경축산·창성수산 → 원재료(식자재) (주요 납품업체)
- "XX푸드", "XX식품" 형태 → 원재료(식자재)
- 장만길·글로벌유통·전현숙·벼룩유통 → 부자재(식용류) (식용유 납품)
- 창희민속제과 → 부자재(기타)
- 광성주류·"XX주류" → 부자재(주류)
- 이디피·김현규이디피 → 부자재(음료)

★ 고정비·운영비 (출금):
- 케이투정보통신·케이투정보·KPN·코페이·KICC → 포스·시스템비 (POS 시스템)
- 쿠쿠렌탈 → 렌탈비
- 경동석유·목감행복주유·금강석유·"XX석유" 주유소 → 유류비·교통비
- 광명종합주방·세스코 → 수선유지비
- 한국외식업중앙회 → 기타사업비 (조합비)

★ 마트·편의점 (출금):
- 지에스25·GS25·노브랜드·진로마트·가나안덕·지에스더프레시 → 마트·편의점구입

★ 개인 지출 (출금):
- 병원·치과·의원·한의원·약국·정형외과·내과 → 병원·약국비
- 주유·하이패스·고속도로·석유 → 유류비·교통비
- 도시가스·가스비·가스요금·"XX월 가스" → 도시가스비
- 메가엠지씨커피·소플러스 → 개인식비 (사업장 주변 개인 카페·음식점)
- 쿠팡와우월회비 → 개인식비

★ 판단 불가 폴백:
- 입금이고 위 패턴 해당 없음 → 기타매출
- 출금이고 위 패턴 해당 없음 → 기타사업비

[거래 내역] (ID | 적요 | 출금 | 입금)
${batch.map(t => `${t.id} | ${t.description} | 출금:${t.debit > 0 ? t.debit.toLocaleString() : '-'} | 입금:${t.credit > 0 ? t.credit.toLocaleString() : '-'}`).join('\n')}

JSON 배열로만 응답: [{"id":"거래ID","category":"카테고리명"}]
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                category: { type: Type.STRING }
              },
              required: ["id", "category"]
            }
          }
        }
      });

      const aiResults = JSON.parse(response.text);
      aiResults.forEach((res: any) => {
        results[res.id] = res.category;
      });
    } catch (err) {
      console.error('AI Categorization Error:', err);
    }
  }

  return results;
};

/**
 * 초기 카테고리화 규칙을 생성합니다.
 */
export const generateInitialCategorizationRules = async (
  transactions: Transaction[],
  categories: Category[],
  businessInfo: BusinessInfo
): Promise<CategoryRule[]> => {
  const ai = getAI();
  const uniqueDescriptions = Array.from(new Set(transactions.map(t => t.description))).slice(0, 100);
  
  const prompt = `
    다음 거래 내역 설명들을 보고, 반복적으로 나타나는 키워드에 대해 카테고리 분류 규칙을 만들어주세요.
    사업자 정보: ${JSON.stringify(businessInfo)}
    가능한 카테고리 목록: ${categories.map(c => c.name).join(', ')}
    
    거래 내역 설명 예시:
    ${uniqueDescriptions.join(', ')}
    
    응답은 반드시 다음 JSON 형식의 배열로만 해주세요:
    [{"keyword": "키워드", "category": "추천카테고리명", "source": "ai"}]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING },
              category: { type: Type.STRING },
              source: { type: Type.STRING, enum: ["ai"] }
            },
            required: ["keyword", "category", "source"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (err) {
    console.error('Generate Rules Error:', err);
    return [];
  }
};

/**
 * 업종에 맞는 초기 카테고리 목록을 생성합니다.
 */
export const generateInitialCategories = async (businessInfo: BusinessInfo): Promise<Category[]> => {
  const ai = getAI();

  const scaleContext = businessInfo.businessScale === '대규모'
    ? '월매출 1억원 이상의 비교적 큰 규모 (직원 10명 이상, 세무사 관리, 복잡한 비용 구조)'
    : businessInfo.businessScale === '중규모'
    ? '월매출 3천만~1억원 규모 (직원 4~10명, 배달+홀 병행, 다양한 매입처)'
    : '월매출 3천만원 이하의 소규모 (1~3인 운영, 간단한 비용 구조, 사장님이 직접 관리)';

  const prompt = `
당신은 소상공인 사업장을 수년간 운영해온 경험 많은 사장님의 관점에서 재무 카테고리를 만들어주는 전문가입니다.
회계사가 아닌 사장님 눈높이에서 "내 돈이 어디서 들어오고 어디로 나가는지" 한눈에 파악할 수 있는 현실적인 카테고리를 만들어주세요.

[사업장 정보]
- 업종: ${businessInfo.type}
- 주요 취급 품목/서비스: ${businessInfo.items}
- 사업장 규모: ${scaleContext}
- 온라인/배달 플랫폼: ${businessInfo.onlinePlatforms || '없음'}
- 원재료 매입처: ${businessInfo.rawMaterialSuppliers || '미상'}
- 부재료 매입처: ${businessInfo.subsidiaryMaterialSuppliers || '미상'}
- 기타 수입원: ${businessInfo.otherRevenueSources || '없음'}

[카테고리 생성 원칙]

★ 매출(영업 수익)은 "통장에 돈이 들어오는 방식" 기준으로 나누세요
   - 카드매출: POS 카드단말기 → VAN사 정산 입금
   - 배달매출: 배달앱(배달의민족·쿠팡이츠·요기요) 정산 입금
   - 간편결제: 네이버페이·카카오페이·토스 (POS에 안 잡히고 직접 통장 입금)
   - 지역화폐: 제로페이·지역사랑상품권 (POS에서 현금으로 보이지만 별도 정산)
   - 현금매출: 손님이 직접 낸 현금 (POS 현금결제)
   - 입점몰매출: 쿠팡·스마트스토어 등 온라인 플랫폼 대행 판매 정산 (해당 업종만)
   - 세금계산서매출: B2B 거래처 계좌이체 (세금계산서 발행분, 해당 업종만)
   - 이 업종·규모에 실제로 해당하는 매출 유형만 포함하세요

★ 영업외 수익(기타 입금)
   - 정부지원금: 소상공인 지원금, 재난지원금, 보조금
   - 차입금: 대출 실행, 지인 차입 (수익이 아니지만 통장에 들어오는 돈 - 별도 표시됨)
   - 부업·사이드수입: 주업 외 다른 수입
   - 보험금·환급금: 보험사 지급금, 세금환급, 보증금 반환
   - 이자수익: 예금·적금 이자

★ 지출(영업 비용)은 사장님이 "이번 달 여기서 많이 썼네" 하고 바로 알 수 있는 항목으로
   - 인건비: 규모에 맞게 (소규모는 '알바비' 하나면 충분, 대규모는 직종별 구분)
   - 재료비: 이 업종에서 사용하는 주요 재료 종류별로 구체적으로
   - 고정비: 매달 꼬박꼬박 나가는 돈 (임대료, 전기, 가스, 통신, 보험 등)
   - 변동비: 매출에 따라 오르내리는 비용 (배달수수료, 광고비, 포장재 등)

★ 사업외 지출 — 통장에서 나가지만 사업비가 아닌 것 (반드시 포함)
   부채/금융: 대출원금상환, 이자비용, 신용카드대금
   개인생활: 병원·약국비, 개인식비, 개인통신·보험, 유류비·교통비
   이전/이체: 가족용돈·생활비, 개인저축·투자
   기타: 기타출금 (미분류 기본값)

★ 카테고리 개수: 너무 세분화하지 말고 실제로 구분 가능한 수준으로
   - 소규모: 전체 18~22개 내외
   - 중규모: 전체 22~30개 내외
   - 대규모: 전체 30~38개 내외
★ 이 업종(${businessInfo.type})에서 자주 쓰는 비용 항목은 반드시 포함하세요

각 카테고리는 다음 필드를 포함해야 합니다:
- name: 계정명 (사장님이 바로 이해할 수 있는 직관적인 이름, 10자 이내)
- level1: '수입' 또는 '지출'
- level2: '영업 수익', '영업외 수익', '영업 비용', '사업외 지출' 중 하나
- costGroup: '인건비', '재료비', '고정비', '변동비' 중 하나 (영업 비용만, 나머지는 null)
- type: 'operating_income', 'non_operating_income', 'operating_expense', 'non_operating_expense' 중 하나

반드시 JSON 배열 형식으로만 응답하세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              level1: { type: Type.STRING, enum: ["수입", "지출"] },
              level2: { type: Type.STRING, enum: ["영업 수익", "영업외 수익", "영업 비용", "사업외 지출"] },
              costGroup: { type: Type.STRING, nullable: true },
              type: { type: Type.STRING, enum: ["operating_income", "non_operating_income", "operating_expense", "non_operating_expense"] }
            },
            required: ["name", "level1", "level2", "type"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (err) {
    console.error('Generate Categories Error:', err);
    return [];
  }
};

/**
 * 재무 분석 보고서를 생성합니다.
 */
export const generateFinancialReport = async (
  transactions: Transaction[],
  businessInfo: BusinessInfo,
  categories: Category[]
): Promise<AIReport> => {
  const ai = getAI();
  
  // 데이터 요약 (AI 토큰 절약을 위해)
  const summary = transactions.reduce((acc: any, t) => {
    const month = t.date.toISOString().slice(0, 7);
    if (!acc[month]) acc[month] = { income: 0, expense: 0 };
    if (t.credit > 0) acc[month].income += t.credit;
    if (t.debit > 0) acc[month].expense += t.debit;
    return acc;
  }, {});

  const prompt = `
    다음은 소상공인 사업자의 월별 재무 요약 데이터입니다.
    사업자 정보: ${JSON.stringify(businessInfo)}
    재무 요약: ${JSON.stringify(summary)}
    카테고리 목록: ${categories.map(c => c.name).join(', ')}
    
    이 데이터를 분석하여 경영 보고서를 작성해주세요.
    - summary: 전체적인 경영 상태 요약 (한 문장)
    - positivePoints: 긍정적인 지표들 (배열)
    - areasForImprovement: 개선이 필요한 부분들 (배열)
    - actionableSuggestions: 구체적인 실행 제안 (title, description 포함 배열)
    
    응답은 반드시 JSON 형식으로 해주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            positivePoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionableSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "description"]
              }
            }
          },
          required: ["summary", "positivePoints", "areasForImprovement", "actionableSuggestions"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (err) {
    console.error('Generate Report Error:', err);
    throw err;
  }
};

/**
 * 심층 분석 보고서를 생성합니다.
 */
export const generateDeepDiveReport = async (
  transactions: Transaction[],
  businessInfo: BusinessInfo,
  categories: Category[]
): Promise<DeepDiveAIReport> => {
  const ai = getAI();
  
  const prompt = `
    다음 사업자의 거래 데이터를 바탕으로 심층 경영 진단을 수행해주세요.
    사업자 정보: ${JSON.stringify(businessInfo)}
    거래 건수: ${transactions.length}건
    카테고리 목록: ${categories.map(c => c.name).join(', ')}
    
    다음 항목을 포함한 상세 보고서를 작성해주세요:
    - executiveSummary: 핵심 요약
    - financialHealthAnalysis: 재무 건전성 분석 (title, analysis, score(0-100))
    - strategicRecommendations: 전략적 권고 사항 (title, description, expectedImpact)
    - riskAssessment: 리스크 평가 (risk, mitigation)
    
    응답은 반드시 JSON 형식으로 해주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            financialHealthAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  analysis: { type: Type.STRING },
                  score: { type: Type.NUMBER }
                },
                required: ["title", "analysis", "score"]
              }
            },
            strategicRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  expectedImpact: { type: Type.STRING }
                },
                required: ["title", "description", "expectedImpact"]
              }
            },
            riskAssessment: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  risk: { type: Type.STRING },
                  mitigation: { type: Type.STRING }
                },
                required: ["risk", "mitigation"]
              }
            }
          },
          required: ["executiveSummary", "financialHealthAnalysis", "strategicRecommendations", "riskAssessment"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (err) {
    console.error('Generate Deep Dive Error:', err);
    throw err;
  }
};

/**
 * 상권 및 경쟁 분석 보고서를 생성합니다.
 */
export const generateLocationAnalysisReport = async (
  businessInfo: BusinessInfo,
  transactions: Transaction[]
): Promise<LocationAnalysisReport> => {
  const ai = getAI();
  
  const prompt = `
    다음 사업장 정보를 바탕으로 가상의 상권 분석 및 경쟁사 분석 보고서를 생성해주세요.
    (실제 데이터가 없으므로 업종과 위치 정보를 기반으로 한 전문적인 추정치를 제공해주세요)
    사업자 정보: ${JSON.stringify(businessInfo)}
    거래 건수: ${transactions.length}건
    
    포함할 내용:
    - swotAnalysis: SWOT 분석 (strengths, weaknesses, opportunities, threats)
    - competitorAnalysis: 경쟁사 분석 (competitorName, description, strength, weakness)
    - positioningMap: 포지셔닝 맵 데이터 (xAxis, yAxis, points)
    - marketingMix4P: 4P 마케팅 믹스 (product, price, place, promotion)
    
    응답은 반드시 JSON 형식으로 해주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            swotAnalysis: {
              type: Type.OBJECT,
              properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                threats: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            competitorAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  competitorName: { type: Type.STRING },
                  description: { type: Type.STRING },
                  strength: { type: Type.STRING },
                  weakness: { type: Type.STRING }
                }
              }
            },
            positioningMap: {
              type: Type.OBJECT,
              properties: {
                xAxis: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, min: { type: Type.STRING }, max: { type: Type.STRING } } },
                yAxis: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, min: { type: Type.STRING }, max: { type: Type.STRING } } },
                points: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                      isSelf: { type: Type.BOOLEAN }
                    }
                  }
                }
              }
            },
            marketingMix4P: {
              type: Type.OBJECT,
              properties: {
                product: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } } } },
                price: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } } } },
                place: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } } } },
                promotion: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } } } }
              }
            }
          },
          required: ["swotAnalysis", "competitorAnalysis", "positioningMap", "marketingMix4P"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (err) {
    console.error('Generate Location Analysis Error:', err);
    throw err;
  }
};
