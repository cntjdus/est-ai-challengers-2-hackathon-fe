-- Schema-only fixture copied from the connected project's table metadata.
-- External OCR foreign keys are omitted; no production rows are copied.
create role anon;
create role authenticated;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth,public to authenticated,anon;
grant execute on function auth.uid() to authenticated,anon;
create table public.profiles(id uuid primary key);
create table public.food_items (
  "id" uuid default gen_random_uuid() not null,
  "name" text not null,
  "category" text default 'other'::text not null,
  "base_unit" text not null,
  "image_path" text,
  "is_active" boolean default true not null,
  "created_at" timestamp with time zone default now() not null
);
create table public.inventory_dates (
  "id" uuid default gen_random_uuid() not null,
  "inventory_id" uuid not null,
  "user_id" uuid default auth.uid() not null,
  "date_type" text not null,
  "date_value" date not null,
  "source" text not null,
  "is_tracking" boolean default false not null,
  "ocr_confirmation_id" uuid,
  "storage_rule_id" uuid,
  "created_at" timestamp with time zone default now() not null
);
create table public.inventory_items (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid default auth.uid() not null,
  "food_id" uuid,
  "display_name" text not null,
  "quantity" numeric(14,4) not null,
  "unit" text not null,
  "storage_type" text default 'fridge'::text not null,
  "purchased_on" date,
  "opened_on" date,
  "status" text default 'active'::text not null,
  "source_shopping_item_id" uuid,
  "note" text,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table public.recipe_ingredients (
  "id" uuid default gen_random_uuid() not null,
  "recipe_id" uuid not null,
  "food_id" uuid not null,
  "quantity" numeric(14,4) not null,
  "unit" text not null,
  "is_optional" boolean default false not null,
  "note" text
);
create table public.recipes (
  "id" uuid default gen_random_uuid() not null,
  "title" text not null,
  "description" text,
  "base_servings" numeric(8,2) default 1 not null,
  "cooking_minutes" integer,
  "difficulty" text,
  "image_path" text,
  "tags" text[] default '{}'::text[] not null,
  "source_url" text,
  "created_at" timestamp with time zone default now() not null,
  "source_type" text,
  "source_name" text
);
create table public.shopping_items (
  "id" uuid default gen_random_uuid() not null,
  "plan_id" uuid not null,
  "user_id" uuid not null,
  "food_id" uuid not null,
  "unit" text not null,
  "required_quantity" numeric(14,4) default 0 not null,
  "allocated_inventory_quantity" numeric(14,4) default 0 not null,
  "needed_quantity" numeric generated always as (GREATEST((required_quantity - allocated_inventory_quantity), (0)::numeric)) stored,
  "package_option_id" uuid,
  "planned_purchase_quantity" numeric(14,4),
  "expected_leftover_quantity" numeric generated always as (
CASE
    WHEN (planned_purchase_quantity IS NULL) THEN NULL::numeric
    ELSE GREATEST((planned_purchase_quantity - GREATEST((required_quantity - allocated_inventory_quantity), (0)::numeric)), (0)::numeric)
END) stored,
  "calculation_note" text,
  "created_at" timestamp with time zone default now() not null,
  "package_count" integer,
  "package_quantity_snapshot" numeric
);
create table public.shopping_plan_recipes (
  "id" uuid default gen_random_uuid() not null,
  "plan_id" uuid not null,
  "user_id" uuid not null,
  "recipe_id" uuid not null,
  "servings" numeric(8,2) default 1 not null,
  "cooking_count" integer default 1 not null
);
create table public.shopping_plans (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "title" text default '장보기'::text not null,
  "status" text default 'draft'::text not null,
  "calculated_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
alter table public.food_items add constraint "food_items_base_unit_check" CHECK ((base_unit = ANY (ARRAY['g'::text, 'ml'::text, 'ea'::text])));
alter table public.food_items add constraint "food_items_name_check" CHECK ((length(TRIM(BOTH FROM name)) > 0));
alter table public.food_items add constraint "food_items_name_key" UNIQUE (name);
alter table public.food_items add constraint "food_items_pkey" PRIMARY KEY (id);
alter table public.inventory_dates add constraint "inventory_dates_check" CHECK (((NOT is_tracking) OR (date_type = ANY (ARRAY['use_by'::text, 'sell_by'::text, 'best_before'::text, 'recommended'::text]))));
alter table public.inventory_dates add constraint "inventory_dates_check1" CHECK ((((source = 'manual'::text) AND (ocr_confirmation_id IS NULL) AND (storage_rule_id IS NULL)) OR ((source = 'ocr_confirmed'::text) AND (ocr_confirmation_id IS NOT NULL) AND (storage_rule_id IS NULL)) OR ((source = 'storage_rule'::text) AND (storage_rule_id IS NOT NULL) AND (ocr_confirmation_id IS NULL) AND (date_type = 'recommended'::text))));
alter table public.inventory_dates add constraint "inventory_dates_date_type_check" CHECK ((date_type = ANY (ARRAY['use_by'::text, 'sell_by'::text, 'best_before'::text, 'manufactured'::text, 'recommended'::text, 'unknown'::text])));
alter table public.inventory_dates add constraint "inventory_dates_pkey" PRIMARY KEY (id);
alter table public.inventory_dates add constraint "inventory_dates_source_check" CHECK ((source = ANY (ARRAY['manual'::text, 'ocr_confirmed'::text, 'storage_rule'::text])));
alter table public.inventory_items add constraint "inventory_items_check" CHECK ((((status = 'active'::text) AND (quantity > (0)::numeric)) OR ((status = ANY (ARRAY['consumed'::text, 'discarded'::text])) AND (quantity = (0)::numeric))));
alter table public.inventory_items add constraint "inventory_items_display_name_check" CHECK ((length(TRIM(BOTH FROM display_name)) > 0));
alter table public.inventory_items add constraint "inventory_items_id_user_id_key" UNIQUE (id, user_id);
alter table public.inventory_items add constraint "inventory_items_pkey" PRIMARY KEY (id);
alter table public.inventory_items add constraint "inventory_items_quantity_check" CHECK (((quantity >= (0)::numeric) AND (quantity < (1000000000)::numeric)));
alter table public.inventory_items add constraint "inventory_items_source_shopping_item_id_key" UNIQUE (source_shopping_item_id);
alter table public.inventory_items add constraint "inventory_items_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'consumed'::text, 'discarded'::text])));
alter table public.inventory_items add constraint "inventory_items_storage_type_check" CHECK ((storage_type = ANY (ARRAY['fridge'::text, 'freezer'::text, 'room'::text])));
alter table public.inventory_items add constraint "inventory_items_unit_check" CHECK ((unit = ANY (ARRAY['g'::text, 'ml'::text, 'ea'::text, 'pack'::text, 'bundle'::text, 'tbsp'::text, 'tsp'::text])));
alter table public.recipe_ingredients add constraint "recipe_ingredients_pkey" PRIMARY KEY (id);
alter table public.recipe_ingredients add constraint "recipe_ingredients_quantity_check" CHECK (((quantity > (0)::numeric) AND (quantity < (1000000000)::numeric)));
alter table public.recipe_ingredients add constraint "recipe_ingredients_unit_check" CHECK ((unit = ANY (ARRAY['g'::text, 'ml'::text, 'ea'::text, 'pack'::text, 'bundle'::text, 'tbsp'::text, 'tsp'::text])));
alter table public.recipes add constraint "hk_ui_recipe_source_type_check" CHECK ((source_type = ANY (ARRAY['youtube'::text, 'blog'::text, 'manual'::text, 'other'::text])));
alter table public.recipes add constraint "recipes_base_servings_check" CHECK (((base_servings > (0)::numeric) AND (base_servings <= (1000)::numeric)));
alter table public.recipes add constraint "recipes_cooking_minutes_check" CHECK ((cooking_minutes >= 0));
alter table public.recipes add constraint "recipes_difficulty_check" CHECK ((difficulty = ANY (ARRAY['easy'::text, 'normal'::text, 'hard'::text])));
alter table public.recipes add constraint "recipes_pkey" PRIMARY KEY (id);
alter table public.shopping_items add constraint "hk_ui_package_count_check" CHECK (((package_count >= 1) AND (package_count <= 1000000)));
alter table public.shopping_items add constraint "hk_ui_package_pair_check" CHECK ((((package_count IS NULL) AND (package_quantity_snapshot IS NULL)) OR ((package_count IS NOT NULL) AND (package_quantity_snapshot IS NOT NULL) AND (((package_count)::numeric * package_quantity_snapshot) < (1000000000)::numeric))));
alter table public.shopping_items add constraint "hk_ui_package_quantity_check" CHECK (((package_quantity_snapshot > (0)::numeric) AND (package_quantity_snapshot < (1000000000)::numeric)));
alter table public.shopping_items add constraint "shopping_items_check" CHECK (((allocated_inventory_quantity >= (0)::numeric) AND (allocated_inventory_quantity <= required_quantity)));
alter table public.shopping_items add constraint "shopping_items_id_user_id_key" UNIQUE (id, user_id);
alter table public.shopping_items add constraint "shopping_items_pkey" PRIMARY KEY (id);
alter table public.shopping_items add constraint "shopping_items_plan_id_food_id_unit_key" UNIQUE (plan_id, food_id, unit);
alter table public.shopping_items add constraint "shopping_items_planned_purchase_quantity_check" CHECK (((planned_purchase_quantity >= (0)::numeric) AND (planned_purchase_quantity < (1000000000)::numeric)));
alter table public.shopping_items add constraint "shopping_items_required_quantity_check" CHECK (((required_quantity >= (0)::numeric) AND (required_quantity < (1000000000)::numeric)));
alter table public.shopping_items add constraint "shopping_items_unit_check" CHECK ((unit = ANY (ARRAY['g'::text, 'ml'::text, 'ea'::text])));
alter table public.shopping_plan_recipes add constraint "shopping_plan_recipes_cooking_count_check" CHECK (((cooking_count >= 1) AND (cooking_count <= 100)));
alter table public.shopping_plan_recipes add constraint "shopping_plan_recipes_pkey" PRIMARY KEY (id);
alter table public.shopping_plan_recipes add constraint "shopping_plan_recipes_plan_id_recipe_id_key" UNIQUE (plan_id, recipe_id);
alter table public.shopping_plan_recipes add constraint "shopping_plan_recipes_servings_check" CHECK (((servings > (0)::numeric) AND (servings <= (1000)::numeric)));
alter table public.shopping_plans add constraint "shopping_plans_id_user_id_key" UNIQUE (id, user_id);
alter table public.shopping_plans add constraint "shopping_plans_pkey" PRIMARY KEY (id);
alter table public.shopping_plans add constraint "shopping_plans_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'ready'::text, 'completed'::text, 'cancelled'::text])));
alter table public.inventory_dates add constraint "inventory_dates_inventory_id_user_id_fkey" FOREIGN KEY (inventory_id, user_id) REFERENCES inventory_items(id, user_id) ON DELETE CASCADE;
alter table public.inventory_items add constraint "inventory_items_food_id_fkey" FOREIGN KEY (food_id) REFERENCES food_items(id);
alter table public.inventory_items add constraint "inventory_items_source_shopping_item_id_user_id_fkey" FOREIGN KEY (source_shopping_item_id, user_id) REFERENCES shopping_items(id, user_id);
alter table public.inventory_items add constraint "inventory_items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.recipe_ingredients add constraint "recipe_ingredients_food_id_fkey" FOREIGN KEY (food_id) REFERENCES food_items(id);
alter table public.recipe_ingredients add constraint "recipe_ingredients_recipe_id_fkey" FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE;
alter table public.shopping_items add constraint "shopping_items_food_id_fkey" FOREIGN KEY (food_id) REFERENCES food_items(id);
alter table public.shopping_items add constraint "shopping_items_plan_id_user_id_fkey" FOREIGN KEY (plan_id, user_id) REFERENCES shopping_plans(id, user_id) ON DELETE CASCADE;
alter table public.shopping_plan_recipes add constraint "shopping_plan_recipes_plan_id_user_id_fkey" FOREIGN KEY (plan_id, user_id) REFERENCES shopping_plans(id, user_id) ON DELETE CASCADE;
alter table public.shopping_plan_recipes add constraint "shopping_plan_recipes_recipe_id_fkey" FOREIGN KEY (recipe_id) REFERENCES recipes(id);
alter table public.shopping_plans add constraint "shopping_plans_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.shopping_plans enable row level security;
create policy own on public.shopping_plans for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
alter table public.shopping_plan_recipes enable row level security;
create policy own on public.shopping_plan_recipes for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
alter table public.shopping_items enable row level security;
create policy own on public.shopping_items for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
alter table public.inventory_items enable row level security;
create policy own on public.inventory_items for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
alter table public.inventory_dates enable row level security;
create policy own on public.inventory_dates for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
grant select on public.food_items,public.recipes,public.recipe_ingredients,public.inventory_items to authenticated;
grant select,insert,update,delete on public.shopping_items,public.shopping_plans,public.shopping_plan_recipes,public.inventory_dates to authenticated;
grant insert(id,user_id,food_id,display_name,quantity,unit,storage_type,purchased_on,source_shopping_item_id,status,note,opened_on) on public.inventory_items to authenticated;
grant update(display_name,storage_type,purchased_on,opened_on,note) on public.inventory_items to authenticated;
