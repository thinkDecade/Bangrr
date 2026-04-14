
-- Enable realtime on activity_feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;

-- Allow authenticated users to INSERT into activity_feed (for trade logging)
CREATE POLICY "Authenticated users can insert activity"
ON public.activity_feed
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to UPDATE their own posts (price/volume changes from trades)
CREATE POLICY "Users can update own posts"
ON public.posts
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);
