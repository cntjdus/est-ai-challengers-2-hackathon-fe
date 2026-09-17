$ErrorActionPreference = "Stop"

$root = (Get-Location).Path

function Resolve-ProjectFile($relative) {
    $direct = Join-Path $root $relative
    if (Test-Path $direct) { return $direct }

    $nested = Join-Path $root ("hankkiloop\" + $relative)
    if (Test-Path $nested) { return $nested }

    throw "$relative 파일을 찾지 못했습니다. hankkiloop 폴더 또는 저장소 루트에서 실행해주세요."
}

function Write-Utf8NoBom($path, $content) {
    [System.IO.File]::WriteAllText(
        $path,
        $content,
        [System.Text.UTF8Encoding]::new($false)
    )
}

$appFile = Resolve-ProjectFile "src\App.jsx"
$recipeFile = Resolve-ProjectFile "src\pages\Recipe.jsx"

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item $appFile "$appFile.bak-$stamp"
Copy-Item $recipeFile "$recipeFile.bak-$stamp"

# ------------------------------------------------------------
# 1. App.jsx - 실제 냉장고 표시 데이터를 Recipe 컴포넌트로 전달
# ------------------------------------------------------------
$app = Get-Content $appFile -Raw -Encoding UTF8

if (-not $app.Contains("fridgeItems={buildFridgeItems(inventory, registeredMaterials, notificationNow)}")) {
    $anchor = "              allergyNotice={allergyNotice}"
    if (-not $app.Contains($anchor)) {
        throw "App.jsx에서 Recipe의 allergyNotice prop을 찾지 못했습니다."
    }

    $replacement = @"
              allergyNotice={allergyNotice}
              fridgeItems={buildFridgeItems(inventory, registeredMaterials, notificationNow)}
"@.TrimEnd()

    $app = $app.Replace($anchor, $replacement)
}

Write-Utf8NoBom $appFile $app

# ------------------------------------------------------------
# 2. Recipe.jsx - 기존 /api/chat Gemini 연결을 사용해 AI 추천 표시
# ------------------------------------------------------------
$recipe = Get-Content $recipeFile -Raw -Encoding UTF8

# chat API import
if (-not $recipe.Contains("from '../data/chatApi'")) {
    $anchor = "import RecipeCard from '../components/recipe/RecipeCard'"
    if (-not $recipe.Contains($anchor)) {
        throw "Recipe.jsx에서 RecipeCard import를 찾지 못했습니다."
    }
    $recipe = $recipe.Replace(
        $anchor,
        "$anchor`nimport { sendChatMessage } from '../data/chatApi'"
    )
}

# helper 함수
if (-not $recipe.Contains("const AI_RECOMMENDATION_CACHE_TTL")) {
    $anchor = "// Database catalog is supplied by App."
    if (-not $recipe.Contains($anchor)) {
        throw "Recipe.jsx에서 Database catalog 주석을 찾지 못했습니다."
    }

    $helpers = @'
const AI_RECOMMENDATION_CACHE_TTL = 10 * 60 * 1000

const fridgeItemLabel = (item) => {
  const amount =
    Number.isFinite(Number(item?.amount)) && item?.unit
      ? ` ${Number(item.amount)}${item.unit}`
      : ''
  const expiry =
    Number.isFinite(item?.daysLeft)
      ? item.daysLeft < 0
        ? ' (소비기한 지남)'
        : item.daysLeft === 0
          ? ' (D-DAY)'
          : ` (D-${item.daysLeft})`
      : ''

  return `${item?.name ?? ''}${amount}${expiry}`.trim()
}

const recommendationSignature = (fridgeItems = [], recipes = []) => {
  const fridge = fridgeItems
    .filter((item) => item?.name)
    .map((item) => `${item.name}:${item.amount ?? ''}:${item.unit ?? ''}:${item.daysLeft ?? ''}`)
    .sort()
    .join('|')
  const catalog = recipes
    .map((recipe) => `${recipe?.id ?? ''}:${recipe?.title ?? ''}`)
    .sort()
    .join('|')

  return `${fridge}::${catalog}`
}

const hashSignature = (value) => {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

const buildAiRecommendationPrompt = (fridgeItems = [], recipes = []) => {
  const fridgeSummary = fridgeItems
    .filter((item) => item?.name && item?.daysLeft !== -Infinity)
    .slice()
    .sort((a, b) => {
      const aDays = Number.isFinite(a?.daysLeft) ? a.daysLeft : 9999
      const bDays = Number.isFinite(b?.daysLeft) ? b.daysLeft : 9999
      return aDays - bDays
    })
    .slice(0, 18)
    .map(fridgeItemLabel)
    .join(', ')
    .slice(0, 520)

  const recipeTitles = recipes
    .map((recipe) => recipe?.title)
    .filter(Boolean)
    .slice(0, 15)
    .join(', ')
    .slice(0, 240)

  return [
    `현재 냉장고 재료: ${fridgeSummary || '등록된 재료 없음'}`,
    `한끼루프 DB 레시피 후보: ${recipeTitles || '후보 없음'}`,
    '위 냉장고 재료를 최대한 활용해 1인 가구가 만들기 좋은 메뉴 2~3개를 추천해줘.',
    '소비기한이 임박한 재료를 우선하고, DB 후보와 맞는 메뉴가 있으면 후보의 메뉴명을 그대로 우선 사용해.',
    "출력은 반드시 '메뉴명, 메뉴명, 메뉴명 — 짧은 추천 이유' 형태의 한 줄만 작성해. 번호, 불릿, 마크다운은 쓰지 마.",
  ].join('\n')
}

'@

    $recipe = $recipe.Replace($anchor, $helpers + $anchor)
}

# fridgeItems prop
if (-not [regex]::IsMatch($recipe, "fridgeItems\s*=\s*\[\]")) {
    $multilineProp = "  recipes = [],"
    if ($recipe.Contains($multilineProp)) {
        $recipe = $recipe.Replace(
            $multilineProp,
            "  recipes = [],`n  fridgeItems = [],"
        )
    } elseif ($recipe.Contains("export default function Recipe({ recipes = [],")) {
        $recipe = $recipe.Replace(
            "export default function Recipe({ recipes = [],",
            "export default function Recipe({ recipes = [], fridgeItems = [],"
        )
    } else {
        throw "Recipe.jsx의 recipes prop 위치를 찾지 못했습니다."
    }
}

# AI 상태
if (-not $recipe.Contains("const [aiRecommendation, setAiRecommendation]")) {
    $pattern = "(\s*const \[source, setSource\] = useState\([^\r\n]+\)\r?\n)"
    $stateBlock = @'
  const [aiRecommendation, setAiRecommendation] = useState('')
  const [aiRecommendationLoading, setAiRecommendationLoading] = useState(false)
  const [aiRecommendationError, setAiRecommendationError] = useState('')
  const aiRecommendationRequestRef = useRef(0)
  const aiRecommendationKey = recommendationSignature(fridgeItems, recipes)

'@

    $updated = [regex]::Replace(
        $recipe,
        $pattern,
        { param($m) $m.Groups[1].Value + $stateBlock },
        1
    )

    if ($updated -eq $recipe) {
        throw "Recipe.jsx에서 source state 위치를 찾지 못했습니다."
    }
    $recipe = $updated
}

# AI 요청 로직
if (-not $recipe.Contains("const requestAiRecommendation = async")) {
    $anchor = "  const consumableIngredients = suggestedIngredients.filter((ingredient) =>"
    if (-not $recipe.Contains($anchor)) {
        throw "Recipe.jsx에서 consumableIngredients 위치를 찾지 못했습니다."
    }

    $logic = @'
  const requestAiRecommendation = async ({ force = false } = {}) => {
    if (!fridgeItems.length) {
      setAiRecommendation('')
      setAiRecommendationError('')
      setAiRecommendationLoading(false)
      return
    }

    const requestId = ++aiRecommendationRequestRef.current
    const cacheKey = `hankkiloop:ai-recipe:${hashSignature(aiRecommendationKey)}`

    if (!force && typeof window !== 'undefined') {
      try {
        const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null')
        if (
          cached?.answer &&
          Number.isFinite(cached?.savedAt) &&
          Date.now() - cached.savedAt < AI_RECOMMENDATION_CACHE_TTL
        ) {
          setAiRecommendation(cached.answer)
          setAiRecommendationError('')
          setAiRecommendationLoading(false)
          return
        }
      } catch {
        // 잘못된 캐시는 무시하고 새로 추천한다.
      }
    }

    setAiRecommendationLoading(true)
    setAiRecommendationError('')

    try {
      const prompt = buildAiRecommendationPrompt(fridgeItems, recipes)
      const result = await sendChatMessage([{ role: 'user', content: prompt }])

      if (requestId !== aiRecommendationRequestRef.current) return

      const answer = result.answer.trim()
      setAiRecommendation(answer)

      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({ answer, savedAt: Date.now() }),
          )
        } catch {
          // 저장 공간 문제는 추천 자체에 영향을 주지 않는다.
        }
      }
    } catch (failure) {
      if (requestId !== aiRecommendationRequestRef.current) return
      setAiRecommendationError(
        failure?.message || 'AI 추천을 불러오지 못했어요.',
      )
    } finally {
      if (requestId === aiRecommendationRequestRef.current) {
        setAiRecommendationLoading(false)
      }
    }
  }

  useEffect(() => {
    if (!fridgeItems.length) {
      setAiRecommendation('')
      setAiRecommendationError('')
      setAiRecommendationLoading(false)
      return undefined
    }

    requestAiRecommendation()

    return () => {
      aiRecommendationRequestRef.current += 1
    }
    // aiRecommendationKey가 바뀌는 경우에만 새 추천을 요청한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiRecommendationKey])

'@

    $recipe = $recipe.Replace($anchor, $logic + $anchor)
}

# 기존 "예상 식비 절약 & 소진 효과" 카드를 AI 추천 카드로 교체
if (-not $recipe.Contains("AI 레시피 추천! 냉큼이가 추천해요~")) {
    $pattern = '(?s)<section className="mt-7 flex min-w-0 items-center gap-3 rounded-2xl border border-\[#dbe4f3\] bg-\[#eff4ff\] p-4">.*?예상 식비 절약 &amp; 소진 효과.*?</section>'

    $card = @'
<section className="mt-7 flex min-w-0 items-start gap-3 rounded-2xl border border-[#dbe4f3] bg-[#eff4ff] p-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#006c49]/15">
              <img src={savingsCharacter} alt="" className="size-9 rounded-lg object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-[17px] leading-6 text-[#161c25]">
                  AI 레시피 추천! 냉큼이가 추천해요~
                </h2>
                {fridgeItems.length > 0 && (
                  <button
                    type="button"
                    disabled={aiRecommendationLoading}
                    onClick={() => requestAiRecommendation({ force: true })}
                    className="shrink-0 rounded-lg border border-[#b9d6cc] bg-white/80 px-2 py-1 text-[11px] font-medium text-[#006c49] disabled:opacity-50"
                  >
                    {aiRecommendationLoading ? '추천 중' : '다시 추천'}
                  </button>
                )}
              </div>

              <p className="mt-1 text-sm leading-[20px] text-[#3c4a42]">
                {!fridgeItems.length
                  ? '냉장고에 재료를 등록하면 보유 재료를 바탕으로 메뉴를 추천해드려요.'
                  : aiRecommendationLoading
                    ? '냉큼이가 냉장고 재료와 소비기한을 살펴보고 있어요...'
                    : aiRecommendation ||
                      '냉장고 재료를 바탕으로 추천 메뉴를 준비하고 있어요.'}
              </p>

              {aiRecommendationError && (
                <p role="alert" className="mt-1.5 text-[11px] leading-4 text-[#b45309]">
                  {aiRecommendationError}
                </p>
              )}
            </div>
          </section>
'@

    $updated = [regex]::Replace($recipe, $pattern, $card, 1)
    if ($updated -eq $recipe) {
        throw "Recipe.jsx에서 기존 '예상 식비 절약 & 소진 효과' 카드를 찾지 못했습니다."
    }
    $recipe = $updated
}

Write-Utf8NoBom $recipeFile $recipe

Write-Host ""
Write-Host "AI 냉장고 레시피 추천 패치 완료" -ForegroundColor Green
Write-Host ""
Write-Host "수정 파일:"
Write-Host "- $appFile"
Write-Host "- $recipeFile"
Write-Host ""
Write-Host "동작:"
Write-Host "- 실제 냉장고 재료명/수량/소비기한을 Gemini에 전달"
Write-Host "- 현재 DB 레시피 후보도 함께 전달"
Write-Host "- 소비기한 임박 재료를 우선 사용하도록 추천"
Write-Host "- 제목: AI 레시피 추천! 냉큼이가 추천해요~"
Write-Host "- 같은 냉장고 상태에서는 10분간 sessionStorage 캐시"
Write-Host "- '다시 추천' 버튼으로 즉시 새 추천 가능"
Write-Host "- 기존 /api/chat 경로를 재사용하므로 API 키를 브라우저에 노출하지 않음"
Write-Host ""
Write-Host "다음 명령으로 확인하세요:"
Write-Host "npm run dev"
Write-Host ""
Write-Host "배포 전에는:"
Write-Host "npm run build"
