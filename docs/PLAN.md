# Plan etapów — wersja 1.0

## Jak wydajemy etapy

1. Każdy etap na osobnej gałęzi → Pull Request (GitHub Actions uruchamia lint, typy, testy i build).
2. Kacper ogląda etap na linku podglądowym Vercel (preview) na iPadzie — do czasu etapu Dostępy: na zrzutach ekranu w PR (`docs/zrzuty/`).
3. Scalenie do `main` (produkcja) TYLKO po akceptacji Kacpra.
4. Po etapie Kacper dostaje: link do PR, link do podglądu, listę rzeczy do przetestowania.

## ⚠️ Przed startem z prawdziwymi danymi

- [ ] Supabase: przejście z planu darmowego na **Pro**
- [ ] Supabase: włączone **kopie zapasowe** (Point-in-Time Recovery) i test odtworzenia
- [ ] Vercel Pro: domena `app.nextlevelenergy.pl`, zmienne środowiskowe produkcji
- [ ] Klucz RRUP tylko w ustawieniach Vercel

Plan: Supabase darmowy na czas budowy (dane testowe), Vercel Pro (projekt firmowy).

## Etap 0 — specyfikacja i szkielet ✅

- [x] `docs/SPEC.md`, `docs/PLAN.md`, `CLAUDE.md`
- [x] Next.js 16 + TypeScript + Tailwind 4 + Framer Motion, PWA (manifest, ikona, tryb pełnoekranowy)
- [x] Logowanie testowe (wybór osoby), role, ochrona stron
- [x] Nawigacja: pasek boczny (iPad/komputer), dolny pasek 5 ikon + menu (telefon)
- [x] Konfiguracja biznesowa jako dane (stawki, progi, wagi, KPI, flota, statusy) — `src/lib/config`
- [x] Silnik obliczeń: prowizje handlowca i audytora, dyferencja, KPI, poziomy, flota, okresy i rozliczenie — `src/lib/domain` + testy
- [x] Warstwa CRM z danymi testowymi (bez PESEL itp.) — `src/lib/crm`
- [x] Orbita na danych testowych, komponent `Avatar(level, size)` (10 poziomów SVG), galeria `/orbita/awatary`
- [x] Animacja licznika prowizji („liczarka banknotów” + odlot do Skarbca, dźwięk z wyciszeniem)
- [x] Kokpit (Rozpocznij dzień + GPS), Skarbiec (lista prowizji), pozostałe panele jako zapowiedzi
- [x] Poprawki po przeglądzie: Solo/Duet z rodzajów umów, awanse handlowców ze strukturą od poz. 5 (edytowalne), KPI 0–29 = 75% + alert + żółta kartka, flota jako pozycja „Flota” w rozliczeniu (Skarbiec, podgląd w Mennicy), CI na Pull Requestach
- [x] Odpowiedzi Kacpra na założenia (SPEC.md → „Założenia i decyzje”)

## Kolejność (decyzja Kacpra): najpierw wszystko na danych testowych

Dostępy (Supabase, Vercel, Google) pomijamy do czasu, aż Kacper je poda. Warstwa danych jest od początku gotowa pod Supabase: jedno miejsce podmiany źródła (`src/lib/data` → `getDataSource()`), ekrany i serwisy z niego korzystają. Do każdego podsumowania etapu dołączamy zrzuty ekranu (iPad poziomo + telefon) — `docs/zrzuty/<etap>/`.

## Etap 1 — Skarbiec z Trajektorią ✅

- [x] Model danych jak w prawdziwym RRUP: typy umów, numery `INICJAŁY/NR/MM/RR/ZAKRES`, prawdziwe nazwy statusów
- [x] Tabele przypisań w konfiguracji: końcówka → zakres, status → kategoria (ścieżki statusów), inicjały → osoba
- [x] Przypisania: handlowiec = przypisany pracownik klienta (awaryjnie inicjały), audytor = „user” z umowy /A
- [x] Kolejka „Do wyjaśnienia” (nic nie liczymy na zgadywanych danych) — w Mennicy i w Skarbcu
- [x] Prowizje: kategorie statusów, Solo/Duet z końcówek, „sam VAT” (próg + brak REK, oferta ma pierwszeństwo), limit nadmarży bez REK, stawka wg poziomu z chwili zazielenienia, potrącenia po spadku w status negatywny
- [x] Okresy 1–15 / 16–koniec z terminami rozliczenia i wypłaty; odliczanie w Mennicy
- [x] KPI „Komplet dokumentów (handlowiec + biuro)” 24h i „Czas podpisania oferty” od „PRZEKAZANA DO PH”
- [x] Trajektoria: droga każdej umowy klienta przez statusy (daty, obecny, kolejny krok, kroki do zielonej), wejście z klienta lub szarej kwoty, lista „Moje umowy”
- [x] Powiadomienia „Biuro przesunęło umowę … do …” + karta „Ruchy biura”; odświeżanie przy otwarciu i co 15 min
- [x] Warstwa danych `DataSource` (dane testowe; Supabase w etapie Dostępy)

## Etap 2 — Akademia

- Ścieżki audytora i handlowca: skrypt, bank obiekcji, filmy, quizy
- Egzaminy sprawdzane automatycznie, etapy odblokowują się po zdaniu (animacja odblokowania)
- Statystyki powodów z Radaru → Akademia (gdy będzie Radar)

## Etap 3 — Wieża + Konstelacja (z eskadrami)

- Wieża: zespół, postępy w Akademii, alerty KPI poniżej minimum, zatwierdzanie opinii 5★ (screen + zdjęcie, zgoda, odczyt AI, usuwanie po 90 dniach)
- Konstelacja: struktura jako gwiazdozbiór, licznik „Twój zarobek ze struktury w tym miesiącu” (dyferencja + opieka nad zespołem), karta osoby
- Eskadry: zewnętrzne grupy (np. prefiks ŁB), własny lider i pakiet zasad, przełącznik w panelu admina, historia po wyłączeniu

## Etap 4 — Mennica (akceptacje na danych testowych)

- Rozliczenie okresu, akceptacja/korekta zarządu z powodem i historią zmian, akceptacja osoby w Skarbcu
- B2B: dane do faktury; Umowa zlecenia: rachunek PDF + wysyłka mailem
- Obsługa kolejki „Do wyjaśnienia”, panel admina: tabele przypisań, stawki, terminy

## Etap 5 — Radar i Misje

- Radar: start od „PRZEKAZANA DO PH”, zasada 3 dni (przypomnienie, czerwona + powód, Wieża po 7 dniach), puls radaru
- Misje: kalendarz, zadania, spotkania, synchronizacja z Kalendarzem Google

## Etap Dostępy — logowanie Google, baza, podgląd Vercel (⚠️ PRZED PILOTEM — przypomnieć Kacprowi)

- Supabase (tabele z `src/lib/config/seed.ts`, RLS), `SupabaseDataSource` w miejsce danych testowych
- Logowanie Google Workspace, profile i role
- Vercel: podgląd na każdy PR + domena `app.nextlevelenergy.pl`, przycisk „Zaloguj” na www

## Etap CRM — prawdziwe dane RRUP (gdy będzie klucz)

- `RrupCrm` w miejsce `MockCrm` (ten sam interfejs), webhooki RRUP jeśli dostępne
- Uzupełnienie ścieżek statusów i tabeli inicjałów, filtr RODO na wejściu

## Później w 1.0

- Konfigurator (logika z repo `kalkulator-nle` — poproszę o dodanie repo do sesji)
- Terytorium (rejony, mapa domów z Geoportalu, GPS)

## Kolejne wersje

1.1 Symulator (trener głosowy AI) · 2.0 rankingi, konkursy, awatary 3D · 3.0 Arena · 4.0 bank i księgowość
