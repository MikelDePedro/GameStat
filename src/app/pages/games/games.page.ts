import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonSpinner,
  IonText,
  IonThumbnail
} from '@ionic/angular/standalone';
import { InfiniteScrollCustomEvent, SearchbarCustomEvent } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  heart,
  heartOutline,
  informationCircleOutline,
  starOutline
} from 'ionicons/icons';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  switchMap,
  tap
} from 'rxjs';

import { RawgGame, RawgGameDetails, RawgGamesPage } from '../../core/models/rawg.models';
import { AuthService } from '../../core/services/auth.service';
import { GamesService } from '../../core/services/games.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonContent,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonItem,
    IonLabel,
    IonList,
    IonSearchbar,
    IonSpinner,
    IonText,
    IonThumbnail
  ],
  styleUrls: ['./games.page.scss'],
  templateUrl: './games.page.html'
})
export class GamesPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchTerms$ = new Subject<string>();
  readonly supabaseSyncEnabled = this.gamesService.supportsSupabaseSync();

  readonly fallbackCover = 'https://via.placeholder.com/400x240?text=Sin+imagen';

  searchTerm = '';
  games: RawgGame[] = [];

  isLoading = false;
  isLoadingMore = false;
  hasNextPage = true;
  currentPage = 1;
  errorMessage = '';

  detailsLoading = false;
  detailsError = '';
  selectedGameDetails: RawgGameDetails | null = null;

  favoritesError = '';
  favoriteIds = new Set<number>();
  private favoriteLoadingIds = new Set<number>();

  constructor(
    private readonly gamesService: GamesService,
    private readonly authService: AuthService
  ) {
    addIcons({
      starOutline,
      calendarOutline,
      informationCircleOutline,
      heart,
      heartOutline
    });

    this.setupSearchStream();
  }

  ngOnInit(): void {
    if (this.supabaseSyncEnabled) {
      this.loadFavoriteIds();
    }

    this.searchTerms$.next('');
  }

  onSearchInput(event: SearchbarCustomEvent): void {
    this.searchTerms$.next(event.detail.value ?? '');
  }

  loadMore(event: InfiniteScrollCustomEvent): void {
    if (!this.hasNextPage || this.isLoading || this.isLoadingMore) {
      event.target.complete();
      return;
    }

    this.isLoadingMore = true;
    const nextPage = this.currentPage + 1;

    this.fetchGames(this.searchTerm, nextPage)
      .pipe(
        finalize(() => {
          this.isLoadingMore = false;
          event.target.complete();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (page) => {
          this.games = [...this.games, ...page.items];
          this.currentPage = page.page;
          this.hasNextPage = page.hasNextPage;
          event.target.disabled = !this.hasNextPage;

          void this.syncGamesWithSupabase(page.items);
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
        }
      });
  }

  retry(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.fetchGames(this.searchTerm, 1)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (page) => {
          this.games = page.items;
          this.currentPage = page.page;
          this.hasNextPage = page.hasNextPage;
          void this.syncGamesWithSupabase(page.items);
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
        }
      });
  }

  loadGameDetails(gameId: number): void {
    this.detailsError = '';
    this.detailsLoading = true;

    this.gamesService
      .getGameDetails(gameId)
      .pipe(
        finalize(() => {
          this.detailsLoading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (details) => {
          this.selectedGameDetails = details;
        },
        error: (error: Error) => {
          this.detailsError = error.message;
        }
      });
  }

  toggleFavorite(game: RawgGame): void {
    if (!this.supabaseSyncEnabled) {
      this.favoritesError =
        'Favoritos desactivados. Activa rawg.syncWithSupabase y crea las tablas en Supabase.';
      return;
    }

    const userId = this.authService.currentUser()?.id;

    if (!userId) {
      this.favoritesError = 'Inicia sesion para guardar favoritos en Supabase.';
      return;
    }

    this.favoritesError = '';
    const currentlyFavorite = this.favoriteIds.has(game.id);
    this.favoriteLoadingIds.add(game.id);

    const request$ = currentlyFavorite
      ? this.gamesService.removeFavoriteGame(userId, game.id)
      : this.gamesService.saveFavoriteGame(userId, game);

    request$
      .pipe(
        finalize(() => {
          this.favoriteLoadingIds.delete(game.id);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          if (currentlyFavorite) {
            this.favoriteIds.delete(game.id);
          } else {
            this.favoriteIds.add(game.id);
          }

          this.favoriteIds = new Set(this.favoriteIds);
        },
        error: (error: Error) => {
          this.favoritesError = error.message;
        }
      });
  }

  isFavorite(gameId: number): boolean {
    return this.favoriteIds.has(gameId);
  }

  isFavoriteLoading(gameId: number): boolean {
    return this.favoriteLoadingIds.has(gameId);
  }

  closeDetails(): void {
    this.selectedGameDetails = null;
    this.detailsError = '';
  }

  trackByGameId(_: number, game: RawgGame): number {
    return game.id;
  }

  private setupSearchStream(): void {
    this.searchTerms$
      .pipe(
        map((term) => term.trim()),
        debounceTime(350),
        distinctUntilChanged(),
        tap((term) => {
          this.searchTerm = term;
          this.currentPage = 1;
          this.hasNextPage = true;
          this.errorMessage = '';
          this.selectedGameDetails = null;
          this.games = [];
          this.isLoading = true;
        }),
        switchMap((term) =>
          this.fetchGames(term, 1).pipe(
            catchError((error: Error) => {
              this.errorMessage = error.message;
              return of(this.emptyPage());
            }),
            finalize(() => {
              this.isLoading = false;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((page) => {
        this.games = page.items;
        this.currentPage = page.page;
        this.hasNextPage = page.hasNextPage;

        void this.syncGamesWithSupabase(page.items);
      });
  }

  private fetchGames(query: string, page: number) {
    return query
      ? this.gamesService.searchGames(query, page)
      : this.gamesService.getPopularGames(page);
  }

  private emptyPage(): RawgGamesPage {
    return {
      items: [],
      count: 0,
      page: 1,
      pageSize: 20,
      next: null,
      previous: null,
      hasNextPage: false
    };
  }

  private loadFavoriteIds(): void {
    const userId = this.authService.currentUser()?.id;

    if (!userId) {
      return;
    }

    this.gamesService
      .getFavoriteGames(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ids) => {
          this.favoriteIds = new Set(ids);
        },
        error: (error: Error) => {
          this.favoritesError = error.message;
        }
      });
  }

  private syncGamesWithSupabase(games: RawgGame[]): void {
    if (!this.supabaseSyncEnabled || !games.length || !this.authService.currentUser()) {
      return;
    }

    this.gamesService
      .syncGamesWithSupabase(games)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          // Mantiene la sincronizacion como opcion no bloqueante para la UX.
        }
      });
  }
}
