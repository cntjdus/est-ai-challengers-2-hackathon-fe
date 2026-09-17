import { packageLocation } from './packageOptions'

const unitLabels = {
  ea: '개',
  g: 'g',
  ml: 'ml',
}

const demoStores = [
  {
    id: 'nadeul-eoullim',
    code: 'nadeul-eoullim',
    name: '나들가게 어울림할인마트',
    channelType: 'offline',
    mapPosition: { x: 45, y: 19 },
    walkingMinutes: 7,
    distance: 430,
    stock: 4,
    closingTime: '22:00',
    openStatus: '영업 중',
    dawnDelivery: false,
  },
  {
    id: 'nadeul-linesan',
    code: 'nadeul-linesan',
    name: '나들가게 라인동산마트',
    channelType: 'offline',
    mapPosition: { x: 72, y: 35 },
    walkingMinutes: 10,
    distance: 650,
    stock: 3,
    closingTime: '23:00',
    openStatus: '영업 중',
    dawnDelivery: false,
  },
  {
    id: 'dws',
    code: 'dws',
    name: '디더블유에스',
    channelType: 'hybrid',
    mapPosition: { x: 45, y: 49 },
    walkingMinutes: 6,
    distance: 350,
    stock: 5,
    closingTime: '23:30',
    openStatus: '영업 중',
    dawnDelivery: true,
  },
  {
    id: 'convention-store',
    code: 'convention-store',
    name: '컨벤션편의점',
    channelType: 'offline',
    mapPosition: { x: 23, y: 54 },
    walkingMinutes: 9,
    distance: 530,
    stock: 3,
    closingTime: '23:00',
    openStatus: '영업 중',
    dawnDelivery: false,
  },
  {
    id: 'sangmu-mart',
    code: 'sangmu-mart',
    name: '상무마트 치평점',
    channelType: 'offline',
    mapPosition: { x: 50, y: 67 },
    walkingMinutes: 5,
    distance: 310,
    stock: 6,
    closingTime: '22:30',
    openStatus: '영업 중',
    dawnDelivery: false,
  },
  {
    id: 'jangboajuneun-eonni',
    code: 'jangboajuneun-eonni',
    name: '장봐주는언니 세정아울렛점',
    channelType: 'hybrid',
    mapPosition: { x: 73, y: 55 },
    walkingMinutes: 8,
    distance: 480,
    stock: 4,
    closingTime: '23:30',
    openStatus: '영업 중',
    dawnDelivery: true,
  },
]

function hashText(value = '') {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

function resolveFoodId(item) {
  if (item?.foodId) return item.foodId

  const ingredientId = String(item?.ingredientId ?? '')
  const match = ingredientId.match(/^food:([^:]+):/)

  return match?.[1] ?? null
}

function fallbackPackageOptions(item) {
  if (!item) return []

  const foodKey = String(
    resolveFoodId(item) ??
      item.shortName ??
      item.name ??
      item.ingredientId ??
      'ingredient',
  )

  // 같은 재료는 항상 같은 2개 매장이 나오도록 deterministic하게 선택합니다.
  const start = hashText(foodKey) % demoStores.length
  const storeIndexes = [start, (start + 3) % demoStores.length]

  const required = Math.max(
    1,
    Number(item.plannedUsage ?? item.packageAmount ?? 1),
  )

  const unit = item.amountUnit ?? 'g'

  return storeIndexes.map((storeIndex, index) => {
    const store = demoStores[storeIndex]
    const amount = Math.max(
      1,
      Math.ceil(required * (index === 0 ? 1.25 : 1.6)),
    )

    const price =
      1200 + (hashText(`${foodKey}:${store.code}`) % 35) * 100

    return {
      id: `demo-${foodKey}-${store.code}`,
      offerId: null,
      productId: `demo-product-${foodKey}-${index}`,
      ingredientFoodId: resolveFoodId(item),
      ingredientId: item.ingredientId,

      name: `${item.shortName ?? item.name ?? '식재료'} 한끼 소포장`,
      amount,
      unit,
      image: item.image ?? null,

      price,
      originalPrice: price + 1200,

      stock: store.stock,
      checkedAt: null,

      channelType: store.channelType,
      dawnDelivery: store.dawnDelivery,
      deliveryType: store.dawnDelivery ? 'dawn_delivery' : 'pickup',

      storeId: store.id,
      storeCode: store.code,
      storeName: store.name,

      distance: store.distance,
      walkingMinutes: store.walkingMinutes,

      openStatus: store.openStatus,
      closingTime: store.closingTime,

      mapPosition: store.mapPosition,

      locationText: store.dawnDelivery
        ? `도보 ${store.walkingMinutes}분 · 새벽배송 가능`
        : `도보 ${store.walkingMinutes}분 · 픽업 가능`,

      badges: [
        ...(store.dawnDelivery
          ? [{ text: '새벽배송 가능', tone: 'blue' }]
          : [{ text: '즉시 픽업', tone: 'gray' }]),
        {
          text: `재고 ${store.stock}개`,
          tone: store.stock <= 2 ? 'orange' : 'green',
        },
      ],

      description: 'DB 연결 전 화면 확인용 소포장 예시 상품입니다.',
      analysisText: '다음 한 끼에 활용',
      isDemo: true,
    }
  })
}

function normalizeProduct(option, offer, item) {
  const store = offer.sales_channels

  if (!store || store.is_active === false || offer.is_active === false) {
    return null
  }

  const unit = unitLabels[option.unit] ?? option.unit
  const stock = Number(offer.stock_quantity ?? 0)

  const dawnDelivery =
    Boolean(store.dawn_delivery_available) ||
    offer.delivery_type === 'dawn_delivery'

  return {
    id: offer.id,
    offerId: offer.id,
    productId: option.id,

    ingredientFoodId: option.food_id,
    ingredientId: item?.ingredientId,

    name: option.name,
    amount: Number(option.package_quantity),
    unit,

    brand: option.brand,
    image: option.image_path ?? item?.image ?? null,

    price: Number(offer.price ?? 0),
    originalPrice: Number(offer.original_price ?? offer.price ?? 0),

    stock,
    checkedAt: offer.stock_checked_at,

    deliveryType: offer.delivery_type,
    channelType: store.channel_type ?? 'offline',
    dawnDelivery,

    storeId: store.id,
    storeCode: store.code,
    storeName: store.name,

    distance: Number(store.distance_m ?? 0),
    walkingMinutes: Number(store.walking_minutes ?? 0),

    openStatus: store.open_status ?? '영업 중',
    closingTime: String(store.closing_time ?? '').slice(0, 5),

    mapPosition: {
      x: Number(store.map_x ?? 50),
      y: Number(store.map_y ?? 50),
    },

    locationText: dawnDelivery
      ? `도보 ${Number(store.walking_minutes ?? 0)}분 · 새벽배송 가능`
      : `도보 ${Number(store.walking_minutes ?? 0)}분 · 픽업 가능`,

    badges: [
      ...(offer.badge_text
        ? [
            {
              text: offer.badge_text,
              tone: dawnDelivery ? 'blue' : 'gray',
            },
          ]
        : []),
      {
        text: stock > 0 ? `재고 ${stock}개` : '품절',
        tone: stock <= 2 ? 'orange' : 'green',
      },
    ],

    description:
      store.fulfillment_label ??
      (dawnDelivery
        ? '매장 픽업과 새벽배송을 지원합니다.'
        : '주변 매장에서 바로 픽업할 수 있어요.'),

    analysisText: '다음 한 끼에 활용',
    isDemo: false,
  }
}

export async function loadPackageOptions(
  client,
  item,
  { signal, fallback = true } = {},
) {
  const foodId = resolveFoodId(item)

  if (!client || !foodId) {
    return {
      products: fallback ? fallbackPackageOptions(item) : [],
      isFallback: true,
      warning: !foodId
        ? '식재료 food_id를 찾지 못해 예시 상품을 표시합니다.'
        : 'Supabase 연결 전이라 예시 상품을 표시합니다.',
    }
  }

  try {
    let query = client
      .from('package_options')
      .select(`
        id,
        food_id,
        name,
        package_quantity,
        unit,
        brand,
        image_path,
        is_active,
        package_offers (
          id,
          price,
          original_price,
          stock_quantity,
          stock_checked_at,
          delivery_type,
          badge_text,
          is_active,
          sales_channels (
            id,
            code,
            name,
            channel_type,
            region_name,
            map_x,
            map_y,
            walking_minutes,
            distance_m,
            open_status,
            closing_time,
            pickup_available,
            dawn_delivery_available,
            fulfillment_label,
            is_active
          )
        )
      `)
      .eq('food_id', foodId)
      .eq('is_active', true)

    if (signal && typeof query.abortSignal === 'function') {
      query = query.abortSignal(signal)
    }

    const { data, error } = await query

    if (error) throw error

    const products = (data ?? []).flatMap((option) =>
      (option.package_offers ?? [])
        .map((offer) => normalizeProduct(option, offer, item))
        .filter(Boolean),
    )

    return {
      products,
      isFallback: false,
      warning: '',
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error
    }

    return {
      products: fallback ? fallbackPackageOptions(item) : [],
      isFallback: true,
      warning: `소포장 DB를 불러오지 못해 예시 상품을 표시합니다. (${error.message})`,
    }
  }
}

export async function replaceShoppingPackage(
  client,
  shoppingItemId,
  product,
) {
  if (product?.isDemo) {
    throw new Error(
      '예시 상품은 장바구니에 실제 반영할 수 없습니다. 소포장 DB 연결 후 다시 시도해주세요.',
    )
  }

  if (!client || !shoppingItemId || !product?.offerId) {
    throw new Error('교체할 소포장 상품 정보를 확인해주세요.')
  }

  const { error } = await client.rpc('hk_replace_shopping_package', {
    p_shopping_item_id: shoppingItemId,
    p_offer_id: product.offerId,
  })

  if (error) {
    if (['PGRST202', '42883'].includes(error.code)) {
      throw new Error('소포장 교체 RPC가 DB에 아직 적용되지 않았습니다.')
    }

    throw error
  }
}

export { packageLocation }
