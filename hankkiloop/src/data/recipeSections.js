import { loadRecipeCatalog } from './recipeApi'

const SOURCE_TYPES = new Set(['youtube', 'blog', 'fridge'])

function normalizeRecommendationIds(ids = []) {
  return [
    ...new Set(
      ids
        .map((id) => String(id ?? '').trim())
        .filter(Boolean)
    ),
  ]
}

/**
 * 이미 불러온 recipes 배열을 탭 기준으로 분류
 *
 * 반환:
 * {
 *   ai: [],       // Gemini가 추천한 레시피 2~3개
 *   youtube: [],  // source_type = youtube
 *   blog: [],     // source_type = blog
 *   fridge: [],   // source_type = fridge
 *   other: [],    // 그 외
 *   all: []       // 전체
 * }
 *
 * 중요한 점:
 * AI 추천은 source_type이 아니라 "추천 결과"다.
 * 따라서 AI 추천된 레시피도 원래 youtube/blog/fridge 그룹에 그대로 남는다.
 */
export function groupRecipeSections(
  recipes = [],
  aiRecommendationIds = []
) {
  const recommendationIds =
    normalizeRecommendationIds(aiRecommendationIds)

  const recipeById = new Map(
    recipes.map((recipe) => [
      String(recipe.id),
      recipe,
    ])
  )

  // Gemini가 준 순서를 그대로 유지
  // 최대 3개까지만 표시
  const ai = recommendationIds
    .map((id) => recipeById.get(id))
    .filter(Boolean)
    .slice(0, 3)

  const youtube = []
  const blog = []
  const fridge = []
  const other = []

  for (const recipe of recipes) {
    switch (recipe.sourceType) {
      case 'youtube':
        youtube.push(recipe)
        break

      case 'blog':
        blog.push(recipe)
        break

      case 'fridge':
        fridge.push(recipe)
        break

      default:
        other.push(recipe)
        break
    }
  }

  return {
    ai,
    youtube,
    blog,
    fridge,
    other,
    all: recipes,
  }
}

/**
 * Supabase 레시피 DB를 읽고 자동 분류
 *
 * recipeApi.js의 loadRecipeCatalog()을 재사용하므로
 * DB 조회 로직을 중복 작성하지 않는다.
 */
export async function loadRecipeSections(
  client,
  userId,
  {
    aiRecommendationIds = [],
  } = {}
) {
  const catalog = await loadRecipeCatalog(
    client,
    userId
  )

  return {
    ...catalog,

    sections: groupRecipeSections(
      catalog.recipes,
      aiRecommendationIds
    ),
  }
}

/**
 * Recipe.jsx 같은 화면에서
 * 현재 선택된 탭의 레시피만 꺼낼 때 사용
 */
export function getRecipesForSection(
  sections,
  tab
) {
  if (!sections) return []

  switch (tab) {
    case 'ai':
      return sections.ai ?? []

    case 'youtube':
      return sections.youtube ?? []

    case 'blog':
      return sections.blog ?? []

    case 'fridge':
      return sections.fridge ?? []

    case 'other':
      return sections.other ?? []

    case 'all':
    default:
      return sections.all ?? []
  }
}

/**
 * DB의 source_type이
 * 현재 앱에서 사용하는 정식 분류인지 확인
 */
export function isKnownRecipeSourceType(
  sourceType
) {
  return SOURCE_TYPES.has(sourceType)
}