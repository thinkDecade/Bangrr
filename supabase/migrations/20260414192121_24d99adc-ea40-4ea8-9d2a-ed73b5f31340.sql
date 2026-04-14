
-- Remove the overly permissive policies (process_trade is SECURITY DEFINER, bypasses RLS)
DROP POLICY IF EXISTS "System can update post prices" ON public.posts;
DROP POLICY IF EXISTS "Authenticated users can insert price history" ON public.price_history;
