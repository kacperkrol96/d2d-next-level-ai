# D2D Next Level AI — specyfikacja

Aplikacja dla Next Level Energy (NLE, marka Fundusz Remontowy): termomodernizacja domów w programie Czyste Powietrze, sprzedaż D2D w 7 województwach.

## Cel

Aplikacja dla audytorów, handlowców (handlowcy są też managerami audytorów), managerów i zarządu. Ma:

- odciążyć managerów onboardingiem,
- pokazać ludziom na żywo zarobki, KPI i awanse,
- uporządkować rozliczenia prowizji,
- dawać efekt „wow” — premium, futurystycznie, jak aplikacje Apple.

## Platformy

- Jedna aplikacja PWA: iPad (główne urządzenie handlowców), telefon, komputer.
- Adres docelowy: `app.nextlevelenergy.pl`, logowanie przyciskiem „Zaloguj” ze strony `www.nextlevelenergy.pl`.
- Logowanie kontem Google Workspace firmy.
- Układ responsywny:
  - iPad poziomo = pasek boczny,
  - telefon = dolny pasek 5 ikon (Kokpit, Radar, Misje, Terytorium, Orbita), reszta w menu,
  - komputer = pełny panel.

## Role

Audytor, Handlowiec (widzi też swój zespół audytorów), Manager, Zarząd/Admin. Każdy widzi tylko swoje dane i dane swojej struktury.

## Panele (nazwy obowiązkowe)

- **Kokpit** — ekran startowy: dziś, oferty, alerty, przycisk „Rozpocznij dzień” (start czasu pracy + GPS).
- **Orbita** — karta rozwoju: awatar poziomu w pierścieniu postępu, poziom, klienci do awansu, umowa ze spółką (rodzaj: B2B/zlecenie, data końca, wariant — pole od admina), stawki teraz i na kolejnym poziomie, KPI, flota, ścieżka 10 poziomów, odznaki.
- **Skarbiec** — prowizje: szare = do dopięcia, zielone = zarobione; rozliczenia do akceptacji.
- **Radar** — oferty od audytorów z licznikiem 3 dni.
- **Misje** — kalendarz, zadania, spotkania (tworzone przy wpisywaniu klienta), linki do klienta w CRM; synchronizacja z Kalendarzem Google.
- **Terytorium** — mapa rejonu od managera, każdy dom jako punkt (dane adresowe/budynki z państwowych danych Geoportalu), statusy: otworzył / nie otworzył / nie zainteresowany / umówione / wrócić. GPS POTWIERDZA obecność przy domu (np. 30 m), nie wykrywa sam. Procent „wyczyszczenia” rejonu. Czas pracy = czas otwartej aplikacji. GPS tylko w godzinach pracy.
- **Akademia** — onboarding: osobne ścieżki audytora i handlowca (skrypt, bank obiekcji, filmy, quizy), egzaminy sprawdzane automatycznie, etapy odblokowują się po zdaniu.
- **Konfigurator** — kalkulator ofertowy z repo `kacperkrol96/kalkulator-nle`. NIE kopiujemy logiki obliczeń — używamy jej z tamtego repo.
- **Wieża** — panel managera: zespół, rejony (rysowanie na mapie), postępy w Akademii, alerty z Radaru, zatwierdzanie opinii 5★.
- **Mennica** — panel zarządu: rozliczenia do akceptacji i korekty.

## Zasady prowizji

- Rozliczamy ZA KLIENTA, nie za umowę (termo + kocioł u jednego klienta = jedna prowizja).
- **Solo / Duet** to zakres umów u JEDNEGO klienta (nie liczba handlowców):
  - **Solo** = klient z jedną umową (samo termo ALBO samo źródło ciepła),
  - **Duet** = klient z dwiema umowami: termomodernizacja + źródło ciepła („prace po korek”).
  - Stawka należy się w całości handlowcowi przypisanemu do klienta — nic nie dzielimy między handlowców.
  - Solo/Duet rozpoznajemy automatycznie po rodzajach umów klienta w CRM. Lista rodzajów umów należących do „termo” i do „źródła ciepła” jest w konfiguracji (edytuje admin).
- **Handlowiec**: prowizja zielona od statusu „wysłanie wniosku do WFOŚ” lub dalej. Umowa „sam VAT” = prowizja −75%. Nadmarża od kwoty netto, limit 10% wartości umowy, udział wg poziomu. Brak minimum do utrzymania poziomu. Od poziomu 5 wzwyż do progów awansu wliczają się klienci całego zespołu (jego + wszystkich podległych handlowców); próg „od którego poziomu” jest edytowalny w panelu admina.
- **Audytor**: prowizja zielona od statusu umowy audytowej „po pomiarach”. Stawka zależy od progu dochodowego klienta (podstawowy/podwyższony/najwyższy). Bonus za zamknięcie — zawsze, gdy handlowiec zamknie klienta z audytu tego audytora. Poziom zdobyty raz zostaje na zawsze. Od poziomu 5 liczą się klienci struktury + aktywne osoby. Manager dostaje dyferencję.
- Wypłata = prowizja × mnożnik KPI.
- Rozliczenia co 2 tygodnie.
- Korekta po rezygnacji klienta po wypłacie: potrącenie w kolejnym okresie.
- WSZYSTKIE stawki, progi, wagi i procenty w bazie, edytowalne przez admina. Zero liczb na sztywno w kodzie.

## Tabela — handlowcy (dane startowe)

Solo = klient z jedną umową, Duet = klient z termo + źródłem ciepła. „Klientów do awansu” od poziomu 5 = klienci całego zespołu.

| Lvl | Stanowisko | Solo | Duet | Klientów do awansu | Udział w nadmarży |
|---|---|---|---|---|---|
| 1 | Młodszy Doradca Energetyczny | 3000 | 5000 | 0 | 30% |
| 2 | Doradca Energetyczny | 3500 | 5500 | 3 | 35% |
| 3 | Starszy Doradca Klienta | 4000 | 6000 | 6 | 40% |
| 4 | Młodszy Specjalista | 4500 | 6500 | 10 | 45% |
| 5 | Specjalista ds. Energii | 5000 | 7000 | 15 | 50% |
| 6 | Lider Zespołu | 5500 | 7500 | 50 | 55% |
| 7 | Kierownik Okręgu | 6000 | 8000 | 125 | 60% |
| 8 | Dyrektor Regionalny | 6500 | 8500 | 250 | 65% |
| 9 | Dyrektor Krajowy | 7500 | 9000 | 500 | 70% |
| 10 | Dyrektor Generalny | 8000 | 9500 | 1000 | 75% |

Od poziomu 5: wynagrodzenie za opiekę nad zespołem (kwoty wpisze admin).

## Tabela — audytorzy (dane startowe)

| Lvl | Stanowisko | Podstawowy | Podwyższony | Najwyższy | Bonus za zamknięcie | Do awansu |
|---|---|---|---|---|---|---|
| 1 | Młodszy Audytor Energetyczny | 600 | 800 | 1200 | 250 | 0 |
| 2 | Audytor Energetyczny | 675 | 900 | 1325 | 375 | 3 |
| 3 | Starszy Audytor Energetyczny | 750 | 1000 | 1450 | 500 | 10 |
| 4 | Ekspert Audytu | 825 | 1100 | 1575 | 625 | 30 |
| 5 | Starszy Ekspert Audytu | 900 | 1200 | 1700 | 750 | 50 + 2 osoby |
| 6 | Lider Zespołu Audytu | 975 | 1300 | 1825 | 875 | 100 + 4 osoby |
| 7 | Kierownik Okręgu Audytu | 1050 | 1400 | 1950 | 1000 | 200 + 6 osób |
| 8 | Dyrektor Regionalny Audytu | 1125 | 1500 | 2075 | 1125 | 350 + 8 osób |
| 9 | Dyrektor Krajowy Audytu | 1200 | 1600 | 2200 | 1250 | 600 + 10 osób |
| 10 | Dyrektor Generalny Audytu | 1275 | 1700 | 2325 | 1375 | 1000 + 15 osób |

## KPI

Przeliczane na żywo, widoczne w Orbicie z wpływem na wypłatę.

Mechanika (obie role): każde KPI oceniane na poziomie I–V (1–5 pkt) × waga; suma wag 20 → max 100 pkt.

| Wynik | Mnożnik |
|---|---|
| 0–29 | 75% + alert do managera + żółta kartka (zapis w historii osoby) |
| 30–45 | 75% |
| 46–58 | 80% |
| 59–69 | 90% |
| 70–89 | 100% |
| 90–100 | 110% |

### Audytor

| KPI | Waga | I | II | III | IV | V |
|---|---|---|---|---|---|---|
| Liczba unikalnych spotkań | 6 | 3 | 3,25 | 3,5 | 3,75 | 4 |
| Komplet leadów na cykl | 4 | 9 | 9,5 | 10 | 11 | 11,5 |
| Realizacja targetu spółki | 4 | 90% | 95% | 100% | 105% | 110% |
| Raportowanie CRM | 4 | 85% | 90% | 92,5% | 95% | 100% |
| Termin realizacji zadań w CRM | 2 | 48h | 36h | 24h | 12h | 0h |

### Handlowiec (propozycja domyślna, do zmiany w panelu)

| KPI | Waga | I | II | III | IV | V |
|---|---|---|---|---|---|---|
| Opinie 5★ | 5 | 70% | 75% | 80% | 90% | 95% |
| Komplet dokumentów w 24h | 5 | 70% | 80% | 90% | 95% | 100% |
| Średni wynik KPI podległych audytorów | 4 | 30 | 46 | 59 | 70 | 90 pkt |
| Czas podpisania oferty | 4 | ≤6 | ≤5 | ≤4 | ≤3,5 | ≤3 dni |
| Wynik spółki | 2 | 90% | 95% | 100% | 105% | 110% |

- **Opinie 5★** — % klientów z ofertą, którzy mają zaliczoną opinię 5★. Zaliczenie: handlowiec wgrywa screenshot opinii 5★ klienta z Google oraz zdjęcie z klientem. AI wstępnie odczytuje ze screena liczbę gwiazdek, nazwisko i datę; manager zatwierdza lub odrzuca w Wieży jednym kliknięciem. Wymagany checkbox „klient zgodził się na zdjęcie”. Screenshot i zdjęcie usuwane 90 dni po zaliczeniu.
- **Komplet dokumentów w 24h** — % klientów, u których od podpisania umowy do statusu „komplet dokumentów” minęło ≤24h (z historii statusów w CRM).
- **Czas podpisania oferty** — średni czas od statusu „oferta przekazana do handlowca” do podpisania umowy (z historii statusów w CRM). Oferta niepodpisana po 7 dniach wchodzi do średniej jako 7 dni.
- **Wynik spółki** — % targetu miesiąca (target wpisuje admin).

Żółte kartki: na razie kartka jest tylko zapisywana w historii osoby (najwyżej jedna na okres rozliczeniowy). Mechanizm kartek dla handlowców zdefiniujemy później.

## Flota (w Orbicie)

Handlowiec z autem firmowym: liczymy klientów w miesiącu (status jak przy prowizji). 0–1 klient = 1500 zł, 2–3 = 750 zł, 4+ = 0 zł. Pasek 0/4 i aktualny koszt.

Koszt auta za miesiąc jest potrącany automatycznie w najbliższym rozliczeniu po zakończeniu miesiąca (w okresie, który obejmuje 1. dzień następnego miesiąca). W Skarbcu i Mennicy widać go jako osobną pozycję „Flota”. Forma księgowa (potrącenie czy refaktura) do potwierdzenia z księgowym — nie blokuje budowy.

## Radar — zasada 3 dni

Audytor zapisuje ofertę → przypisany w CRM handlowiec dostaje powiadomienie.
- Dzień 1: przypomnienie.
- Dzień 3: oferta czerwona, handlowiec MUSI wybrać powód z listy obiekcji, alert do managera.
- Dzień 7: oferta trafia do Wieży (manager: zostaw / przejmij / zamknij).

Powody zasilają statystyki dla Akademii.

## Mennica — rozliczenia

1. Aplikacja liczy rozliczenie okresu (CRM + tabele + KPI).
2. Zarząd akceptuje lub koryguje (każda korekta wymaga powodu, pełna historia zmian).
3. Handlowiec/audytor akceptuje w Skarbcu.
4. B2B: aplikacja pokazuje dane do faktury (kwota netto, opis, dane NLE) do wystawienia przez niego. Umowa zlecenia: aplikacja generuje rachunek PDF i jednym kliknięciem wysyła go mailem do dyrektora biura i księgowości (adresy w ustawieniach admina).
5. Płatności poza aplikacją. Integracja z bankiem i programem księgowym dopiero w wersji 4.0.

## CRM (RRUP)

- API: `https://funduszremontowy.rrcrm.pl/api/v1`.
- W CRM jest moduł czasu trwania statusu — daty wejścia w statusy (m.in. „oferta przekazana do handlowca”, „komplet dokumentów”) bierzemy z historii statusów.
- Znane problemy: pole przypisanego pracownika wraca puste; zdarzenia klienta zwracają błąd 422. Audytora ustalamy z historii przypisań/zdarzeń (przypisanie zmienia się z audytora na handlowca).
- Warstwa CRM to osobny moduł z DANYMI TESTOWYMI. Prawdziwe połączenie dopiero po otrzymaniu klucza.
- RODO: nigdy nie pobieramy ani nie zapisujemy PESEL, numerów ksiąg wieczystych, numerów działek ani innych zbędnych danych.
- Przycisk „zgłoś błąd przypisania klienta”.

## Wygląd

- Ciemny motyw: tło `#0A0A0D`, karty `#16161C` (obramowanie `rgba(255,255,255,0.06)`, zaokrąglenie 24px), akcent fiolet NLE `#8E11BF` (tylko akcent), złoto `#D9B25F` (Orbita, awanse), zieleń `#5BD69A` (zarobione), szarość `#A1A1AA` (do dopięcia, opisy).
- Czcionki: Sora (liczby, nagłówki), Poppins (tekst).
- Dużo przestrzeni, jeden ekran = jedna decyzja, bez tabel na telefonie.
- **Awatary poziomów** — każda ranga inny kształt:
  - 1–2 brązowa tarcza (1 belka / 2 belki),
  - 3–4 srebrny heksagon z gwiazdą (4 dokłada skrzydełka),
  - 5–6 złoty medal z laurem (6 dokłada koronę i poświatę),
  - 7–8 platynowy kryształ z orbitą (8 dokłada duże skrzydła),
  - 9–10 fioletowa planeta z pierścieniem i skrzydłami (10 dokłada złotą koronę, aureolę i gwiazdy).
  - Na start wektorowo (SVG), jeden komponent `Avatar(level, size)`; w v2.0 podmienimy na grafiki 3D bez zmian w kodzie. Audytorzy dostaną osobny zestaw później.

## Ruch i animacje (część tożsamości aplikacji)

Zasady: krótko, sprężyście, jeden efekt naraz, płynne przejścia jak w iOS, szacunek dla ustawienia „ogranicz ruch”. W Terytorium animacje oszczędne (bateria + GPS).

Kluczowe momenty:
- Start aplikacji, gdy od ostatniego logowania doszła nowa prowizja: kwota na środku ekranu liczy się jak liczarka banknotów (szybko → zwalnia → ostatnie złotówki pojedynczo, ~3 s, dźwięk do wyciszenia), potem „odlatuje” do Skarbca.
- Awans: pełnoekranowa ceremonia (stary emblemat się rozpada, nowy składa, rozbłysk, nowa nazwa).
- Prowizja szara → zielona: efekt „przelewu” i licznik.
- Nowa oferta w Radarze: puls radaru.
- Odhaczony dom: fala na mapie, procent rejonu rośnie.
- Zdany egzamin: odblokowanie etapu.

## Technologia

Next.js + TypeScript + Tailwind, Supabase (baza, logowanie Google, przechowywanie plików), Vercel (hosting), Framer Motion (animacje), MapLibre (mapy).

## Plan wersji

- **1.0** (etapami): 0) specyfikacja i szkielet → 1) logowanie, role, Orbita, Skarbiec, KPI → 2) Akademia + Wieża → 3) Mennica → 4) Konfigurator, Radar, Misje → 5) Terytorium (rejony, mapa domów, GPS).
- **1.1**: Symulator — głosowy trener AI (OpenAI Realtime API), AI gra klienta i ocenia zgodność ze skryptem, limit minut.
- **2.0**: rankingi, konkursy, grafiki 3D awatarów.
- **3.0**: Arena — interaktywne szkolenia na żywo (trener prowadzi sesję, uczestnicy odpowiadają na iPadach, ranking na żywo, wyniki do Akademii i Orbity).
- **4.0**: integracja z bankiem i programem księgowym.

---

## Proces wydawania etapów

- Każdy etap na osobnej gałęzi → Pull Request (automatyczne testy uruchamiają się przy każdym PR).
- Kacper ogląda etap na linku podglądowym Vercel (preview) na iPadzie.
- Scalenie do `main` (produkcja) TYLKO po akceptacji Kacpra.
- Po każdym etapie: link do PR, link do podglądu (gdy Vercel będzie podłączony), lista rzeczy do przetestowania.

## Hosting i koszty

- Supabase: na czas budowy plan darmowy (tylko dane testowe). **Przed startem z prawdziwymi danymi: przejście na Pro + kopie zapasowe** (przypomnienie w `docs/PLAN.md`).
- Vercel: plan Pro (projekt firmowy).

## Założenia i decyzje

Status: ✅ rozstrzygnięte przez Kacpra · ❓ otwarte (w kodzie działa rekomendacja, wszystko jest ustawieniem w konfiguracji).

1. ✅ **KPI 0–29 pkt** — mnożnik 75% + alert do managera + żółta kartka zapisana w historii osoby. Zasady kartek — później.
2. ✅ **Solo / Duet** — zakres umów u jednego klienta (Solo = jedna umowa: samo termo albo samo źródło ciepła; Duet = termo + źródło ciepła). Stawka w całości dla handlowca przypisanego do klienta. Rozpoznawane po rodzajach umów w CRM.
3. ❓ **„Sam VAT”** — obniżka −75% tylko wtedy, gdy WSZYSTKIE umowy klienta są „sam VAT”; dotyczy stawki podstawowej, nie nadmarży. Otwarte: Duet, w którym tylko jedna umowa jest „sam VAT”.
4. ❓ **Limit nadmarży** — 10% sumy wartości netto wszystkich umów klienta; ujemna nadmarża nie obniża prowizji.
5. ❓ **Bonus audytora za zamknięcie** — naliczany, gdy klient osiągnie status „wysłanie wniosku do WFOŚ” (ten sam moment co zielona prowizja handlowca).
6. ✅/❓ **Klienci do awansu** — handlowcy: od poziomu 5 wliczają się klienci całego zespołu (próg edytowalny) ✅. Otwarte: czy rezygnacja po zaliczeniu odejmuje klienta z licznika.
7. ❓ **Stawka wg poziomu** — z którego momentu brać poziom do stawki.
8. ❓ **Brak danych KPI** — KPI bez danych jest pomijane, a wynik przeskalowany do 100 pkt.
9. ❓ **Czas podpisania oferty** — każdy czas ograniczony z góry do 7 dni (także oferty podpisane później).
10. ✅/❓ **Flota i dodatki** — koszt auta potrącany automatycznie w najbliższym rozliczeniu, osobna pozycja „Flota” ✅. Otwarte: wynagrodzenie za opiekę nad zespołem bez mnożnika KPI.
11. ❓ **Potrącenie większe niż wypłata** — wypłata 0 zł, reszta przechodzi na kolejny okres.
12. ❓ **Start okresów rozliczeniowych** — co 14 dni od poniedziałku 5.01.2026.
13. ❓ **Nazwy statusów i rodzajów umów w CRM** — w danych testowych przykładowe nazwy; mapowanie na prawdziwe nazwy z RRUP przy integracji.
