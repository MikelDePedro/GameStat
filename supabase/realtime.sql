-- =========================================================
--  realtime.sql
--  Habilita la publicación realtime de Supabase en las
--  tablas que el frontend escucha.
--  Ejecutar UNA vez después de crear las tablas.
-- =========================================================

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.social_posts;
alter publication supabase_realtime add table public.social_post_likes;
alter publication supabase_realtime add table public.social_post_comments;
