# Supabase migrations

Ejecuta estos scripts en el SQL editor de Supabase, en este orden:

1. `profiles.sql` — Tabla `profiles` + trigger que crea perfil al registrarse.
2. `rawg_games.sql` — Cache de juegos RAWG + favoritos.
3. `game_reviews.sql` — Reviews de juegos.
4. `follows.sql` — Sistema de seguir / dejar de seguir.
5. `social_posts.sql` — Posts del feed social + likes + comentarios.
6. `chat.sql` — Conversaciones privadas / grupales + mensajes + RPC.
7. `realtime.sql` — Habilita publicación realtime en las tablas relevantes.
8. `seed_demo.sql` — (Opcional) Usuarios demo + datos de prueba. Lee el archivo antes de ejecutar.

## Arquitectura DB (resumen)

| Tabla / Vista                     | Propósito                                       |
| --------------------------------- | ----------------------------------------------- |
| `profiles`                        | Perfil público del usuario                      |
| `follows`                         | Relación follower → followed                    |
| `social_posts`                    | Posts del feed                                  |
| `social_post_likes`               | Likes por post / usuario                        |
| `social_post_comments`            | Comentarios anidados a un post                  |
| `social_feed` (vista)             | Posts con contador de likes y autor             |
| `conversations`                   | Conversación privada o grupal                   |
| `conversation_participants`       | Miembros de cada conversación                   |
| `messages`                        | Mensajes de chat                                |
| `game_reviews`                    | Reviews de juegos                               |
| `rawg_games` / `favorite_games`   | Cache RAWG y favoritos por usuario              |

## RPCs disponibles

* `get_or_create_private_conversation(other_user uuid) → uuid`
* `create_group_conversation(title text, avatar text, member_ids uuid[]) → uuid`
* `add_group_member(conv_id uuid, new_user uuid) → void`
* `remove_group_member(conv_id uuid, target_user uuid) → void`
