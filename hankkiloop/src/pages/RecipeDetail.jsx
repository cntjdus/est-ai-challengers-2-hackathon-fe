import BottomSheet from "../components/common/BottomSheet";
import Cart from "./Cart";
import MaterialRegister from "./MaterialRegister";
import PackageSolution from "./PackageSolution";
import PackageMap from "./PackageMap";
import StockDeductionSheet from "../components/recipe/StockDeductionSheet";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Minus,
  Plus,
  Sprout,
} from "lucide-react";
import EditProfileHeader from "../components/profile/EditProfileHeader";
import { compareIngredient } from "../data/recipeApi";
import character from "../assets/hankkiloop-character.png";

function formatAmount(ingredient, ratio) {
  if (typeof ingredient.quantity !== "number") return ingredient.amount;
  const value = ingredient.quantity * ratio;
  for (const denominator of [1, 2, 3, 4, 8]) {
    const numerator = Math.round(value * denominator);
    if (Math.abs(numerator / denominator - value) < 0.001)
      return (
        (denominator === 1 ? numerator : numerator + "/" + denominator) +
        ingredient.unit
      );
  }
  return Number(value.toFixed(2)) + ingredient.unit;
}

export default function RecipeDetail({
  recipes = [],
  recipeId,
  savedIds,
  onToggleSave,
  onBack,
  inventory,
  registeredMaterials,
  onDeductStock,
  onAddShopping,
  shoppingProps,
  allergyNotice,
  saveLoading = false,
  busySaveIds = [],
}) {
  const recipe = recipes.find((item) => item.id === recipeId);
  const [servings, setServings] = useState(recipe?.servings ?? 1);
  const [expanded, setExpanded] = useState(false);
  const [completionNotice, setCompletionNotice] = useState("");
  const [completed, setCompleted] = useState(false);
  const [isStockSheetOpen, setIsStockSheetOpen] = useState(false);
  const tipRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [shoppingNotice, setShoppingNotice] = useState("");
  const [addingShopping, setAddingShopping] = useState(null);
  const [isShoppingOpen, setIsShoppingOpen] = useState(false);
  const [registrationItems, setRegistrationItems] = useState(null);
  const [packageItem, setPackageItem] = useState(null);
  const [packageView, setPackageView] = useState(null);
  const [registrationSaving, setRegistrationSaving] = useState(false);
  const shoppingRequests = useRef(new Map());
  const shoppingLock = useRef(false);
  const addShopping = async (ingredient) => {
    if (shoppingLock.current) return;
    shoppingLock.current = true;
    setAddingShopping(ingredient.id);
    setShoppingNotice("");
    const key = ingredient.id + ":" + servings;
    if (!shoppingRequests.current.has(key))
      shoppingRequests.current.set(key, crypto.randomUUID());
    try {
      await onAddShopping(recipe, servings, shoppingRequests.current.get(key), ingredient.id);
      shoppingRequests.current.delete(key);
      setShoppingNotice(ingredient.name + "을(를) 장바구니에 담았어요.");
    } catch (error) {
      setShoppingNotice(error.message);
    } finally {
      shoppingLock.current = false;
      setAddingShopping(null);
    }
  };
  const handleCompleteCooking = () => {
    setIsStockSheetOpen(true);
  };
  if (!recipe)
    return (
      <div className="mx-auto flex h-dvh w-full max-w-app flex-col bg-[#fafcfb]">
        <EditProfileHeader onBack={onBack} title="" plain />
        <main className="p-6 text-center">
          <h1 className="text-xl font-bold">레시피를 찾을 수 없습니다</h1>
          <p className="mt-3 text-sm">
            등록되지 않았거나 알레르기·비선호 설정으로 제외된 레시피입니다.
          </p>
          <button
            onClick={onBack}
            className="mt-6 rounded-xl bg-[#1b4535] px-5 py-3 text-white"
          >
            레시피 목록으로
          </button>
        </main>
      </div>
    );
  const saved = savedIds.includes(recipe.id);
  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-app flex-col overflow-hidden bg-[#fafcfb] text-[#111827]">
      <EditProfileHeader
        onBack={onBack}
        title=""
        plain
        action={
          <button
            type="button"
            disabled={saveLoading || busySaveIds.includes(recipe.id)}
            aria-label={recipe.title + " 스크랩"}
            aria-pressed={saved}
            onClick={() => onToggleSave(recipe.id)}
            className="flex size-10 items-center justify-center rounded-full"
          >
            <Bookmark
              aria-hidden="true"
              className="size-6"
              fill={saved ? "currentColor" : "none"}
            />
          </button>
        }
      />
      <main
        aria-label="레시피 상세"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-24"
      >
        <h1 className="text-2xl font-bold leading-9">{recipe.title}</h1>
        {allergyNotice && (
          <p className="mt-3 text-xs text-amber-800">{allergyNotice}</p>
        )}
        <p
          id="recipe-description"
          className={`mt-2 text-sm leading-6 text-[#374151] ${expanded ? "" : "line-clamp-3"}`}
        >
          {recipe.description}
        </p>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="recipe-description"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-sm font-semibold text-[#3478ff]"
        >
          {expanded ? "접기" : "더보기"}
        </button>
        <dl className="mt-6 grid grid-cols-3 rounded-2xl border border-[#e2ebe5] bg-[#f3f7f5] py-4 text-center">
          {[
            ["인분", servings + "인분"],
            ["조리", "약 " + recipe.minutes + "분"],
            ["난이도", recipe.difficulty],
          ].map(([label, value]) => (
            <div
              key={label}
              className="border-r border-[#e5e7eb] last:border-0"
            >
              <dt className="text-xs text-[#7c8595]">{label}</dt>
              <dd className="mt-1 text-base font-bold">{value}</dd>
            </div>
          ))}
        </dl>
        <section className="mt-6 border-b border-[#f0f2f3] pb-6">
          <h2 className="text-lg font-bold">조리 도구</h2>
          <p className="mt-2 text-sm">
            {recipe.tools.join(" · ") || "등록된 조리 도구가 없습니다."}
          </p>
        </section>
        <section className="mt-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">재료</h2>
            <div className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-[#f4f5f5] p-1 text-sm">
              <button
                type="button"
                aria-label="인분 줄이기"
                disabled={servings <= 1 || completed}
                onClick={() => setServings(Math.max(1, servings - 1))}
                className="flex size-7 items-center justify-center rounded-lg bg-white shadow-xs disabled:opacity-40"
              >
                <Minus className="size-3" />
              </button>
              <output
                aria-label="인분"
                className="min-w-4 text-center font-bold"
              >
                {servings}
              </output>
              <button
                type="button"
                aria-label="인분 늘리기"
                disabled={completed}
                onClick={() => setServings(servings + 1)}
                className="flex size-7 items-center justify-center rounded-lg bg-white shadow-xs disabled:opacity-40"
              >
                <Plus className="size-3" />
              </button>
              <span className="pr-1 text-xs text-[#7c8595]">인분</span>
            </div>
          </div>
          <ul className="mt-3">
            {recipe.ingredients.map((source) => {
              const comparison = compareIngredient(
                source,
                servings,
                recipe.servings,
                inventory,
              );
              const ingredient = {
                ...source,
                inFridge: comparison.available > 0,
              };
              const inCart = shoppingProps?.items?.some(
                (item) => item.ingredientId === ingredient.id ||
                  (ingredient.foodId && item.foodId === ingredient.foodId && item.dbUnit === ingredient.dbUnit),
              ) ?? false;
              const shoppingLabel = inCart ? "담김" : ingredient.inFridge ? "있음" : "담기 +";
              return (
                <li
                  key={ingredient.id}
                  className={`flex min-h-13 items-center gap-2 border-b border-[#f0f2f3] py-2 text-sm ${ingredient.inFridge ? "my-2 rounded-lg bg-[#f0fbf6] px-2" : ""}`}
                >
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                    <span>{ingredient.name}</span>
                    {ingredient.inFridge && ingredient.storageLabel && (
                      <span className="rounded bg-[#d9faeb] px-1.5 py-1 text-[10px] font-semibold text-[#008768]">
                        {ingredient.storageLabel}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-[#7c8595]">
                    필요 {formatAmount(ingredient, servings / recipe.servings)}
                  </span>
                  <span className="text-right text-xs text-[#008768]">
                    보유 {comparison.available}
                    {ingredient.unit}
                    <br />
                    {comparison.shortage > 0
                      ? "부족 " + comparison.shortage + ingredient.unit
                      : "충분"}
                    {comparison.differentUnit && (
                      <span className="block text-amber-700">
                        다른 단위 재고는 환산 확인 필요
                      </span>
                    )}
                    {ingredient.optional && (
                      <span className="block">선택 재료</span>
                    )}
                  </span>
                  {onAddShopping && <button
                    type="button"
                    aria-label={ingredient.name + (inCart ? " 장바구니 담김" : ingredient.inFridge ? " 냉장고에 있음, 장바구니 담기" : " 장바구니 담기")}
                    disabled={inCart || addingShopping !== null || shoppingProps?.loading || !!shoppingProps?.error}
                    onClick={() => addShopping(ingredient)}
                    className={`inline-flex h-7 min-w-12 shrink-0 items-center justify-center rounded-full px-2.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3478ff] ${inCart ? "border-[1.5px] border-[#3478ff] bg-[#e5f2ff] text-[#2864ef]" : ingredient.inFridge ? "border border-transparent bg-[#e3f7ed] text-[#008260]" : "border-[1.5px] border-[#3478ff] bg-white text-[#2864ef]"} ${addingShopping !== null || shoppingProps?.loading || shoppingProps?.error ? "opacity-50" : ""}`}
                  >
                    {addingShopping === ingredient.id ? "담는 중" : shoppingLabel}
                  </button>}
                </li>
              );
            })}
          </ul>
        </section>
        {recipe.substitute && (
          <aside className="mt-6 flex items-center gap-3 rounded-3xl border border-[#bcf5d5] bg-[#effbf4] p-3.5 shadow-xs">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-[#bbf7d0]">
              <img
                src={character}
                alt=""
                className="absolute top-[-12%] left-[-2%] w-[255%] max-w-none"
              />
            </div>
            <div>
              <h2 className="flex items-center gap-1 text-xs font-bold text-[#148b43]">
                {recipe.substitute.title}
                <Sprout aria-hidden="true" className="size-3" />
              </h2>
              <p className="mt-1 text-sm leading-5 text-[#475569]">
                {recipe.substitute.description}
              </p>
            </div>
          </aside>
        )}
        <section aria-label="조리 순서" className="mt-8">
          <h2 className="text-xl font-bold">조리 순서</h2>
          {recipe.steps.length === 0 && (
            <p className="mt-3 text-sm">등록된 조리 순서가 없습니다.</p>
          )}
          {recipe.steps.length > 0 && (
            <div className="mt-5 px-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-[#007f5c]">
                  STEP {recipe.steps[activeStep].step}
                </h3>
                <div className="flex items-center gap-1">
                  <span className="mr-1 text-xs text-[#7c8595]">
                    {activeStep + 1} / {recipe.steps.length}
                  </span>
                  <button
                    type="button"
                    aria-label="이전 조리 단계"
                    disabled={activeStep === 0}
                    onClick={() =>
                      setActiveStep((step) => Math.max(0, step - 1))
                    }
                    className="flex size-9 items-center justify-center rounded-full text-[#007f5c] hover:bg-[#e0f7ec] disabled:cursor-default disabled:opacity-25"
                  >
                    <ArrowLeft aria-hidden="true" className="size-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="다음 조리 단계"
                    disabled={activeStep === recipe.steps.length - 1}
                    onClick={() =>
                      setActiveStep((step) =>
                        Math.min(recipe.steps.length - 1, step + 1),
                      )
                    }
                    className="flex size-9 items-center justify-center rounded-full text-[#007f5c] hover:bg-[#e0f7ec] disabled:cursor-default disabled:opacity-25"
                  >
                    <ArrowRight aria-hidden="true" className="size-5" />
                  </button>
                </div>
              </div>
              <div
                className="overflow-hidden"
                aria-live="polite"
                aria-atomic="true"
              >
                <div
                  className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
                  style={{
                    transform: "translateX(-" + activeStep * 100 + "%)",
                  }}
                >
                  {recipe.steps.map((step, index) => (
                    <div
                      key={step.step}
                      aria-hidden={index !== activeStep}
                      inert={index !== activeStep}
                      className="w-full min-w-full shrink-0"
                    >
                      <p className="mt-2 text-sm font-semibold leading-6">
                        {step.description}
                      </p>
                      {step.subDescription && (
                        <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                          {step.subDescription}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
        {recipe.tip && (
          <aside
            ref={tipRef}
            tabIndex={-1}
            className="mt-8 flex gap-3 rounded-2xl border border-[#cee3ff] bg-[#eff6ff] p-4 shadow-xs outline-none"
          >
            <img
              src={character}
              alt=""
              className="size-14 shrink-0 rounded-2xl object-cover"
            />
            <div>
              <h2 className="flex flex-wrap items-center gap-2 text-sm font-bold">
                레시피 팁{" "}
                <span className="rounded-full bg-[#3982f6] px-2 py-1 text-[10px] text-white">
                  AI BOT
                </span>
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-[#4b5563]">
                {recipe.tip}
              </p>
            </div>
          </aside>
        )}
        {completed && (
          <p role="status" className="mt-2 text-center text-xs text-[#64748b]">
            {completionNotice}
          </p>
        )}
      </main>
      <footer className="shrink-0 border-t border-[#e5e7eb] bg-white px-4 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        {shoppingNotice && <p role="status" className="mb-3 text-xs text-[#006c49]">{shoppingNotice}</p>}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setIsShoppingOpen(true)}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-dashed border-[#6ee7b7] bg-[#f5fdf9] text-base font-bold text-[#006c49] shadow-lg">
            <Check aria-hidden="true" className="size-5" />장보러 가기
          </button>
        <button
          type="button"
          disabled={completed}
          onClick={handleCompleteCooking}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#1b4535] text-base font-bold text-white shadow-lg disabled:bg-[#527466]"
        >
          <Check aria-hidden="true" className="size-6 text-[#6ee7b7]" />
          {completed ? "요리 완료했어요" : "요리 완료"}
        </button>
        </div>
      </footer>
      {isShoppingOpen && shoppingProps && (
        <BottomSheet label={packageView ? "주변 소포장 지도" : packageItem ? "소포장 식재료 찾기" : registrationItems ? "재료 등록" : "장바구니"} initialHeight={0.82} fitVisualViewport dismissible={!registrationSaving} onClose={() => { setIsShoppingOpen(false); setRegistrationItems(null); setPackageItem(null); setPackageView(null); }} contentClassName="overflow-hidden">
          {packageView ? <PackageMap
            embedded
            item={packageItem}
            selectedProductId={packageView.selectedProductId}
            onBack={() => setPackageView(null)}
            onReplace={shoppingProps.onReplacePackage}
          /> : packageItem ? <PackageSolution
            embedded
            item={packageItem}
            onBack={() => setPackageItem(null)}
            onClose={() => setPackageItem(null)}
            onOpenMap={setPackageView}
            onReplace={shoppingProps.onReplacePackage}
          /> : registrationItems ? <MaterialRegister
            embedded
            allowPackageOptions
            items={registrationItems}
            onOpenPackageSolution={setPackageItem}
            onBack={() => { if (!registrationSaving) setRegistrationItems(null); }}
            onNavigate={() => { if (!registrationSaving) setRegistrationItems(null); }}
            onRegister={async (materials) => {
              setRegistrationSaving(true);
              try {
                await shoppingProps.onRegister(materials);
                setShoppingNotice(materials.length + "개 재료를 냉장고에 등록했어요.");
                setRegistrationItems(null);
                setIsShoppingOpen(false);
              } finally { setRegistrationSaving(false); }
            }}
          /> : <Cart {...shoppingProps} embedded onStartRegistration={setRegistrationItems} onBack={() => setIsShoppingOpen(false)} onBrowseRecipes={() => setIsShoppingOpen(false)} />}
        </BottomSheet>
      )}
      {isStockSheetOpen && (
        <StockDeductionSheet
          registeredMaterials={registeredMaterials}
          recipe={recipe}
          servings={servings}
          inventory={inventory}
          onClose={() => setIsStockSheetOpen(false)}
          onConfirm={async (selected, skipped = 0) => {
            await onDeductStock(selected);
            setCompletionNotice(
              skipped
                ? "재고가 확인된 " +
                    selected.length +
                    "개 재료를 차감했어요. 미확인 " +
                    skipped +
                    "개는 제외했습니다."
                : "선택한 재료의 재고 차감을 완료했어요.",
            );
            setCompleted(true);
          }}
        />
      )}
    </div>
  );
}
