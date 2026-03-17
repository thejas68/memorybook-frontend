-- Create enum for book member roles
CREATE TYPE public.book_role AS ENUM ('owner', 'contributor', 'viewer');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Memory books
CREATE TABLE public.memory_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  theme TEXT NOT NULL DEFAULT 'classic',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.memory_books ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_memory_books_updated_at BEFORE UPDATE ON public.memory_books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Book members
CREATE TABLE public.book_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.memory_books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role book_role NOT NULL DEFAULT 'viewer',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(book_id, user_id)
);
ALTER TABLE public.book_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view book members" ON public.book_members FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.book_members bm WHERE bm.book_id = book_members.book_id AND bm.user_id = auth.uid()));
CREATE POLICY "Owners can manage members" ON public.book_members FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.book_members bm WHERE bm.book_id = book_members.book_id AND bm.user_id = auth.uid() AND bm.role = 'owner'));
CREATE POLICY "Owners can update members" ON public.book_members FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.book_members bm WHERE bm.book_id = book_members.book_id AND bm.user_id = auth.uid() AND bm.role = 'owner'));
CREATE POLICY "Owners can delete members" ON public.book_members FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.book_members bm WHERE bm.book_id = book_members.book_id AND bm.user_id = auth.uid() AND bm.role = 'owner'));

-- Memory books RLS
CREATE POLICY "Members can view their books" ON public.memory_books FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.book_members WHERE book_id = id AND user_id = auth.uid()));
CREATE POLICY "Authenticated users can create books" ON public.memory_books FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners can update books" ON public.memory_books FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.book_members WHERE book_id = id AND user_id = auth.uid() AND role = 'owner'));
CREATE POLICY "Owners can delete books" ON public.memory_books FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.book_members WHERE book_id = id AND user_id = auth.uid() AND role = 'owner'));

-- Pages
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.memory_books(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Memory',
  content JSONB DEFAULT '{}',
  page_number INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Members can view pages" ON public.pages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.book_members WHERE book_id = pages.book_id AND user_id = auth.uid()));
CREATE POLICY "Contributors can create pages" ON public.pages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND EXISTS (SELECT 1 FROM public.book_members WHERE book_id = pages.book_id AND user_id = auth.uid() AND role IN ('owner', 'contributor')));
CREATE POLICY "Authors can update own pages" ON public.pages FOR UPDATE TO authenticated
  USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own pages" ON public.pages FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

-- Reactions
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(page_id, user_id, emoji)
);
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view reactions" ON public.reactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pages p JOIN public.book_members bm ON bm.book_id = p.book_id WHERE p.id = reactions.page_id AND bm.user_id = auth.uid()));
CREATE POLICY "Members can add reactions" ON public.reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.pages p JOIN public.book_members bm ON bm.book_id = p.book_id WHERE p.id = reactions.page_id AND bm.user_id = auth.uid()));
CREATE POLICY "Users can remove own reactions" ON public.reactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Activity log
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.memory_books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view activity" ON public.activity_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.book_members WHERE book_id = activity_log.book_id AND user_id = auth.uid()));
CREATE POLICY "Members can log activity" ON public.activity_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.book_members WHERE book_id = activity_log.book_id AND user_id = auth.uid()));

-- Auto-add creator as owner when a book is created
CREATE OR REPLACE FUNCTION public.add_book_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.book_members (book_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_book_created
  AFTER INSERT ON public.memory_books
  FOR EACH ROW EXECUTE FUNCTION public.add_book_owner();

-- Storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('memory-uploads', 'memory-uploads', true);

CREATE POLICY "Members can upload files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'memory-uploads');
CREATE POLICY "Anyone can view uploads" ON storage.objects FOR SELECT
  USING (bucket_id = 'memory-uploads');
CREATE POLICY "Users can delete own uploads" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'memory-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);