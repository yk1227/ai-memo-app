import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인해주세요.' },
      { status: 500 },
    )
  }

  let title: string
  let content: string

  try {
    const body = await request.json()
    title = body.title
    content = body.content
  } catch {
    return NextResponse.json({ error: '요청 본문을 파싱할 수 없습니다.' }, { status: 400 })
  }

  if (!title || !content) {
    return NextResponse.json({ error: '제목과 내용이 필요합니다.' }, { status: 400 })
  }

  try {
    const ai = new GoogleGenAI({ apiKey })

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `다음 메모의 내용을 분석하여 핵심 키워드 태그 3~5개를 한국어로 추출해줘.
반드시 JSON 배열 형식으로만 응답해줘. 다른 설명이나 텍스트 없이 순수 JSON 배열만 출력해줘.
예시: ["회의", "기획", "Q3", "마케팅"]

제목: ${title}
내용:
${content}`,
    })

    const rawText = response.text?.trim() ?? ''

    let tags: string[] = []

    const jsonMatch = rawText.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (Array.isArray(parsed)) {
          tags = parsed
            .map((t: unknown) => String(t).replace(/^#/, '').trim())
            .filter(t => t.length > 0)
        }
      } catch {
        // fallback
      }
    }

    if (tags.length === 0) {
      tags = rawText
        .split(/[\n,]+/)
        .map(t => t.replace(/^#/, '').replace(/["\[\]]/g, '').trim())
        .filter(t => t.length > 0)
        .slice(0, 5)
    }

    const uniqueTags = [...new Set(tags)]

    return NextResponse.json({ tags: uniqueTags })
  } catch (error) {
    console.error('[AI 태그 생성 오류]', error)
    return NextResponse.json(
      { error: 'AI 태그 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 },
    )
  }
}
