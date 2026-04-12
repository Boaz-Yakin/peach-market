---
title: "Peach Brix 2.0: Trust System & Review Duplication Prevention"
category: "Architecture"
tags: [supabase, nextjs, trust-system, security, rls]
created_at: 2026-04-12
---

# Peach Brix 2.0 Implementation Guide


## Overview
The trust system (Peach Brix) is a core feature of Peach Market that encourages good behavior through user reviews. This KI documents the implementation of the evaluation system and the duplication prevention logic.

## 1. Database Schema
A dedicated `reviews` table ensures each transaction can be reviewed only once by each participant.

```sql
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references public.items(id) on delete cascade,
  reviewer_id uuid references auth.users(id) on delete cascade,
  target_id uuid references auth.users(id) on delete cascade,
  brix_bonus float8 not null,
  badges text[] default '{}',
  created_at timestamp with time zone default now()
);
```

## 2. Row Level Security (RLS)
Security policies are critical to prevent malicious brix manipulation.

- **SELECT**: Authenticated users can read reviews.
- **INSERT**: Authenticated users can insert only if `reviewer_id` matches their `auth.uid()`.

## 3. Duplication Prevention Logic
In the Item Detail page (`src/app/item/[id]/page.tsx`), we check for the existence of a review record:

```typescript
const { data: existingReview } = await supabase
  .from('reviews')
      .select('id')
      .eq('item_id', id)
      .eq('reviewer_id', user.id)
      .maybeSingle();

const hasReviewed = !!existingReview;
```

If `hasReviewed` is true, the "Leave Review" UI is hidden.

## 4. Brix Calculation
Current bonus formula: `badges.length * 0.2%`.
Brix is capped at 100% and stored in the `profiles` table.

## Lessons Learned
- Always implement a history table for any metric that can be manipulated by user actions.
- Use `router.refresh()` in Next.js App Router after mutation to update server components that depend on the new state.
