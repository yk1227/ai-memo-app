const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  // 1. 메인 페이지
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(__dirname, '01-main.png'), fullPage: false });
  console.log('✅ 01-main.png 캡처 완료');

  // 2. 새 메모 버튼 클릭
  await page.click('button:has-text("새 메모")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(__dirname, '02-form-open.png'), fullPage: false });
  console.log('✅ 02-form-open.png 캡처 완료');

  // 3. 제목 입력
  await page.fill('input#title', '마크다운 테스트');

  // 4. 마크다운 편집기 텍스트 입력 (CodeMirror 에디터)
  const editorTextarea = page.locator('.w-md-editor-text-input').first();
  await editorTextarea.click();
  await editorTextarea.fill(`# 제목입니다

**굵은 글자** 와 *이탤릭*

- 항목 1
- 항목 2
- 항목 3

> 인용문 테스트

\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\``);

  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(__dirname, '03-editor-with-preview.png'), fullPage: false });
  console.log('✅ 03-editor-with-preview.png 캡처 완료');

  // 5. 저장
  await page.click('button[type="submit"]:has-text("저장하기")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(__dirname, '04-after-save.png'), fullPage: false });
  console.log('✅ 04-after-save.png 캡처 완료');

  // 6. 저장된 카드 클릭 → 상세 뷰어
  const card = page.locator('[aria-label*="마크다운 테스트"]').first();
  await card.click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(__dirname, '05-detail-viewer.png'), fullPage: false });
  console.log('✅ 05-detail-viewer.png 캡처 완료');

  await browser.close();
  console.log('\n모든 스크린샷 캡처 완료!');
})();
