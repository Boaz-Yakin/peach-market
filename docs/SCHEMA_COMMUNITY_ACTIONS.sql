-- 1. 사용자 차단 테이블 (User Blocks)
CREATE TABLE IF NOT EXISTS public.user_blocks (
    blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id)
);

-- RLS 설정
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blocks" 
ON public.user_blocks FOR SELECT 
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can insert their own blocks" 
ON public.user_blocks FOR INSERT 
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks" 
ON public.user_blocks FOR DELETE 
USING (auth.uid() = blocker_id);


-- 2. 커뮤니티 신고 테이블 (Community Reports)
CREATE TABLE IF NOT EXISTS public.community_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user')),
    target_id UUID NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 설정 (신고는 본인 것만 보거나, 관리자만 보게 설정 - 여기서는 본인 작성만 허용)
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own reports" 
ON public.community_reports FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" 
ON public.community_reports FOR SELECT 
USING (auth.uid() = reporter_id);
