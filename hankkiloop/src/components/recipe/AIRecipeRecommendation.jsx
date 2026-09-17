import { Component, useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { sendChatMessage } from '../../data/chatApi'
import savingsCharacter from '../../assets/recipe-savings-character.jpg'

const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000
const FALLBACK_TEXT = '냉큼이가 준비중이에요~'

function readCache(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

function writeCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 캐시 저장 실패는 추천 표시 자체에 영향을 주지 않는다.
  }
}

function buildPrompt(fridgeItems = [], recipes = []) {
  const fridgeSummary = fridgeItems
    .filter((item) => item?.name)
    .slice()
    .sort((a, b) => {
      const aDays = Number.isFinite(a?.daysLeft) ? a.daysLeft : 9999
      const bDays = Number.isFinite(b?.daysLeft) ? b.daysLeft : 9999
      return aDays - bDays
    })
    .slice(0, 8)
    .map((item) => {
      const amount =
        Number.isFinite(Number(item?.amount)) && item?.unit
          ? `${Number(item.amount)}${item.unit}`
          : ''
      const expiry =
        Number.isFinite(item?.daysLeft)
          ? item.daysLeft < 0
            ? '소비기한 지남'
            : item.daysLeft === 0
              ? 'D-DAY'
              : `D-${item.daysLeft}`
          : ''

      return [item.name, amount, expiry].filter(Boolean).join(' ')
    })
    .join(', ')
    .slice(0, 430)

  const recipeTitles = recipes
    .map((recipe) => recipe?.title)
    .filter(Boolean)
    .slice(0, 8)
    .join(', ')
    .slice(0, 220)

  return [
    `현재 냉장고 재료: ${fridgeSummary || '등록된 재료 없음'}`,
    `한끼루프 레시피 후보: ${recipeTitles || '없음'}`,
    '현재 냉장고 재료로 만들기 좋은 1인 가구 메뉴 2~3개를 추천해줘.',
    '소비기한이 가까운 재료를 우선하고, 후보에 적절한 메뉴가 있으면 후보 메뉴명을 우선 사용해.',
    '한 줄로 짧게 답해. 형식: 메뉴명, 메뉴명 — 추천 이유',
  ].join('\n')
}

class RecommendationBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('AI recipe recommendation render failed:', error)
  }

  render() {
    if (this.state.failed) {
      return (
        <RecommendationCard
          message={FALLBACK_TEXT}
          loading={false}
          failed
          onRefresh={() => {}}
        />
      )
    }

    return this.props.children
  }
}

function RecommendationCard({ message, loading, failed, onRefresh }) {
  return (
    <section className="mt-7 flex min-w-0 items-start gap-3 rounded-2xl border border-[#dbe4f3] bg-[#eff4ff] p-4">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#006c49]/15">
        <img
          src={savingsCharacter}
          alt=""
          className="size-9 rounded-lg object-contain"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-[17px] leading-6 text-[#161c25]">
            AI 레시피 추천! 냉큼이가 추천해요~
          </h2>

          <button
            type="button"
            aria-label="AI 레시피 추천 새로고침"
            disabled={loading}
            onClick={onRefresh}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#006c49] hover:bg-white/70 disabled:opacity-40"
          >
            <RefreshCw
              aria-hidden="true"
              className={`size-3.5 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        <p className="mt-1 text-sm leading-[20px] text-[#3c4a42]">
          {message}
        </p>

        {failed && (
          <p className="mt-1 text-[11px] leading-4 text-[#839087]">
            AI 연결이 원활하지 않아도 레시피 목록은 그대로 이용할 수 있어요.
          </p>
        )}

        <p className="mt-1 text-[10px] leading-4 text-[#94a3b8]">
          새로고침하지 않으면 약 6시간마다 자동으로 다시 추천해요.
        </p>
      </div>
    </section>
  )
}

function AIRecipeRecommendationContent({
  userId = '',
  fridgeItems = [],
  recipes = [],
}) {
  const [recommendation, setRecommendation] = useState('')
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [nextRefreshAt, setNextRefreshAt] = useState(null)

  const loadingRef = useRef(false)
  const latestDataRef = useRef({ fridgeItems: [], recipes: [] })

  useEffect(() => {
    latestDataRef.current = {
      fridgeItems: Array.isArray(fridgeItems) ? fridgeItems : [],
      recipes: Array.isArray(recipes) ? recipes : [],
    }
  }, [fridgeItems, recipes])

  const cacheKey = `hankkiloop:ai-recipe-recommendation:${userId || 'anonymous'}`

  const refresh = useCallback(async () => {
    if (loadingRef.current) return

    const now = Date.now()
    const previous = readCache(cacheKey) || {}
    const currentFridgeItems = latestDataRef.current.fridgeItems
    const currentRecipes = latestDataRef.current.recipes

    loadingRef.current = true
    setLoading(true)
    setFailed(false)

    writeCache(cacheKey, {
      ...previous,
      attemptedAt: now,
    })
    setNextRefreshAt(now + REFRESH_INTERVAL_MS)

    if (!currentFridgeItems.length) {
      setRecommendation('')
      setFailed(false)
      loadingRef.current = false
      setLoading(false)
      return
    }

    try {
      const result = await sendChatMessage([
        {
          role: 'user',
          content: buildPrompt(currentFridgeItems, currentRecipes),
        },
      ])

      const answer =
        typeof result?.answer === 'string' ? result.answer.trim() : ''

      if (!answer) throw new Error('추천 결과가 비어 있습니다.')

      const completedAt = Date.now()

      setRecommendation(answer)
      setFailed(false)
      setNextRefreshAt(completedAt + REFRESH_INTERVAL_MS)

      writeCache(cacheKey, {
        answer,
        refreshedAt: completedAt,
        attemptedAt: completedAt,
      })
    } catch (error) {
      console.warn('AI recipe recommendation unavailable:', error)

      if (typeof previous?.answer === 'string' && previous.answer.trim()) {
        setRecommendation(previous.answer.trim())
      } else {
        setRecommendation('')
      }

      setFailed(true)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [cacheKey])

  useEffect(() => {
    const cached = readCache(cacheKey)
    const now = Date.now()

    if (typeof cached?.answer === 'string' && cached.answer.trim()) {
      setRecommendation(cached.answer.trim())
    } else {
      setRecommendation('')
    }

    const lastAttempt =
      Number(cached?.attemptedAt) ||
      Number(cached?.refreshedAt) ||
      0

    if (!lastAttempt || now - lastAttempt >= REFRESH_INTERVAL_MS) {
      refresh()
    } else {
      setNextRefreshAt(lastAttempt + REFRESH_INTERVAL_MS)
    }
  }, [cacheKey, refresh])

  useEffect(() => {
    if (!nextRefreshAt) return undefined

    const delay = Math.max(1000, nextRefreshAt - Date.now())
    const timer = setTimeout(() => {
      refresh()
    }, delay)

    return () => clearTimeout(timer)
  }, [nextRefreshAt, refresh])

  const currentFridgeItems = Array.isArray(fridgeItems) ? fridgeItems : []
  const hasIngredients = currentFridgeItems.length > 0

  const message = recommendation
    ? recommendation
    : !hasIngredients
      ? '냉장고에 재료를 등록하면 냉큼이가 메뉴를 추천해드려요.'
      : FALLBACK_TEXT

  return (
    <RecommendationCard
      message={message}
      loading={loading}
      failed={failed}
      onRefresh={refresh}
    />
  )
}

export default function AIRecipeRecommendation(props) {
  return (
    <RecommendationBoundary>
      <AIRecipeRecommendationContent {...props} />
    </RecommendationBoundary>
  )
}
