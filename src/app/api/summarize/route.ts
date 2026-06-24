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
      contents: `다음 메모를 한국어로 3~4문장으로 핵심만 요약해줘.\n\n제목: ${title}\n내용:\n${content}`,
    })

    return NextResponse.json({ summary: response.text })
  } catch (error) {
    console.error('[AI 요약 오류]', error)
    return NextResponse.json(
      { error: 'AI 요약 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 },
    )
  }
}
