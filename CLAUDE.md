@AGENTS.md

# D2D Next Level AI — zasady pracy

Pełna specyfikacja: `docs/SPEC.md`. Plan etapów: `docs/PLAN.md`.

## Właściciel

Kacper (Next Level Energy) NIE jest programistą. Piszemy do niego prosto, po polsku, krok po kroku.

## Zasady

1. **Etapami.** Po każdym etapie napisz prosto: co zostało zrobione i co sprawdzić na iPadzie/telefonie. Aktualizuj `docs/PLAN.md`.
2. **Żadnych haseł ani kluczy w kodzie** — tylko zmienne środowiskowe (`.env.local`, ustawienia Vercel). Wzór: `.env.example`.
3. **Każde obliczenie prowizji, KPI, floty i awansu ma testy automatyczne** (`npm test`).
4. **Przed dużą zmianą architektury — zapytaj Kacpra.**
5. **Zero liczb biznesowych na sztywno w kodzie.** Stawki, progi, wagi, procenty, statusy — tylko z `getConfig()` (`src/lib/config`). Funkcje w `src/lib/domain` przyjmują konfigurację jako parametr.
6. **Łącznik RRUP (MCP):** adres łącznika NIGDY nie trafia do repozytorium, kodu, dokumentacji ani zrzutów. Z łącznika korzystamy tylko do odczytu struktury danych, bez danych osobowych klientów.
7. **RODO:** nigdy nie pobieramy ani nie zapisujemy PESEL, numerów ksiąg wieczystych, numerów działek ani innych zbędnych danych z CRM.
8. **CRM tylko przez źródło danych** (`getDataSource().crm()`) — dane testowe w kształcie RRUP, dopóki nie ma klucza.
9. **Konfigurator:** nie kopiujemy logiki z `kacperkrol96/kalkulator-nle` — używamy jej z tamtego repo.
10. **Wydawanie:** każdy etap na osobnej gałęzi → Pull Request. Scalenie do `main` TYLKO po akceptacji Kacpra (ogląda podgląd Vercel na iPadzie). Po etapie podaj: link do PR, link do podglądu, listę do przetestowania.
11. **Zrzuty ekranu:** do każdego podsumowania etapu dołącz zrzuty (iPad poziomo + telefon) kluczowych widoków, zapisane w `docs/zrzuty/<etap>/`.
12. **Dane tylko przez `getDataSource()`** (`src/lib/data`) — jedno miejsce podmiany na Supabase; nie licz prowizji na zgadywanych danych (nierozpoznane → „Do wyjaśnienia”).
13. **Przed pilotem** przypomnij o etapie „Dostępy” (Supabase, logowanie Google, Vercel).
14. **Przed prawdziwymi danymi** przypomnij Kacprowi: Supabase Pro + kopie zapasowe (lista w `docs/PLAN.md`).
15. Nazwy paneli są obowiązkowe: Kokpit, Orbita, Skarbiec, Radar, Misje, Terytorium, Akademia, Konfigurator, Wieża, Konstelacja, Mennica.

## Wygląd i ruch

- Kolory i czcionki jako tokeny w `src/app/globals.css` (`bg`, `card`, `accent`, `gold`, `earned`, `muted`). Liczby klasą `num` (Sora).
- Animacje: krótko, sprężyście, jeden efekt naraz; zawsze szanuj „ogranicz ruch” (`useReducedMotion`).
- Awatar poziomu tylko przez `<Avatar level size />` (`src/components/orbit/Avatar.tsx`).
- Na telefonie bez tabel; jeden ekran = jedna decyzja.

## Struktura

- `src/lib/config` — typy i dane startowe konfiguracji (docelowo tabele Supabase)
- `src/lib/domain` — czyste obliczenia (rozpoznawanie umów i statusów, prowizje, KPI, poziomy, flota, okresy, trajektoria) + `__tests__`
- `src/lib/data` — źródło danych (`DataSource`): dziś dane testowe, potem Supabase
- `src/lib/crm` — model i dane testowe CRM (RRUP)
- `src/lib/auth` — sesja (Etap 0: testowa; Etap 1: Supabase + Google Workspace)
- `src/lib/services` — składanie danych dla ekranów
- `src/app/(app)/<panel>` — ekrany paneli; `src/components` — komponenty UI

## Polecenia

- `npm run dev` — podgląd lokalny (http://localhost:3000)
- `npm test` — testy obliczeń
- `npm run lint`, `npm run typecheck`, `npm run build`
