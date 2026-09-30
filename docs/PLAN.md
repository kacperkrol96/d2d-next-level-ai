# Plan etapów — wersja 1.0

Każdy etap kończy się: działającą wersją do obejrzenia na iPadzie/telefonie, zielonymi testami i krótkim opisem „co sprawdzić”.

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

## Etap 1 — logowanie, role, Orbita, Skarbiec, KPI

- Supabase: projekt, tabele konfiguracji (poziomy, KPI, przedziały, flota, reguły, statusy, odznaki) + dane startowe z `src/lib/config/seed.ts`
- Logowanie Google Workspace (tylko domena firmy), profile użytkowników, role, struktura (kto komu podlega)
- Zabezpieczenie danych w bazie (Row Level Security: każdy widzi siebie i swoją strukturę)
- Panel admina: edycja stawek/progów/wag, umowa ze spółką (rodzaj, data końca, wariant), auto firmowe, target spółki, kwoty za opiekę nad zespołem
- Orbita i Skarbiec na danych z bazy; zapis „najwyższego poziomu” (poziom nie spada)
- Ceremonia awansu (pełny ekran), efekt „przelewu” szara → zielona
- Przycisk „zgłoś błąd przypisania klienta”
- Domena `app.nextlevelenergy.pl` na Vercel, przycisk „Zaloguj” na stronie www

## Etap 2 — Akademia + Wieża

- Akademia: ścieżki audytora i handlowca, moduły (skrypt, bank obiekcji, filmy, quizy), egzaminy sprawdzane automatycznie, odblokowywanie etapów
- Wieża: zespół, postępy w Akademii, alerty KPI poniżej minimum
- Opinie 5★: wgrywanie screena + zdjęcia, zgoda klienta, odczyt AI, akceptacja managera jednym kliknięciem, automatyczne usuwanie po 90 dniach

## Etap 3 — Mennica

- Rozliczenie okresu (co 2 tygodnie), akceptacja/korekta zarządu z powodem i historią zmian
- Akceptacja w Skarbcu przez handlowca/audytora
- B2B: dane do faktury; Umowa zlecenia: rachunek PDF + wysyłka mailem do dyrektora biura i księgowości
- Korekty po rezygnacji klienta (potrącenie w kolejnym okresie)

## Etap 4 — Konfigurator, Radar, Misje

- Konfigurator: podłączenie logiki z repo `kacperkrol96/kalkulator-nle` (bez kopiowania) — **poproszę o dodanie repo do sesji**
- Radar: oferty od audytorów, zasada 3 dni (przypomnienie, czerwona + powód, przekazanie do Wieży), puls radaru, powiadomienia
- Misje: kalendarz, zadania, spotkania, synchronizacja z Kalendarzem Google

## Etap CRM (równolegle, gdy będzie klucz API)

- Klient RRUP (`https://funduszremontowy.rrcrm.pl/api/v1`) w miejsce danych testowych — ten sam interfejs `CrmProvider`
- Mapowanie prawdziwych nazw statusów, historia statusów i przypisań (obejście pustego pola pracownika i błędu 422)
- Filtr RODO na wejściu (tylko potrzebne pola)

## Etap 5 — Terytorium

- Rejony rysowane przez managera na mapie (MapLibre), domy z danych Geoportalu
- Statusy domów, potwierdzenie obecności GPS (~30 m), procent wyczyszczenia rejonu, fala na mapie
- Czas pracy = czas otwartej aplikacji, GPS tylko w godzinach pracy

## Kolejne wersje

1.1 Symulator (trener głosowy AI) · 2.0 rankingi, konkursy, awatary 3D · 3.0 Arena · 4.0 bank i księgowość
