$ErrorActionPreference = "Stop"

$root = (Get-Location).Path

function Resolve-ProjectFile($relative) {
    $direct = Join-Path $root $relative
    if (Test-Path $direct) { return $direct }

    $nested = Join-Path $root ("hankkiloop\" + $relative)
    if (Test-Path $nested) { return $nested }

    throw "$relative 파일을 찾지 못했습니다. hankkiloop 폴더 또는 저장소 루트에서 실행해주세요."
}

$apiFile = Resolve-ProjectFile "src\data\recipeApi.js"
$recipeFile = Resolve-ProjectFile "src\pages\Recipe.jsx"

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item $apiFile "$apiFile.bak-$stamp"
Copy-Item $recipeFile "$recipeFile.bak-$stamp"

# 1) recipeApi.js:
# 기존 표시용 tag 문자열은 유지하면서 원본 tags 배열도 함께 전달
$api = Get-Content $apiFile -Raw -Encoding UTF8

$oldApi = "image: row.image_path, tag: (row.tags ?? []).join(' · '), benefit: '필요량과 냉장고 재고 비교',"
$newApi = "image: row.image_path, tags: Array.isArray(row.tags) ? row.tags : [], tag: (row.tags ?? []).join(' · '), benefit: '필요량과 냉장고 재고 비교',"

if ($api.Contains($oldApi)) {
    $api = $api.Replace($oldApi, $newApi)
} elseif (-not $api.Contains("tags: Array.isArray(row.tags)")) {
    throw "recipeApi.js에서 예상한 tags 매핑 위치를 찾지 못했습니다. 파일이 예상과 다릅니다."
}

[System.IO.File]::WriteAllText($apiFile, $api, [System.Text.UTF8Encoding]::new($false))

# 2) Recipe.jsx:
# AI 추천은 기존 동작 유지.
# 유튜브/블로그/냉장고 파먹기는 DB tags 우선 필터 + sourceType fallback.
$recipe = Get-Content $recipeFile -Raw -Encoding UTF8

$oldFilter = "return recipes.filter((recipe) => recipe?.sourceType === selectedSourceId)"
$newFilter = @'
const selectedSource = sources.find((item) => item.id === selectedSourceId)
    const expectedTag = selectedSource?.label

    return recipes.filter((recipe) => {
      const tags = Array.isArray(recipe?.tags) ? recipe.tags : []

      return (
        (expectedTag && tags.includes(expectedTag)) ||
        recipe?.sourceType === selectedSourceId
      )
    })
'@

if ($recipe.Contains($oldFilter)) {
    $recipe = $recipe.Replace($oldFilter, $newFilter.TrimEnd())
} elseif (-not $recipe.Contains("tags.includes(expectedTag)")) {
    throw "Recipe.jsx에서 예상한 sourceRecipes 필터 위치를 찾지 못했습니다. 이전 패치가 적용된 Recipe.jsx인지 확인해주세요."
}

[System.IO.File]::WriteAllText($recipeFile, $recipe, [System.Text.UTF8Encoding]::new($false))

Write-Host ""
Write-Host "레시피 tags 탭 연결 패치 완료" -ForegroundColor Green
Write-Host ""
Write-Host "수정된 파일:"
Write-Host "- $apiFile"
Write-Host "- $recipeFile"
Write-Host ""
Write-Host "동작:"
Write-Host "- 냉큼이 추천: 기존 추천/fallback 로직 유지"
Write-Host "- 유튜브 레시피: tags에 '유튜브 레시피'가 있는 행만 표시"
Write-Host "- 블로그 레시피: tags에 '블로그 레시피'가 있는 행만 표시"
Write-Host "- 냉장고 파먹기: tags에 '냉장고 파먹기'가 있는 행만 표시"
Write-Host "- sourceType 값이 있는 기존 데이터도 fallback으로 계속 지원"
Write-Host ""
Write-Host "이제 npm run dev 로 확인하세요."
