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
- **Skarbiec** — prowizje: szare = do dopięcia, zielone = zarobione; rozliczenia do akceptacji; **Trajektoria** (niżej).
- **Radar** — oferty od audytorów z licznikiem 3 dni.
- **Misje** — kalendarz, zadania, spotkania (tworzone przy wpisywaniu klienta, umawiane tylko w aplikacji), linki do klienta w CRM; synchronizacja z Kalendarzem Google; lead głosem; nagrywanie spotkania domykającego (sekcje niżej).
- **Terytorium** — mapa rejonu od managera, każdy dom jako punkt (dane adresowe/budynki z państwowych danych Geoportalu), statusy: otworzył / nie otworzył / nie zainteresowany / umówione / wrócić. GPS POTWIERDZA obecność przy domu (np. 30 m), nie wykrywa sam. Procent „wyczyszczenia” rejonu. Czas pracy = czas otwartej aplikacji, liczony w aktywnych blokach (sekcja „Raportowanie w terenie”). GPS tylko w godzinach pracy. Odhaczenie domu w 2 sekundy, tryb offline.
- **Akademia** — onboarding: osobne ścieżki audytora i handlowca (skrypt, bank obiekcji, filmy, quizy), egzaminy sprawdzane automatycznie, etapy odblokowują się po zdaniu (szczegóły niżej).
- **Konfigurator** — kalkulator ofertowy z repo `kacperkrol96/kalkulator-nle`. NIE kopiujemy logiki obliczeń — używamy jej z tamtego repo.
- **Wieża** — panel managera: zespół, rejony (rysowanie na mapie), postępy w Akademii, alerty z Radaru, zatwierdzanie opinii 5★, alerty „puste przejścia”, wyjątki od reguły „Nie ma w aplikacji = nie ma klienta”, odsłuch nagrań rozmów.
- **Konstelacja** — osobny panel managera (razem z Wieżą): struktura jako gwiazdozbiór i eskadry (niżej).
- **Mennica** — panel zarządu: rozliczenia do akceptacji i korekty, odliczanie do terminów, kolejka „Do wyjaśnienia”.

## Trajektoria (w Skarbcu)

To NIE jest prognoza zarobków.
- Audytor i handlowiec widzą na żywo drogę każdego swojego klienta przez statusy umów: przebyte statusy z datami, obecny podświetlony, kolejny krok, ile kroków do zielonej prowizji.
- Wejście: kliknięcie klienta albo szarej kwoty w Skarbcu + lista „Moje umowy”.
- Powiadomienie przy każdej zmianie statusu („Biuro przesunęło umowę … do …”).
- Odświeżanie przy otwarciu aplikacji + cyklicznie (domyślnie co 15 min, w ustawieniach); webhooki RRUP, jeśli są.
- Cel: ludzie z terenu widzą, że biuro pracuje, bez wchodzenia do CRM.

## Konstelacja (Etap 2, razem z Wieżą)

- Struktura managera jako gwiazdozbiór: manager w centrum, jego ludzie wokół (handlowcy, a pod nimi ich audytorzy), awatary poziomów, linie powiązań. Jasność gwiazdy = aktywność w tym tygodniu, kolor = alert.
- Na górze jedna liczba z animacją licznika: „Twój zarobek ze struktury w tym miesiącu” (dyferencja + opieka nad zespołem) — pierwsza rzecz, którą widzi manager.
- Kliknięcie w osobę: jej klienci, KPI, ile manager zarobił dzięki niej.
- **Eskadra** = zewnętrzna grupa sprzedażowa (np. grupa Łukasza Burligi, umowy z prefiksem ŁB), NIE handlowiec z audytorami. Eskadra ma własnego lidera i własny pakiet zasad rozliczeń, włączana/wyłączana jednym przełącznikiem w panelu admina; historia zostaje po wyłączeniu.
- Styl: minimalistyczny, ale ma nakręcać do zarabiania ze skali.

## Akademia

- **Ścieżki**: terenowa **D1–D4** (audytor i handlowiec) + osobna **ścieżka managera** (manager i zarząd widzą obie).
  - **D1 Fundament**: kontrakt (aktualna wersja ze zwoju), system wynagrodzeń, prezentacja Czyste Powietrze → **Egzamin D1**.
  - **D2 Skrypty i obiekcje**: R1, R2 (+ wersja słowna), banki obiekcji (D2D, przyjazd na audyt), sceny, scenariusze, filmy → **Egzamin D2 + scenka** (checklista managera, 14 ocen 1–5, decyzja „Gotowy do D3”).
  - **D3**: prospecting i wybór terenu + **Karta obserwacji D3** wypełniana przez managera w aplikacji.
  - **D4**: **Karta obserwacji D4** (manager) z decyzją „Gotowy na samodzielność — start Ignition” (opcje decyzji do potwierdzenia).
  - **Manager**: Podręcznik Managera (5 lekcji) → **Egzamin managerski**; **Launch Pad 90 dni** (szablon M1 Ignition / M2 Orbit / M3 Next Level, bez danych osobowych).
- **Treści**: `docs/tresci/NLE_Onboarding_Komplet.md` (poprawiony wg SPEC — lista zmian `docs/tresci/KOREKTY.md`) → oczyszczone lekcje `src/content/akademia/*.md` → `npm run content`. Gdzie onboarding kłóci się ze SPEC — wygrywa SPEC. Maksymalne dofinansowanie zawsze 170 100 zł; audytor przed pomiarem NIE podaje klientowi żadnej kwoty (kwoty w egzaminach oznaczone „wiedza wewnętrzna — nie mówimy klientowi”).
- **Egzaminy**: pytania zamknięte sprawdzane automatycznie na serwerze, otwarte ocenia manager (stan „czeka na ocenę”, punkty 0–max wg wzorca, komentarz). Próg punktowy = % z ustawień (D1 i D2 80%, managerski 70%) × maksimum. Po niezdanym — przerwa (ustawienie).
- **BEZPIECZEŃSTWO**: klucze odpowiedzi nigdy nie trafiają do kodu wysyłanego na urządzenie — moduł `src/lib/academy/exams.ts` jest `server-only`, do przeglądarki idzie tylko wersja publiczna; test `academy-security` sprawdza graf importów plików „use client”, `npm run check:bundle` (w CI po buildzie) szuka znacznika kluczy w paczce przeglądarki. Po egzaminie osoba widzi, które pytania zamknięte były błędne — bez poprawnej odpowiedzi.
- **Filmy (YouTube, niepubliczne)**: 02 → R1; 03 → bank D2D; 04–12 → R2 (6 tajemnic); 13 → bank przyjazd na audyt. Admin przypisuje linki (Mennica → Ustawienia). Własny odtwarzacz: bez kontrolek YouTube, bez „Obejrzyj na YouTube” i polecanych (nakładka + własny ekran końcowy), link niewidoczny, tylko po zalogowaniu, przewijanie do przodu tylko do obejrzanego miejsca. Lekcja zaliczona od **90%** obejrzanych sekund (ustawienie). Rejestr obejrzeń w panelu zespołu (docelowo w Wieży). Bez linku — atrapa (symulowany film).
- **Panel zespołu** (manager / zarząd): postęp osób, egzaminy do oceny, karty do wypełnienia, rejestr filmów — `/akademia/zespol`.
- **Odblokowywanie**: etap N+1 otwiera się po zaliczeniu etapu N (wszystkie lekcje + wszystkie bramki: egzamin / karta).

## Kontrakt — zwój przy pierwszym uruchomieniu

- Każdy audytor / handlowiec przed użyciem aplikacji czyta i akceptuje **swój kontrakt**. Przewinięcie do końca odblokowuje „Akceptuję”, potem **podpis palcem**.
- **Motyw** wybiera admin: **Pergamin** (woskowa pieczęć), **Cyberpunk** (neonowy hologram, skanowanie), **Retro-gra** (piksele, neon, dźwięk „level start”).
- **Rejestr akceptacji**: kto, kiedy, która wersja, podpis. Treść edytuje admin (Mennica → Ustawienia), każda publikacja = nowa wersja = **ponowna akceptacja**.
- Kontrakt handlowca w materiałach nie istniał — wersja robocza na podstawie SPEC do weryfikacji prawnika. Rozbieżności kontrakt ↔ SPEC dla prawnika: `docs/tresci/ROZBIEZNOSCI_KONTRAKT_SPEC.md`.

## Kartki

- **Żółta**: spóźnienie, brak raportu w CRM / aplikacji, brak GOPS, obietnica kwoty przed pomiarem, presja na kliencie, KPI < 30 pkt.
- **Czerwona**: 3 spóźnienia, 2 nieobecności albo 2 żółte kartki (w oknie dni z ustawień — domyślnie 90, do potwierdzenia).
- Manager nadaje kartki w Wieży z uzasadnieniem; automatycznie: „brak raportu” (brak „Zamknij dzień” do terminu) i „KPI < 30” — najwyżej raz na dzień / okres. Historia w profilu osoby (Orbita).

## Audytor: Safety albo Next Level

- **Safety** (miesięcznie wg pomiarów): 0–4 → 0 zł (umowa zlecenia: co najmniej stawka minimalna × godziny z aplikacji — do potwierdzenia z prawnikiem, stawka w ustawieniach); 5–9 → 3 750 zł + 200 zł za każdy pomiar ponad 5; 10–14 → 7 000 zł + 250 zł ponad 10; 15+ → 10 000 zł + 300 zł ponad 15. Bez bonusu za zamknięcie. Mnożnik KPI na całą wypłatę Safety (ustawienie, domyślnie włączone).
- **Pomiar** = umowa audytowa, która doszła do „DOKUMENTACJA POMIAROWA” lub dalej (założenie). Safety za miesiąc wypłacamy w okresie z pierwszym dniem następnego miesiąca (jak flota) — założenie.
- **Next Level**: tabela 10 poziomów. Awans działa od **następnej** umowy (umowa dająca awans płatna wg starej stawki) — tak samo u handlowców.
- Wybór na starcie; zmiana tylko Safety → Next Level (decyzja managera, z powodem); wyjątek: czasowy powrót na Safety (choroba / wypadek). Pomiary na Safety liczą się do poziomu.
- **Orbita**: aktywny system, pasek do progu („jeszcze 2 pomiary do 7 000 zł”), podgląd „ile zarobiłbyś na Next Level”. Udział w nadmarży mają tylko handlowcy.

## Rytm pracy

- **Audytor — cykl 2-dniowy**: pon/śr/pt umawianie 12 leadów (co godzinę 9–20), wt/czw/sob 6 spotkań. Cel cyklu 12/6/2/1, tydzień 36 umówionych / 18 odbytych. Kokpit pokazuje cel dnia.
- **Handlowiec**: bez stałego rytmu — Kokpit pokazuje oferty i spotkania domykające.
- **Odprawy** (Misje): pon/śr/pt 8:30 + w każdy poniedziałek 8:00 w biurze.
- **„Zamknij dzień” do 21:00** — brak = dzień niezaliczony + automatyczna żółta kartka.
- **Nagrania**: minimum 20% odbytych spotkań (audytor i handlowiec) — licznik w Orbicie, alert w Wieży.
- Wszystkie liczby w ustawieniach (`rhythm`).

## Teren i leady

- Ten sam rejon najwyżej raz na 30 dni (ostrzeżenie albo blokada — ustawienie). Checklista nowego rejonu: „Sołtys odwiedzony”.
- Formularz leadu: zgoda RODO podpisana palcem + potwierdzenie dla klienta (SMS / e-mail); bez podpisu lead niekompletny.
- Przy drzwiach najwyżej 3 pytania kwalifikacyjne; najwyżej 3 odbicia na obiekcję (treść + rubryka).

## Raportowanie w terenie (Terytorium + Misje)

Problem: ludzie nie odhaczają domów i nie wpisują leadów. Rozwiązanie w trzech warstwach.

### a) Szybciej wpisać niż pominąć

- **Odhaczenie domu w 2 sekundy**: aplikacja z GPS podświetla najbliższy dom, handlowiec stuka tylko status.
- **Lead głosem**: dyktowanie („Kowalski, czwartek 17:00, pompa ciepła”) → AI wypełnia formularz → zatwierdzenie jednym kliknięciem. Mowa i AI: ten sam dostawca co Symulator (OpenAI).
- **Spotkania umawiane tylko w aplikacji** → od razu w Misjach i w Kalendarzu Google.
- **Tryb offline** z synchronizacją po odzyskaniu zasięgu (domy, leady, spotkania, nagrania).

### b) Aplikacja sama wykrywa brak raportowania

- **Czas pracy liczy się tylko w aktywnych blokach**: blok 15 min jest aktywny, gdy odhaczono w nim min. 1 dom (długość bloku i minimum w ustawieniach).
- **Alert „puste przejścia” w Wieży**: GPS minął X domów, odhaczono Y (próg w ustawieniach).
- **„Zamknij dzień”**: obowiązkowe podsumowanie dnia (domy, otwarcia, leady) przed zakończeniem pracy.

### c) Konsekwencje

- **KPI „Raportowanie”** liczone automatycznie z aplikacji — zastępuje ręczne „Raportowanie CRM” u audytorów (waga i progi bez zmian do decyzji).
- **Reguła „Nie ma w aplikacji = nie ma klienta”**: prowizja i zaliczenie do awansu tylko dla klientów, których lead powstał w aplikacji PRZED umową. Gotowa w kodzie; włączana 2 tygodnie po starcie pilota — data w ustawieniach (`appLeadRule.enforceFrom`). Przed tą datą tylko ostrzeżenie „Ten klient nie ma leadu w aplikacji”. Reguła obejmuje umowy podpisane od daty włączenia (nie działa wstecz). Manager może zatwierdzić wyjątek z podaniem powodu (zapis w historii). Klient bez leadu przy włączonej regule → „Do wyjaśnienia” (blokuje prowizję i awans), dopóki manager nie zatwierdzi wyjątku.
- **Lead ↔ klient w CRM**: po wysłaniu leadu do CRM zapisujemy numer klienta z CRM; do tego czasu dopasowanie po telefonie i adresie; niepewne → „Do wyjaśnienia”.
- **Zapis do CRM**: leady i spotkania trafiają do kolejki „Do wysłania do CRM”. Wysyłka wymaga prawa zapisu w RRUP — podłączymy później; do tego czasu kolejka czeka, a dane są w aplikacji.

### Ograniczenia techniczne (do sprawdzenia w pilocie)

- PWA na iPhonie/iPadzie **nie śledzi GPS w tle** (ekran zablokowany albo inna aplikacja na wierzchu). „Puste przejścia” i aktywne bloki liczymy więc tylko wtedy, gdy aplikacja jest otwarta — zgodnie z zasadą „czas pracy = czas otwartej aplikacji”. Jeśli to za mało, rozwiązaniem jest aplikacja natywna (osobna decyzja).
- „Lead głosem” wymaga usługi rozpoznawania mowy i AI (dostawca do wyboru — najpewniej ten sam co dla Symulatora); bez zasięgu nagranie dyktowania czeka na synchronizację.

## Nagrywanie rozmów (audyt i spotkanie domykające)

### v1.0

- Przycisk **„Nagraj”** na ekranie audytu i spotkania → **„Wyślij”**. Nagranie automatycznie powiązane z klientem i spotkaniem.
- Przed nagraniem ekran z **formułą informacyjną dla klienta** (tekst w ustawieniach) + obowiązkowy checkbox **„Klient poinformowany o nagrywaniu”** — bez niego nagrywanie się nie uruchomi.
- Manager odsłuchuje nagrania w **Wieży** (lista per osoba, filtr audyt/spotkanie).
- Nagrania w Supabase Storage (po podłączeniu), **automatyczne usuwanie po X dniach** (domyślnie 30, w ustawieniach). Działa też bez zasięgu — wysyłka po synchronizacji.
- Ograniczenie PWA: podczas nagrywania aplikacja musi być otwarta (zablokowanie ekranu może przerwać nagranie na iOS) — aplikacja pilnuje, by ekran nie gasł, i ostrzega przed wyjściem.
- Do potwierdzenia z prawnikiem / IOD: treść formuły informacyjnej, podstawa prawna i okres przechowywania.

### v1.1 (razem z Symulatorem)

- Transkrypcja → ocena wg rubryki skryptu → informacja zwrotna dla handlowca/audytora + raport dla managera. Ta sama rubryka ocenia rozmowy z Symulatora i prawdziwe.
- Po transkrypcji audio usuwane; zostaje transkrypcja z ukrytymi danymi osobowymi.

## Zasady prowizji

- Rozliczamy ZA KLIENTA, nie za umowę (termo + kocioł u jednego klienta = jedna prowizja).
- **Solo / Duet** to zakres umów u JEDNEGO klienta (nie liczba handlowców):
  - **Solo** = tylko termo albo tylko źródło ciepła,
  - **Duet** = termo + co najmniej jedno źródło ciepła („prace po korek”); REK nie wpływa na Solo/Duet,
  - stawka należy się w całości handlowcowi przypisanemu do klienta — nic nie dzielimy,
  - zakres rozpoznajemy z końcówki numeru umowy (tabela przypisań, sekcja CRM); umowa w statusie negatywnym się nie liczy,
  - **wypłata w dwóch krokach**: gdy zielona jest tylko jedna z umów (termo albo źródło) — od razu stawka Solo; gdy zazieleni się umowa drugiej kategorii — **„Dopłata do Duetu”** (różnica Duet − Solo, także w nadmarży) jako osobna pozycja w Skarbcu i rozliczeniu (objęta mnożnikiem KPI). Utrata jednej z umów po wypłacie dopłaty → potrącenie dopłaty; utrata wszystkich → potrącenie całości.
- **Handlowiec**: prowizja zielona od statusu „W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW” lub dalej. Klient „sam VAT” = prowizja −75%. Nadmarża od kwoty netto, limit 10% wartości netto umów termo + źródło ciepła (bez REK), udział wg poziomu. Brak minimum do utrzymania poziomu. Od poziomu 5 wzwyż do progów awansu wliczają się klienci całego zespołu (jego + wszystkich podległych handlowców); próg „od którego poziomu” jest edytowalny w panelu admina.
- **„Sam VAT”** = klient na najwyższym progu dochodowym ORAZ bez umowy REK (reguła włączona, wyłączana w panelu). Po podpięciu Konfiguratora oznaczenie „sam VAT” z oferty ma pierwszeństwo (pole `samVatFromOffer` w modelu danych).
- **Próg dochodowy i nadmarża**: docelowo z Konfiguratora; do tego czasu ręczne pola przy kliencie (admin). Brak progu → „Do wyjaśnienia” tylko, gdy jest potrzebny (stawka audytora; reguła „sam VAT”, gdy oferta tego nie rozstrzyga). Brak nadmarży = 0 z adnotacją „nadmarża nieuzupełniona”.
- **Kto jest handlowcem przy kliencie** — źródła w kolejności: (1) aplikacja: handlowiec przyjął ofertę w Radarze albo założył lead (główne źródło prawdy); (2) przypisany pracownik klienta w CRM (gdy łącznik zacznie zwracać to pole); (3) historia/logi przypisań klienta w CRM (gdy łącznik naprawi zdarzenia klienta — błąd 422); (4) inicjały z numeru — WYŁĄCZNIE podpowiedź w kolejce „Do wyjaśnienia”, do potwierdzenia przez admina jednym kliknięciem. Gdy źródła 1–3 wskazują różne osoby → „Do wyjaśnienia”, nigdy zgadywanie. Decyzja admina rozstrzyga.
- **Audytor**: prowizja szara od „DOKUMENTACJA POMIAROWA”, zielona od „TWORZENIE OFERTY” (umowa audytowa /A). Stawka zależy od progu dochodowego klienta (podstawowy/podwyższony/najwyższy). Bonus za zamknięcie — gdy prowizja handlowca u tego klienta jest zielona. Poziom zdobyty raz zostaje na zawsze. Od poziomu 5 liczą się klienci struktury + aktywne osoby. Manager dostaje dyferencję.
- **Stawka wg poziomu z chwili, gdy prowizja zrobiła się zielona** (poziom, który osoba miała tuż przed tym klientem) — awans działa od następnej umowy.
- **Nadmarża uzupełniona po wypłacie** → różnica jako **„Dopłata nadmarży”** w najbliższym rozliczeniu (osobna pozycja, z mnożnikiem KPI). Potrącenie po spadku zwraca to, co faktycznie wypłacono.
- **„Potwierdź” w kolejce „Do wyjaśnienia”** — tylko Zarząd / Admin, z historią (kto, kiedy, poprzednia wartość).
- **Klienci do awansu**: rezygnacja / status negatywny po zaliczeniu odejmuje klienta z licznika, ale zdobyty poziom zostaje.
- Wypłata = prowizja × mnożnik KPI. Wynagrodzenie za opiekę nad zespołem — bez mnożnika KPI.
- **Spadek w status negatywny po zazieleniu** = potrącenie w rozliczeniu okresu, w którym nastąpił spadek (jeśli prowizja była zielona już w okresie wcześniejszym, czyli wypłacona). Potrącenie większe niż wypłata: wypłata 0 zł, reszta na kolejny okres; gdy osoba odchodzi — zarząd rozlicza resztę ręcznie w Mennicy.
- **Nic nie liczymy na zgadywanych danych**: nierozpoznana końcówka, status, inicjały albo brak handlowca/audytora → kolejka „Do wyjaśnienia” w Mennicy, prowizja wstrzymana.
- WSZYSTKIE stawki, progi, wagi, procenty, tabele przypisań i daty w bazie, edytowalne przez admina. Zero liczb na sztywno w kodzie.

## Okresy rozliczeniowe

| Okres | Rozliczenie / akceptacja | Wypłata |
|---|---|---|
| 1–15 dnia miesiąca | do 20. | 25. |
| 16–ostatni dzień miesiąca | do 5. następnego miesiąca | 10. następnego miesiąca |

Daty w ustawieniach admina; granice dni liczone w czasie polskim. Mennica pokazuje odliczanie do terminów. Koszt floty za miesiąc trafia do okresu 1–15 następnego miesiąca.

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
| **Raportowanie (z aplikacji)** — % aktywnych bloków w czasie pracy | 4 | 85% | 90% | 92,5% | 95% | 100% |
| Termin realizacji zadań w CRM | 2 | 48h | 36h | 24h | 12h | 0h |

### Handlowiec

| KPI | Waga | I | II | III | IV | V |
|---|---|---|---|---|---|---|
| Średni wynik KPI podległych audytorów | 5 | 30 | 46 | 59 | 70 | 90 pkt |
| Czas podpisania oferty | 5 | ≤6 | ≤5 | ≤4 | ≤3,5 | ≤3 dni |
| Komplet dokumentów (handlowiec + biuro) | 4 | 70% | 80% | 90% | 95% | 100% |
| Opinie 5★ | 2 | 70% | 75% | 80% | 90% | 95% |
| Raportowanie (z aplikacji) | 2 | 85% | 90% | 92,5% | 95% | 100% |
| Wynik spółki | 2 | 90% | 95% | 100% | 105% | 110% |

Wynik = suma(waga × poziom I–V), max 100 pkt; progi mnożnika bez zmian. **Walidacja wag w panelu admina** (obie role): liczby całkowite, suma = 20, żadna waga poniżej 2.

- **Opinie 5★** — % klientów z ofertą, którzy mają zaliczoną opinię 5★. Zaliczenie: handlowiec wgrywa screenshot opinii 5★ klienta z Google oraz zdjęcie z klientem. AI wstępnie odczytuje ze screena liczbę gwiazdek, nazwisko i datę; manager zatwierdza lub odrzuca w Wieży jednym kliknięciem. Wymagany checkbox „klient zgodził się na zdjęcie”. Screenshot i zdjęcie usuwane 90 dni po zaliczeniu.
- **Komplet dokumentów (handlowiec + biuro)** — odpowiedzialność wspólna. Zaliczone, gdy od podpisania umowy („UMOWA PODPISANA”) do wejścia w pierwszy pozytywny status po weryfikacji („REALIZACJA AUDYTU - GWD” lub dalszy) minęło ≤ 24h. „WERYFIKACJA DOKUMENTOWA NEGATYWNA” po drodze liczy się do czasu. Okno 24h edytowalne w panelu; pilot startuje z 24h.
- **Czas podpisania oferty** — średni czas od wejścia umowy audytowej /A w „PRZEKAZANA DO PH” do podpisania umowy sprzedażowej. Oferta niepodpisana po 7 dniach wchodzi do średniej jako 7 dni; każdy czas ograniczony do 7 dni.
- KPI bez danych (np. handlowiec bez audytorów) jest pomijane, a wynik przeskalowany do 100 pkt.
- **Wynik spółki** — % targetu miesiąca (target wpisuje admin).

Żółte kartki: na razie kartka jest tylko zapisywana w historii osoby (najwyżej jedna na okres rozliczeniowy). Mechanizm kartek dla handlowców zdefiniujemy później.

## Flota (w Orbicie)

Handlowiec z autem firmowym: liczymy klientów w miesiącu (status jak przy prowizji). 0–1 klient = 1500 zł, 2–3 = 750 zł, 4+ = 0 zł. Pasek 0/4 i aktualny koszt.

Koszt auta za miesiąc jest potrącany automatycznie w najbliższym rozliczeniu po zakończeniu miesiąca (w okresie, który obejmuje 1. dzień następnego miesiąca). W Skarbcu i Mennicy widać go jako osobną pozycję „Flota”. Forma księgowa (potrącenie czy refaktura) do potwierdzenia z księgowym — nie blokuje budowy.

## Radar — zasada 3 dni

Start = wejście umowy audytowej /A w „PRZEKAZANA DO PH” → przypisany handlowiec dostaje powiadomienie.
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

- API: `https://funduszremontowy.rrcrm.pl/api/v1`. Warstwa CRM to osobny moduł z DANYMI TESTOWYMI; prawdziwe połączenie po otrzymaniu klucza.
- RODO: nigdy nie pobieramy ani nie zapisujemy PESEL, numerów ksiąg wieczystych, numerów działek ani innych zbędnych danych.
- Przycisk „zgłoś błąd przypisania klienta”.

### Fakty (sprawdzone na umowach z CRM)

- Dostęp w Etapie 1: przez łącznik RRUP (MCP) w sesji developerskiej — tylko odczyt, tylko struktura danych, bez danych osobowych klientów. **Adres łącznika RRUP nigdy nie trafia do repozytorium, kodu, dokumentacji ani zrzutów.**
- Typy umów: PREFINANSOWANIE 2.0 (termo i źródła ciepła), OZE 2.0 (REK), AUDYT CP 2.0 (/A). Pole typu NIE rozróżnia termo/kocioł.
- Numer: `INICJAŁY/NR/MM/RR[RR]/ZAKRES` (np. `MW/12/09/26/TERMO`); zakres tylko w końcówce, pisownia niejednolita (TERMO/Termo/TERM, Kot, Rek), część numerów bez końcówki.
- Pole „user” umowy często wskazuje audytora, nie handlowca; bywa puste.
- Historia statusów: data wejścia = `createdAt`, status = `stateAfter`. Nazwy porównujemy bez względu na wielkość liter i wielokrotne spacje (np. „OCZEKIWANIE NA  GOPS/MOPS”).

### Tabele przypisań (edytowalne w panelu admina)

1. Końcówka numeru → zakres (bez względu na wielkość liter i skróty): TERMO/TERM → termomodernizacja; KOT → kocioł; PC → pompa ciepła; ZGAZ → kocioł zgazowujący na drewno; REK → rekuperacja (nie wpływa na Solo/Duet); A → audyt.
2. Status → kategoria: „w toku”, „prowizja handlowca zarobiona”, „prowizja audytora szara”, „prowizja audytora zarobiona”, „negatywny”.
3. Inicjały z numeru → osoba — **tylko podpowiedź** w kolejce „Do wyjaśnienia” (inicjały są zawodne: RS = Rafał Szwed, RSZ = Rafał Szczypkowski). Dopasowanie najdłuższego prefiksu (RSZ przed RS). Dane startowe: ŁŁ – Łukasz Łubkowski; WL, WŁ – Włodzimierz Lemański; ŁB – Łukasz Burliga (eskadra zewnętrzna); DK – Dawid Kubowicz; KS – Kacper Szymanek; RS – Rafał Szwed; RSZ – Rafał Szczypkowski; PK – Piotr Kaszyński; DH – Damian Harasiuk; ES – Ewelina Sroka; MN – Marcin Nowakowski; MP – nieznane.

Wszystko nierozpoznane (końcówka, status, inicjały, brak handlowca/audytora) → kolejka „Do wyjaśnienia” w Mennicy.

### Przypisania

- Handlowiec — kolejność źródeł: aplikacja (Radar / lead) → przypisany pracownik klienta w CRM → historia przypisań w CRM; inicjały tylko jako podpowiedź (szczegóły: „Zasady prowizji”).
- Audytor = „user” z umowy audytowej (/A) tego klienta.

### Ścieżki statusów

- **PREFINANSOWANIE 2.0**: ZAWIERANIE UMOWY → UMOWA PODPISANA → WELCOME CALL → W TRAKCIE FINANSOWANIA → WYLICZENIE PROWIZJI → WERYFIKACJA UMOWY → WERYFIKACJA DOKUMENTOWA NEGATYWNA → REALIZACJA AUDYTU - GWD → PRZYGOTOWANIE DOKUMENTÓW WFOŚ → WERYFIKACJA DOKUMENTÓW WFOŚ → NEGATYWNA WERYFIKACJA DOKUMENTOWA - WFOŚ → W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW → OCZEKIWANIE NA DECYZJĘ → … (dalsze statusy dopiszemy z API).
- **AUDYT CP 2.0**: ZAWIERANIE UMOWY → UMOWA PODPISANA → WERYFIKACJA FORMALNA → WELCOME CALL → WYLICZENIE PROWIZJI → OCZEKIWANIE NA GOPS/MOPS → WERYFIKACJA UMOWY → NEGATYWNA WERYFIKACJA DOKUMENTACYJNA → W TRAKCIE POMIARÓW → DOKUMENTACJA POMIAROWA → WERYFIKACJA POMIAROWA → NEGATYWNA WERYFIKACJA POMIAROWA → TWORZENIE OFERTY → PRZEKAZANA DO PH → SUKCES → WIN-BACK → …
- **OZE 2.0 (REK)** — z obserwacji API: ZAWIERANIE UMOWY → UMOWA PODPISANA → W TRAKCIE FINANSOWANIA → WELCOME CALL → WERYFIKACJA UMOWY → ZAMAWANIE TOWARU (pisownia jak w CRM) → …

Zasady:
- „Status X lub dalej” = pozycja na ścieżce ≥ X; statusy negatywne (każdy z „NEGATYWNA”, WIN-BACK, SPAD) zawsze = „negatywny”.
- Statusy mogą być pomijane (np. SUKCES zaraz po W TRAKCIE POMIARÓW) — liczy się pozycja na ścieżce.
- „WYLICZENIE PROWIZJI” jest ignorowany (zostanie usunięty z CRM) — liczy się poprzedni status. Zniknięcie albo pojawienie się nieznanego statusu nie psuje aplikacji → „Do wyjaśnienia”.

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
- **1.1**: Symulator — głosowy trener AI (OpenAI Realtime API), AI gra klienta i ocenia zgodność ze skryptem, limit minut. Transkrypcja i ocena nagranych rozmów wg tej samej rubryki.
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

Wszystkie założenia z Etapu 0 są rozstrzygnięte:

1. ✅ KPI 0–29 pkt — mnożnik 75% + alert do managera + żółta kartka (zapis w historii osoby).
2. ✅ Solo / Duet — zakres umów u jednego klienta, z końcówki numeru.
3. ✅ „Sam VAT” — reguła: najwyższy próg dochodowy + brak REK; oznaczenie z oferty ma pierwszeństwo.
4. ✅ Limit nadmarży — 10% wartości netto umów termo + źródło ciepła (bez REK); ujemna nadmarża nie obniża prowizji.
5. ✅ Bonus audytora za zamknięcie — gdy prowizja handlowca u klienta jest zielona.
6. ✅ Klienci do awansu — handlowcy od poz. 5 z zespołem (edytowalne); rezygnacja odejmuje klienta, poziom zostaje.
7. ✅ Stawka wg poziomu z chwili zazielenienia prowizji.
8. ✅ Brak danych KPI — pomijane, wynik przeskalowany.
9. ✅ Czas podpisania oferty — każdy czas ograniczony do 7 dni.
10. ✅ Flota — potrącana w najbliższym rozliczeniu jako „Flota”; opieka nad zespołem bez mnożnika KPI.
11. ✅ Potrącenie większe niż wypłata — reszta na kolejny okres; odejście osoby — ręcznie w Mennicy.
12. ✅ Okresy — 1–15 i 16–koniec miesiąca (tabela wyżej).
13. ✅ Statusy i zakresy — z prawdziwego CRM (sekcja CRM), tabele edytowalne.

### Rozstrzygnięte po Etapie 1

- ✅ Stawka wg poziomu sprzed klienta; potrącenie w okresie spadku w status negatywny.
- ✅ Duet: Solo od razu + „Dopłata do Duetu” jako osobna pozycja.
- ✅ Handlowiec: źródła w kolejności aplikacja → CRM → historia; inicjały tylko podpowiedzią.
- ✅ „DZIAŁ PRAWNY” = status negatywny.
- ✅ Próg dochodowy i nadmarża: ręczne pola przy kliencie do czasu Konfiguratora.
- ✅ KPI „Raportowanie” = % aktywnych bloków (audytor i handlowiec), nowe wagi handlowca, walidacja wag.
- ✅ Lead ↔ klient w CRM: numer klienta po wysłaniu, wcześniej telefon + adres, niepewne → „Do wyjaśnienia”.
- ✅ Mowa i AI: OpenAI (jak Symulator).
- ✅ Reguła „Nie ma w aplikacji = nie ma klienta”: włączana datą w ustawieniach (2 tygodnie po starcie pilota), wcześniej ostrzeżenia.
- ✅ Ograniczenia iOS (GPS i nagrywanie przy zablokowanym ekranie) — sprawdzimy w pilocie.

### Do potwierdzenia przy integracji CRM

- Statusy po „OCZEKIWANIE NA DECYZJĘ” (PREFINANSOWANIE) i dalsza ścieżka OZE 2.0 — Kacper prześle zrzuty z konfiguracji CRM.
- Konta w aplikacji dla osób z tabeli inicjałów (podpięcie `employeeId`, żeby przycisk „Potwierdź” działał dla prawdziwych osób).
