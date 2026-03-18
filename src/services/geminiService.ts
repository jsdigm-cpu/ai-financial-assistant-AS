import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Category, CategoryRule, AIReport, DeepDiveAIReport, LocationAnalysisReport, BusinessInfo } from '../types';

let apiKey: string | null = null;

/**
 * Gemini API 키를 설정합니다.
 */
export const setGeminiApiKey = (key: string) => {
  apiKey = key;
};

/**
 * Gemini API 인스턴스를 생성합니다.
 */
const getAI = () => {
  if (!apiKey) {
    // 로컬 스토리지에서 시도
    const savedKey = localStorage.getItem('ai_finance_gemini_api_key');
    if (savedKey) {
      apiKey = savedKey;
    } else {
      throw new Error("Gemini API 키가 설정되지 않았습니다. 설정 화면에서 키를 입력해주세요.");
    }
  }
  return new GoogleGenAI({ apiKey: apiKey! });
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
    const prompt = `
      다음은 소상공인 사업자의 은행 거래 내역입니다. 
      사업자 정보: ${JSON.stringify(businessInfo)}
      가능한 카테고리 목록: ${categories.map(c => c.name).join(', ')}
      
      각 거래 내역의 'description'을 보고 가장 적절한 카테고리를 선택해주세요.
      거래 내역:
      ${batch.map(t => `- ID: ${t.id}, 내용: ${t.description}, 출금: ${t.debit}, 입금: ${t.credit}`).join('\n')}
      
      응답은 반드시 다음 JSON 형식의 배열로만 해주세요:
      [{"id": "거래ID", "category": "카테고리명"}]
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
      model: "gemini-3-flash-preview",
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
  const prompt = `
    다음 사업자 정보를 바탕으로, 이 사업자에게 필요한 표준 재무 카테고리(계정과목) 목록을 생성해주세요.
    사업자 정보: ${JSON.stringify(businessInfo)}
    
    각 카테고리는 다음 정보를 포함해야 합니다:
    - name: 계정명 (예: '카드매출', '임차료', '원재료비')
    - level1: '수입' 또는 '지출'
    - level2: '영업 수익', '영업외 수익', '영업 비용', '사업외 지출' 중 하나
    - costGroup: '인건비', '재료비', '고정비', '변동비' 중 하나 (영업 비용인 경우만, 아니면 null)
    - type: 'operating_income', 'non_operating_income', 'operating_expense', 'non_operating_expense' 중 하나
    
    응답은 반드시 JSON 배열 형식으로 해주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
      model: "gemini-3-flash-preview",
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
      model: "gemini-3-flash-preview",
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
      model: "gemini-3-flash-preview",
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
