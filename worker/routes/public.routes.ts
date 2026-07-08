import { Hono } from "hono";
import type { AppBindings } from "../types";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
};

type ItemRow = {
  category_id: string;
  category_name: string;
  description: string;
  id: string;
  image_key: string | null;
  image_url: string | null;
  is_reservable: number;
  is_seasonal: number;
  max_per_person: number;
  min_prep_days: number;
  price: number;
  remaining_limited_quantity: number | null;
  slug: string;
  title: string;
  total_limited_quantity: number | null;
};

type NoticeRow = {
  href: string | null;
  icon_label: string | null;
  id: string;
  text: string;
};

type FeaturedItemRow = ItemRow & {
  description_override: string | null;
  featured_id: string;
  placement: string;
  title_override: string | null;
};

type PickupRuleRow = {
  available_weekdays_json: string;
  daily_capacity: number | null;
  default_time_slots_json: string;
  id: string;
};

type PickupExceptionRow = {
  date: string;
  exception_type: string;
  id: string;
  reason: string | null;
  time_slots_json: string | null;
};

export const publicRoutes = new Hono<AppBindings>();

publicRoutes.get("/site", async (context) => {
  const [notices, featuredItems] = await Promise.all([
    context.env.DB.prepare(
      `SELECT id, text, icon_label, href
       FROM site_notice_items
       WHERE is_active = 1
       ORDER BY sort_order ASC`,
    ).all<NoticeRow>(),
    context.env.DB.prepare(
      `SELECT
         featured_items.id AS featured_id,
         featured_items.placement,
         featured_items.title_override,
         featured_items.description_override,
         items.id,
         items.category_id,
         categories.name AS category_name,
         items.title,
         items.slug,
         items.image_key,
         items.image_url,
         items.description,
         items.is_seasonal,
         items.price,
         items.min_prep_days,
         items.max_per_person,
         items.total_limited_quantity,
         items.remaining_limited_quantity,
         items.is_reservable
       FROM featured_items
       JOIN items ON items.id = featured_items.item_id
       JOIN categories ON categories.id = items.category_id
       WHERE featured_items.is_active = 1
       ORDER BY featured_items.placement ASC, featured_items.sort_order ASC`,
    ).all<FeaturedItemRow>(),
  ]);

  return context.json({
    featuredItems: featuredItems.results,
    notices: notices.results,
  });
});

publicRoutes.get("/menus", async (context) => {
  const [categories, items] = await Promise.all([
    context.env.DB.prepare(
      `SELECT id, slug, name
       FROM categories
       WHERE is_active = 1
       ORDER BY sort_order ASC`,
    ).all<CategoryRow>(),
    context.env.DB.prepare(
      `SELECT
         items.id,
         items.category_id,
         categories.name AS category_name,
         items.title,
         items.slug,
         items.image_key,
         items.image_url,
         items.description,
         items.is_seasonal,
         items.price,
         items.min_prep_days,
         items.max_per_person,
         items.total_limited_quantity,
         items.remaining_limited_quantity,
         items.is_reservable
       FROM items
       JOIN categories ON categories.id = items.category_id
       WHERE items.is_reservable = 1
       ORDER BY items.sort_order ASC`,
    ).all<ItemRow>(),
  ]);

  return context.json({
    categories: categories.results,
    items: items.results,
  });
});

publicRoutes.get("/pickup-rules", async (context) => {
  const [rule, exceptions] = await Promise.all([
    context.env.DB.prepare(
      `SELECT id, available_weekdays_json, default_time_slots_json, daily_capacity
       FROM pickup_rules
       WHERE id = 'default' AND is_active = 1
       LIMIT 1`,
    ).first<PickupRuleRow>(),
    context.env.DB.prepare(
      `SELECT id, date, exception_type, time_slots_json, reason
       FROM pickup_exceptions
       ORDER BY date ASC`,
    ).all<PickupExceptionRow>(),
  ]);

  return context.json({
    exceptions: exceptions.results,
    rule,
  });
});
