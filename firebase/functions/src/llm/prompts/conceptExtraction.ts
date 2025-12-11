
export interface ConceptExtractionParams {
    title: string // 노트 제목
    content: string // 노트 내용
}

// 개념 추출 프롬프트
export function buildConceptExtractionPrompt(params: ConceptExtractionParams): string {
    const { title, content } = params

    return `Task: Analyze this technical document and extract key concepts for quiz generation.

Document Title: ${title}
Document Content:
${content}

## Instructions

1. **Identify ALL sections**: List every distinct topic/section in the document. Do NOT skip any section.

2. **Extract key concepts** (MAXIMUM 10 concepts total):
   - LIMIT: Extract only the TOP 10 most important concepts for interviews
   - Prioritize: critical > high > medium
   - Focus on specificity: concept/implementation over abstract
   - importance levels:
     - "critical": Must-know for interviews (limit to 3-5 max)
     - "high": Important supporting concepts
     - "medium": Nice-to-know details (avoid if possible)
   - types:
     - "term": Technical terminology (e.g., DOM, CSSOM, Reflow)
     - "process": Sequence/order that should be tested (e.g., rendering pipeline)
     - "comparison": Concepts that contrast with each other (e.g., Reflow vs Repaint)
     - "definition": Core definitions that explain what something IS
   - **specificity levels** (NEW - IMPORTANT):
     - "abstract": Category names, optimization strategies, general methods (e.g., "폰트 최적화", "이미지 최적화", "성능 개선")
       → These should NOT be used as quiz blanks
     - "concept": Core technical concepts, acronyms, phenomenon names (e.g., "CRP", "FOUC", "Reflow", "Repaint")
       → These are IDEAL for quiz blanks
     - "implementation": Specific APIs, attributes, properties, code syntax (e.g., "defer", "async", "preload", "font-display: swap")
       → These are IDEAL for quiz blanks

Return ONLY valid JSON:
{
  "concepts": [
    {
      "term": "개념명",
      "section": "해당 섹션명",
      "importance": "critical|high|medium",
      "type": "term|process|comparison|definition",
      "specificity": "abstract|concept|implementation",
      "context": "이 개념이 등장하는 문맥 (한 문장)"
    }
  ]
}

## SPECIFICITY EXAMPLES
✅ concept/implementation (GOOD for blanks):
  - "defer" (implementation) - specific HTML attribute
  - "preload" (implementation) - specific resource hint
  - "Reflow" (concept) - specific rendering concept

❌ abstract (BAD for blanks):
  - "폰트 최적화" (abstract) - general category
  - "이미지 최적화" (abstract) - general category
  - "CRP 최적화 전략" (abstract) - general strategy
  - "리소스 힌트 사용" (abstract) - general method

CRITICAL: Correctly classify specificity - abstract concepts should NOT become quiz blanks.
CRITICAL: MAXIMUM 10 concepts total. Only extract the most interview-essential concepts.`
}
