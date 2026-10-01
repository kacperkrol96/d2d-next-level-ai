# Plan etapów — wersja 1.0

## Jak wydajemy etapy

1. Każdy etap na osobnej gałęzi → Pull Request (GitHub Actions uruchamia lint, typy, testy i build).
2. Kacper ogląda etap na linku podglądowym Vercel (preview) na iPadzie — do czasu etapu Dostępy: na zrzutach ekranu w PR (`docs/zrzuty/`).
3. Scalenie do `main` (produkcja) TYLKO po akceptacji Kacpra.
4. Po etapie Kacper dostaje: link do PR, link do podglądu, listę rzeczy do przetestowania.

## ⚠️ Przed startem z prawdziwymi danymi

- [ ] Vercel: przejście na **Pro** (zespół „Next Level Energy”, faktura na firmę z NIP) — PRZED PILOTEM
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
- [x] Poprawki po przeglądzie: „Dopłata do Duetu”; handlowiec ze źródeł aplikacja → CRM → historia (inicjały tylko podpowiedzią + „Potwierdź” w Mennicy); DZIAŁ PRAWNY = negatywny; próg i nadmarża jako ręczne pola przy kliencie; KPI „Raportowanie” dla obu ról, nowe wagi handlowca + walidacja wag; reguła „Nie ma w aplikacji…” z datą włączenia i ostrzeżeniami

## Etap 2 — Akademia ✅

- [x] Ścieżki audytora i handlowca: skrypt, bank obiekcji (karty do odwracania), filmy (miejsce na link), quizy ćwiczeniowe — treści jako dane, przykładowe do podmiany
- [x] Egzaminy sprawdzane automatycznie na serwerze, jedno pytanie na ekran, wielokrotny wybór, wyjaśnienia błędów
- [x] Odblokowywanie etapów po zdaniu + animacja otwieranego zamka; „Następny krok” i postęp ścieżki
- [x] Ustawienia: próg zaliczenia, przerwa po niezdanym egzaminie, wymóg lekcji przed egzaminem (+ testy)
- [x] Postęp w źródle danych (`DataSource`) — gotowy pod Supabase i pod Wieżę
- [ ] Prawdziwe treści od NLE (skrypty, obiekcje, filmy, pytania) — do wgrania; edycja treści w panelu admina (Etap 4)
- [ ] Statystyki powodów z Radaru → Akademia (po Etapie 5)

## Paczka zbiorcza (po Etapie 2) ✅

- [x] „Dopłata nadmarży” (nadmarża wpisana po wypłacie); „Potwierdź” tylko dla Zarządu z historią (kto, kiedy, poprzednia wartość)
- [x] Akademia D1–D4 + ścieżka managera na treściach NLE (poprawionych wg SPEC), egzaminy: zamknięte automatycznie, otwarte ocenia manager; scenka D2 i karty obserwacji D3/D4 wypełniane przez managera; Launch Pad 90 dni
- [x] Klucze odpowiedzi tylko na serwerze — test grafu importów + kontrola paczki w CI
- [x] Kontrakt jako zwój przy pierwszym uruchomieniu (3 motywy, podpis palcem, wersje, rejestr akceptacji, edycja admina) + lista rozbieżności dla prawnika
- [x] Kartki: żółte (ręczne z powodem + automatyczne), czerwona (3 / 2 / 2), historia w Orbicie
- [x] Safety / Next Level u audytora (Orbita: system, pasek do progu, podgląd Next Level; rozliczenie), awans od następnej umowy
- [x] Rytm pracy: cele dnia w Kokpicie, odprawy w Misjach, „Zamknij dzień” do 21:00, licznik nagrań
- [x] Reguły terenu i leadów (logika + testy; ekrany w Etapach 5–6)
- [x] Filmy YouTube: własny odtwarzacz, ≥90% obejrzane, przypisywanie linków przez admina, rejestr obejrzeń, atrapy
- [x] Decyzje Kacpra: D4 z 3 opcjami, podpowiedź 50/70 w scence, R1 „kolejność” wg obecnego skryptu, Launch Pad M1 = 5 pomiarów, stawka 31,40 zł/h, pomiar od TWORZENIE OFERTY, bez procentów przed pomiarem, przywrócone adresy czystepowietrze.gov.pl
- [x] Tryb próbny egzaminów do czasu weryfikacji kluczy (przełącznik per egzamin) + `docs/tresci/KLUCZE_DO_WERYFIKACJI.md`
- [ ] Kacper: weryfikacja kluczy egzaminów i włączenie przełączników

## Etap 3 — Wieża + Konstelacja (z eskadrami) ✅

- [x] Wieża: alerty zespołu (czerwona kartka, KPI < 30, nagrania < 20%, egzaminy do oceny, karty do wypełnienia), karty osób (KPI, mnożnik, nagrania, kartki, Akademia)
- [x] Wieża: nadawanie żółtych kartek z uzasadnieniem, spóźnień i nieobecności; zmiana systemu Safety → Next Level (i czasowy powrót) z powodem
- [x] Wieża: opinie 5★ — screen + zdjęcie, odczyt AI (gwiazdki, nazwisko, data), zgoda na zdjęcie, zatwierdź / odrzuć z powodem, usuwanie plików po 90 dniach, licznik do KPI
- [x] Konstelacja: gwiazdozbiór struktury (jasność = aktywność, czerwona obwódka = alert), licznik „Twój zarobek ze struktury” (dyferencja + opieka nad zespołem), poprzedni miesiąc, karta osoby
- [x] Eskadry: klienci z prefiksem aktywnej eskadry (ŁB) poza kolejką „Do wyjaśnienia”, rozliczenie lidera wg pakietu zasad, przełącznik w Mennicy → Ustawienia z historią
- [ ] Miejsca pod etapy 5–6: puste przejścia, wyjątki od reguły „Nie ma w aplikacji…”, odsłuch nagrań (zapowiedzi w Wieży)
- [ ] Do potwierdzenia: dyferencja handlowców liczona z różnicy stawek Solo/Duet (bez udziału w nadmarży); kwoty opieki nad zespołem i pakiet zasad eskadry ŁB — wpisuje Zarząd

## Etap 4 — Mennica (akceptacje na danych testowych)

- Rozliczenie okresu, akceptacja/korekta zarządu z powodem i historią zmian, akceptacja osoby w Skarbcu
- B2B: dane do faktury; Umowa zlecenia: rachunek PDF + wysyłka mailem
- Obsługa kolejki „Do wyjaśnienia”, panel admina: tabele przypisań (z kontami osób dla inicjałów), stawki, terminy, wagi KPI z walidacją (suma 20, min. 2), ręczne pola klienta (próg dochodowy, nadmarża), data włączenia reguły „Nie ma w aplikacji…”

## Etap 5 — Radar i Misje (+ leady, nagrania)

- Radar: start od „PRZEKAZANA DO PH”, zasada 3 dni (przypomnienie, czerwona + powód, Wieża po 7 dniach), puls radaru
- Misje: kalendarz, zadania, spotkania umawiane tylko w aplikacji, synchronizacja z Kalendarzem Google
- Lead w aplikacji: formularz + **lead głosem** (dyktowanie → AI wypełnia → zatwierdzenie jednym kliknięciem)
- Kolejka „Do wysłania do CRM” dla leadów i spotkań (wysyłka po uzyskaniu prawa zapisu w RRUP)
- **Nagrywanie rozmów v1.0**: „Nagraj” → „Wyślij” na audycie i spotkaniu, formuła informacyjna + checkbox zgody, powiązanie z klientem/spotkaniem, lista nagrań w Wieży (per osoba, filtr), auto-usuwanie po X dniach (domyślnie 30)
- Tryb offline (kolejka zapisów + nagrań, synchronizacja po odzyskaniu zasięgu)
- Leady z aplikacji zasilają regułę „Nie ma w aplikacji = nie ma klienta” (logika gotowa od Etapu 1; włączenie datą w ustawieniach, 2 tygodnie po starcie pilota) + wyjątki managera z powodem
- Dopasowanie lead ↔ klient w CRM (numer klienta po wysłaniu; wcześniej telefon + adres; niepewne → „Do wyjaśnienia”)

## Etap 6 — Terytorium i raportowanie w terenie

- Rejony rysowane przez managera, domy z Geoportalu, statusy domów, procent wyczyszczenia rejonu, fala na mapie
- **Odhaczenie domu w 2 sekundy** (GPS podświetla najbliższy dom), potwierdzenie obecności ~30 m
- **Aktywne bloki czasu pracy** (min. 1 dom / 15 min — w ustawieniach), **„Zamknij dzień”** z obowiązkowym podsumowaniem
- **Alert „puste przejścia”** w Wieży (GPS minął X domów, odhaczono Y — próg w ustawieniach)
- **KPI „Raportowanie” z aplikacji** (% aktywnych bloków) — u audytorów i handlowców; dziś wartości testowe, w tym etapie liczone z Terytorium (+ testy)
- Ograniczenie: GPS tylko przy otwartej aplikacji (PWA na iOS nie działa w tle) — weryfikacja w pilocie

## Etap Dostępy — logowanie Google, baza, podgląd Vercel (⚠️ PRZED PILOTEM — przypomnieć Kacprowi)

- Supabase (tabele z `src/lib/config/seed.ts`, RLS), `SupabaseDataSource` w miejsce danych testowych
- Supabase Storage na nagrania (auto-usuwanie po X dniach) i pliki opinii 5★
- Logowanie Google Workspace, profile i role
- Vercel: podgląd na każdy PR + domena `app.nextlevelenergy.pl`, przycisk „Zaloguj” na www

## Etap CRM — prawdziwe dane RRUP (gdy będzie klucz)

- `RrupCrm` w miejsce `MockCrm` (ten sam interfejs), webhooki RRUP jeśli dostępne
- Uzupełnienie ścieżek statusów i tabeli inicjałów, filtr RODO na wejściu
- Gdy będzie prawo zapisu w RRUP: wysyłka kolejki leadów i spotkań do CRM

## Później w 1.0

- Konfigurator (logika z repo `kalkulator-nle` — poproszę o dodanie repo do sesji)

## Kolejne wersje

1.1 Symulator (trener głosowy AI) + transkrypcja i ocena nagranych rozmów wg rubryki skryptu (audio usuwane po transkrypcji, dane osobowe ukryte) · 2.0 rankingi, konkursy, awatary 3D · 3.0 Arena · 4.0 bank i księgowość
