import { GoogleGenAI, Type } from '@google/genai';
import { Transaction, Category, CategoryRule, AIReport, DeepDiveAIReport, LocationAnalysisReport, BusinessInfo } from '../types';

let ai: GoogleGenAI | null = null;

export const setGeminiApiKey = (apiKey: string) => {
  ai = new GoogleGenAI({ apiKey });
};

export const categorizeTransactions = async (
  transactions: Transaction[],
  categories: Category[],
  businessInfo: BusinessInfo
): Promise<Record<string, string>> => {
  if (!ai) throw new Error('Gemini API key is not set');
  
  const txList = transactions.map(t => ({ id: t.id, desc: t.description, isIncome: t.credit > 0 }));
  
  const prompt = `
  비즈니스: ${businessInfo.name} (${businessInfo.type})
  가능한 카테고리: ${categories.map(c => c.name).join(', ')}
  
  다음 거래 내역들을 적절한 카테고리로 분류해주세요.
  거래 내역:
  ${JSON.stringify(txList)}
  `;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
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
  
  try {
    const arr = JSON.parse(response.text || '[]');
    const map: Record<string, string> = {};
    arr.forEach((item: any) => {
      if (item.id && item.category) {
        map[item.id] = item.category;
      }
    });
    return map;
  } catch (e) {
    return {};
  }
};

export const generateInitialCategorizationRules = async (
  transactions: Transaction[],
  categories: Category[],
  businessInfo: BusinessInfo
): Promise<CategoryRule[]> => {
  if (!ai) throw new Error('Gemini API key is not set');
  
  const descriptions = Array.from(new Set(transactions.map(t => t.description))).slice(0, 100);
  
  const prompt = `
  비즈니스: ${businessInfo.name} (${businessInfo.type})
  카테고리 목록: ${categories.map(c => c.name).join(', ')}
  
  다음 거래내역 적요(description)들을 보고, 어떤 카테고리로 분류할지 규칙을 만들어주세요.
  적요 목록:
  ${descriptions.join('\n')}
  `;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            keyword: { type: Type.STRING, description: "거래내역 적요에 포함될 키워드" },
            category: { type: Type.STRING, description: "분류할 카테고리명" },
            source: { type: Type.STRING, description: "항상 'ai'로 설정" }
          },
          required: ["keyword", "category", "source"]
        }
      }
    }
  });
  
  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
};

export const generateInitialCategories = async (
  businessInfo: BusinessInfo
): Promise<Category[]> => {
  if (!ai) throw new Error('Gemini API key is not set');
  
  const prompt = `
  사용자 비즈니스 정보:
  - 상호명: ${businessInfo.name}
  - 업종: ${businessInfo.type}
  - 취급 품목: ${businessInfo.items}
  
  위 비즈니스에 적합한 수입/지출 카테고리 목록을 생성해주세요.
  `;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "카테고리명 (예: 카드매출, 식자재, 임대료)" },
            level1: { type: Type.STRING, description: "수입 또는 지출" },
            level2: { type: Type.STRING, description: "영업 수익, 영업외 수익, 영업 비용, 사업외 지출 중 하나" },
            costGroup: { type: Type.STRING, description: "영업 비용인 경우: 인건비, 재료비, 고정비, 변동비 중 하나. 그 외는 null" },
            type: { type: Type.STRING, description: "operating_income, non_operating_income, operating_expense, non_operating_expense 중 하나" }
          },
          required: ["name", "level1", "level2", "type"]
        }
      }
    }
  });
  
  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
};

export const generateFinancialReport = async (
  transactions: Transaction[],
  businessInfo: BusinessInfo,
  categories: Category[]
): Promise<AIReport> => {
  if (!ai) throw new Error('Gemini API key is not set');
  
  const prompt = `
  비즈니스: ${businessInfo.name} (${businessInfo.type})
  거래 건수: ${transactions.length}건
  
  위 데이터를 바탕으로 재무 요약 보고서를 작성해주세요.
  `;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
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
  
  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { summary: '오류 발생', positivePoints: [], areasForImprovement: [], actionableSuggestions: [] };
  }
};

export const generateDeepDiveReport = async (
  transactions: Transaction[],
  businessInfo: BusinessInfo,
  categories: Category[]
): Promise<DeepDiveAIReport> => {
  if (!ai) throw new Error('Gemini API key is not set');
  
  const prompt = `
  비즈니스: ${businessInfo.name} (${businessInfo.type})
  
  심층 재무 분석 보고서를 작성해주세요.
  `;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
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
  
  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { executiveSummary: '오류 발생', financialHealthAnalysis: [], strategicRecommendations: [], riskAssessment: [] };
  }
};

export const generateLocationAnalysisReport = async (
  businessInfo: BusinessInfo,
  transactions: Transaction[]
): Promise<LocationAnalysisReport> => {
  if (!ai) throw new Error('Gemini API key is not set');
  
  const prompt = `
  비즈니스: ${businessInfo.name} (${businessInfo.type})
  주소: ${businessInfo.address || '알 수 없음'}
  
  상권 분석 보고서를 작성해주세요.
  `;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
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
            },
            required: ["strengths", "weaknesses", "opportunities", "threats"]
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
              },
              required: ["competitorName", "description", "strength", "weakness"]
            }
          },
          positioningMap: {
            type: Type.OBJECT,
            properties: {
              xAxis: {
                type: Type.OBJECT,
                properties: { label: { type: Type.STRING }, min: { type: Type.STRING }, max: { type: Type.STRING } },
                required: ["label", "min", "max"]
              },
              yAxis: {
                type: Type.OBJECT,
                properties: { label: { type: Type.STRING }, min: { type: Type.STRING }, max: { type: Type.STRING } },
                required: ["label", "min", "max"]
              },
              points: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    isSelf: { type: Type.BOOLEAN }
                  },
                  required: ["name", "x", "y", "isSelf"]
                }
              }
            },
            required: ["xAxis", "yAxis", "points"]
          },
          marketingMix4P: {
            type: Type.OBJECT,
            properties: {
              product: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["title", "description"] } },
              price: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["title", "description"] } },
              place: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["title", "description"] } },
              promotion: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["title", "description"] } }
            },
            required: ["product", "price", "place", "promotion"]
          }
        },
        required: ["swotAnalysis", "competitorAnalysis", "positioningMap", "marketingMix4P"]
      }
    }
  });
  
  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return {
      swotAnalysis: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
      competitorAnalysis: [],
      positioningMap: { xAxis: { label: '', min: '', max: '' }, yAxis: { label: '', min: '', max: '' }, points: [] },
      marketingMix4P: { product: [], price: [], place: [], promotion: [] }
    };
  }
};

export const suggestFixedCostCategories = async (
  categories: Category[],
  businessInfo: BusinessInfo
): Promise<string[]> => {
  if (!ai) throw new Error('Gemini API key is not set');
  
  const prompt = `
  비즈니스: ${businessInfo.name} (${businessInfo.type})
  카테고리 목록: ${categories.map(c => c.name).join(', ')}
  
  위 카테고리 중 '고정비'에 해당하는 카테고리 이름들을 배열로 반환해주세요. (예: 임대료, 통신비, 보험료 등)
  `;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  
  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
};
