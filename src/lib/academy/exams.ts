import "server-only";
import type { ExamDef } from "./types";

/**
 * EGZAMINY Z KLUCZAMI ODPOWIEDZI — TYLKO SERWER.
 * Ten moduł nigdy nie może trafić do kodu wysyłanego na urządzenie: `server-only` przerywa build,
 * test `academy-security` pilnuje importów, a `npm run check:bundle` szuka znacznika poniżej w paczce przeglądarki.
 * Źródło: docs/tresci/NLE_Onboarding_Komplet.md (egzaminy D1, D2, managerski + klucze).
 */
export const EXAM_KEYS_CANARY = "NLE-EXAM-KEYS-7f3a9c";

export const exams: ExamDef[] = [
  {
    "id": "d1",
    "title": "Egzamin D1 — handlowiec: Podstawy Czyste Powietrze i firma NLE",
    "instructions": "Część I: 8 pytań testowych, zaznacz jedną poprawną odpowiedź (1 pkt każde). Część II: 7 pytań otwartych, odpowiedz pełnym zdaniem. Czas: 20 minut. Próg: 12/15 (80%).",
    "timeLimitMinutes": 20,
    "questions": [
      {
        "id": "d1-q1",
        "type": "choice",
        "text": "Jaki jest maksymalny poziom dofinansowania z programu Czyste Powietrze (procent kosztów)? (wiedza wewnętrzna — nie mówimy klientowi)",
        "points": 1,
        "options": [
          "50%",
          "70%",
          "100%",
          "140%"
        ],
        "items": null,
        "correctIndex": 2,
        "modelAnswer": null
      },
      {
        "id": "d1-q2",
        "type": "choice",
        "text": "Przy jakim dochodzie na osobę miesięcznie kwalifikujemy się do poziomu 100% (najwyższego)? (wiedza wewnętrzna — nie mówimy klientowi)",
        "points": 1,
        "options": [
          "Do 1 300 zł na osobę",
          "Do 2 250 zł na osobę",
          "Do 3 500 zł na osobę",
          "Brak limitu dochodów"
        ],
        "items": null,
        "correctIndex": 0,
        "modelAnswer": null
      },
      {
        "id": "d1-q3",
        "type": "choice",
        "text": "Czym jest Fundusz Remontowy w kontekście pracy audytora NLE?",
        "points": 1,
        "options": [
          "Rządowy program dotacyjny",
          "Brand NLE działający pod programem CP — jak Jeronimo Martins pod Biedronką",
          "Bank finansujący remonty",
          "Instytucja rządowa GOPS/MOPS"
        ],
        "items": null,
        "correctIndex": 1,
        "modelAnswer": null
      },
      {
        "id": "d1-q4",
        "type": "choice",
        "text": "Jaka jest maksymalna kwota dofinansowania z programu Czyste Powietrze (kompleksowy zakres)? (wiedza wewnętrzna — nie mówimy klientowi)",
        "points": 1,
        "options": [
          "99 000 zł",
          "135 000 zł",
          "170 100 zł",
          "200 000 zł"
        ],
        "items": null,
        "correctIndex": 2,
        "modelAnswer": null
      },
      {
        "id": "d1-q5",
        "type": "choice",
        "text": "Czy do obliczenia składu gospodarstwa domowego w CP liczy się meldunek?",
        "points": 1,
        "options": [
          "Tak, tylko zameldowani są brani pod uwagę",
          "Nie — liczymy osoby faktycznie zamieszkałe niezależnie od meldunku",
          "Tak, ale tylko głowa rodziny",
          "Zależy od decyzji urzędu gminy"
        ],
        "items": null,
        "correctIndex": 1,
        "modelAnswer": null
      },
      {
        "id": "d1-q6",
        "type": "choice",
        "text": "Ile wynosi ubezpieczenie OC Funduszu Remontowego?",
        "points": 1,
        "options": [
          "500 000 zł",
          "1 000 000 zł",
          "2 000 000 zł",
          "5 000 000 zł"
        ],
        "items": null,
        "correctIndex": 2,
        "modelAnswer": null
      },
      {
        "id": "d1-q7",
        "type": "choice",
        "text": "Ile lat Fundusz Remontowy działa na rynku?",
        "points": 1,
        "options": [
          "5 lat",
          "10 lat",
          "15 lat",
          "20 lat"
        ],
        "items": null,
        "correctIndex": 3,
        "modelAnswer": null
      },
      {
        "id": "d1-q8",
        "type": "choice",
        "text": "Co oznacza system 12/6/2/1 w codziennej pracy audytora NLE?",
        "points": 1,
        "options": [
          "12 godzin pracy, 6 przerw, 2 posiłki, 1 raport",
          "12 leadów, 6 spotkań, 2 umowy, 1 pomiar — na jeden cykl dwóch dni",
          "12 klientów, 6 audytów, 2 wnioski, 1 kontrakt miesięcznie",
          "12 ulic dziennie, 6 rejonów, 2 gminy, 1 manager"
        ],
        "items": null,
        "correctIndex": 1,
        "modelAnswer": null
      },
      {
        "id": "d1-q9",
        "type": "text",
        "text": "Wymień 3 kryteria kwalifikacji technicznej budynku do programu Czyste Powietrze.",
        "points": 1,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "Właściciel/współwłaściciel budynku jednorodzinnego; stare, nieefektywne źródło ciepła (kopciuch) do wymiany; brak lub niewystarczające docieplenie. Dodatkowo: spełnienie progu dochodowego."
      },
      {
        "id": "d1-q10",
        "type": "text",
        "text": "Co to jest lista ZUM i dlaczego jest ważna dla klienta i audytora NLE?",
        "points": 1,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "ZUM = lista Zielonych Urządzeń i Materiałów. Tylko sprzęt z listy kwalifikuje się do dofinansowania. Zakup spoza ZUM = najczęstszy powód odmowy wypłaty. Dlatego pracujemy wyłącznie na certyfikowanym sprzęcie z ZUM."
      },
      {
        "id": "d1-q11",
        "type": "text",
        "text": "Jak działa audyt energetyczny w programie CP — kiedy jest potrzebny?",
        "points": 1,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "Audyt energetyczny jest obowiązkowy PRZED złożeniem wniosku — bez niego nie ma dotacji. Określa zakres prac i potencjał oszczędności. To pierwszy krok procesu, który wykonuje audytor NLE."
      },
      {
        "id": "d1-q12",
        "type": "text",
        "text": "Wymień 3 rodzaje prac, które można sfinansować z programu Czyste Powietrze.",
        "points": 1,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "Ocieplenie ścian/dachu/podłogi, wymiana okien i drzwi, wymiana źródła ciepła (pompa ciepła, kocioł na biomasę/pellet), rekuperacja/wentylacja. (Od 2025 bez kotłów gazowych i PV.)"
      },
      {
        "id": "d1-q13",
        "type": "text",
        "text": "Co się dzieje, jeśli ktoś z domowników pracuje za granicą — czy jego dochód wlicza się do podstawy?",
        "points": 1,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "Liczymy osoby faktycznie zamieszkałe i ich dochody. Osoba pracująca na stałe za granicą bez polskiego dochodu zwykle nie podnosi podstawy — to trzeba zweryfikować na audycie. Więcej domowników o niskim dochodzie = niższy dochód na osobę = wyższy próg."
      },
      {
        "id": "d1-q14",
        "type": "text",
        "text": "Jaki jest cel wizyty u sołtysa przed rozpoczęciem pracy w nowym rejonie D2D?",
        "points": 1,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "Sołtys zna mieszkańców i otwiera całą wieś zaufaniem. Przedstawiamy się raz, wchodząc w nowy rejon — gdy mieszkańcy wiedzą, że byliśmy u sołtysa, drzwi otwierają się łatwiej. To czynność raz na rejon, nie przed każdym domem."
      },
      {
        "id": "d1-q15",
        "type": "text",
        "text": "Co robisz, jeśli osoba przy drzwiach nie jest właścicielem domu?",
        "points": 1,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "Audyt musi być z właścicielem. Proszę o numer i dzwonię przy kliencie, żeby od razu ustalić godzinę z właścicielem. Jeśli się uda — umawiam (pozorny wybór, RODO, karteczka)."
      }
    ]
  },
  {
    "id": "d2",
    "title": "Egzamin D2 — skrypty: znajomość skryptów pukania (R1) i audytu (R2)",
    "instructions": "Egzamin sprawdza znajomość skryptów R1 i R2 na pamięć. Nie korzystasz z materiału. Odpowiadasz jak na spotkaniu z klientem — precyzyjnie i po kolei.",
    "timeLimitMinutes": 25,
    "questions": [
      {
        "id": "d2-q1",
        "type": "text",
        "text": "Po przedstawieniu się jako Fundusz Remontowy — NATYCHMIAST zadajesz pierwsze pytanie. Dlaczego nie możesz robić pauzy?",
        "points": 1,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "Bo pauza = moment dla klienta na „nie, dziękuję” (odmowę). Pytanie zaraz po przedstawieniu odbiera klientowi ten moment — klient myśli nad odpowiedzią zamiast odmawiać."
      },
      {
        "id": "d2-q2",
        "type": "text",
        "text": "Pierwsze pytanie kwalifikacyjne przy drzwiach brzmi:",
        "points": 1,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "„Ma Pan jeszcze stary piec (kopciuch), czy już wymieniony?”"
      },
      {
        "id": "d2-q4",
        "type": "text",
        "text": "Pozorny wybór przy domknięciu spotkania przy drzwiach brzmi:",
        "points": 1,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "„Właściciele będą bardziej o 13 czy o 17?” (wariant: „Bardziej będzie Panu pasować trzynasta czy siedemnasta?”) — nigdy „czy chce Pan/Pani?”."
      },
      {
        "id": "d2-q5",
        "type": "text",
        "text": "Po wyborze godziny przez klienta pytasz o imię, następnie o numer telefonu, adres. Czwarty krok to:",
        "points": 1,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "Podpis RODO (zgoda na audyt) i wręczenie karteczki z godziną i nazwiskiem audytora."
      },
      {
        "id": "d2-q6",
        "type": "text",
        "text": "Kluczowe zdanie, które mówisz po narysowaniu ptaszków na kartce przy kliencie, brzmi:",
        "points": 1,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "„To rozumiem, że sprawdzamy?” — potem cisza i czekanie na „tak”."
      },
      {
        "id": "d2-q7",
        "type": "text",
        "text": "W Tajemnicy Ekonomicznej po wyliczeniu progu dochodowego mówisz klientowi, że dochody się kwalifikują, a następnie wprowadzasz element niepewności słowami:",
        "points": 1,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "„Ale — i tu jest haczyk. To jest dopiero jeden element układanki.” (dalej: muszą być spełnione kryteria techniczne — zapotrzebowanie energetyczne, stan ocieplenia, wiek pieca — sprawdzi to pomiarowiec)."
      },
      {
        "id": "d2-q8",
        "type": "text",
        "text": "Zdanie zamykające audyt — pozorny wybór na datę pomiaru — brzmi dokładnie:",
        "points": 1,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "„Środa dziewiąta czy piętnasta?” (pełniej: „Świetnie. Na kiedy pomiar — mamy wolne terminy w przyszłym tygodniu, środa dziewiąta czy piętnasta?”)."
      },
      {
        "id": "d2-q9",
        "type": "text",
        "text": "Skrypt R1 — pukanie D2D: ułóż 6 kroków we właściwej kolejności (krok „nie jest właścicielem” pomijamy — jest tylko wtedy, gdy potrzebny).",
        "points": 3,
        "options": null,
        "items": [
          "Kwalifikacja — trzy proste pytania",
          "Postawa i pierwsze wrażenie (pierwsze 3 sekundy)",
          "Domknięcie — pozorny wybór, dane, zgoda RODO w aplikacji, potwierdzenie SMS/e-mail",
          "Icebreaker — zanim powiesz, kim jesteś",
          "Kwalifikacja pozytywna + hak",
          "Kim jestem i dlaczego tu jestem"
        ],
        "correctIndex": null,
        "modelAnswer": "B, D, F, A, E, C — Postawa → Icebreaker → Kim jestem → 3 pytania kwalifikacyjne → Kwalifikacja pozytywna + hak → Domknięcie (pozorny wybór, dane, RODO, potwierdzenie).",
        "correctOrder": [
          1,
          3,
          5,
          0,
          4,
          2
        ]
      },
      {
        "id": "d2-q10",
        "type": "text",
        "text": "Skrypt R2 — audyt w domu klienta: ponumeruj 6 tajemnic we właściwej kolejności.",
        "points": 3,
        "options": null,
        "items": [
          "Bolesna — koszty ogrzewania, obowiązek wymiany, dyrektywy UE",
          "Ekonomiczna — mini panel dochodowy, liczenie na kartce, hak",
          "Chwalebna — realny przykład klienta, konkretne liczby, prestiż",
          "Radosna — icebreaker, przejęcie salonu, alfa domu",
          "Światła — program CP, partnerzy z listy ZUM, realizacje z katalogu",
          "Pewności — ptaszki na kartce, zamknięcie, podpisanie umowy"
        ],
        "correctIndex": null,
        "modelAnswer": "1. Radosna; 2. Bolesna; 3. Światła; 4. Chwalebna; 5. Ekonomiczna; 6. Pewności.",
        "correctOrder": [
          2,
          5,
          4,
          1,
          3,
          6
        ]
      },
      {
        "id": "d2-q11",
        "type": "text",
        "text": "Odbitka — klient przy drzwiach mówi: „Nie mam czasu.”",
        "points": 0.75,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "Przyjmij → obróć → wróć: „Rozumiem — i właśnie dlatego nie proszę o czas teraz. Przyjdę jutro, jak Panu wygodnie — to Pan decyduje o godzinie. Bardziej trzynasta czy siedemnasta?”"
      },
      {
        "id": "d2-q12",
        "type": "text",
        "text": "Odbitka — klient przy drzwiach mówi: „Już ktoś tu chodził.”",
        "points": 0.75,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "„Wierzę — różne firmy chodzą. Ja działam bezpośrednio z ramienia Funduszu Remontowego w tej gminie. Czy ktoś zrobił Panu pełny audyt na miejscu (wszedł, zmierzył, policzył), czy tylko zostawił ulotkę? Bo jak nie — to nie był audyt, tylko ulotka. Warto sprawdzić naprawdę — trzynasta czy siedemnasta?” Nie krytykuje konkurencji wprost."
      },
      {
        "id": "d2-q13",
        "type": "text",
        "text": "Odbitka — klient przy drzwiach mówi: „Nie mam pieniędzy.”",
        "points": 0.75,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "„Rozumiem — i właśnie po to jest ten program. Powstał dla osób, które same nie udźwignęłyby takiego remontu. Ile dokładnie — wyjdzie po sprawdzeniu. Trzynasta czy siedemnasta?” BŁĄD: obiecywanie („im mniej Pan ma, tym więcej dostanie”)."
      },
      {
        "id": "d2-q14",
        "type": "text",
        "text": "Odbitka — klient przy drzwiach mówi: „Już mieliśmy audyt i się nie łapiemy.”",
        "points": 0.75,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "„Rozumiem — mogę zapytać, kiedy to było? Program zmienił kryteria w 2025 — część osób, które wcześniej nie przeszły, teraz by się załapała. Warto sprawdzić jeszcze raz, bezpłatnie. Trzynasta czy siedemnasta?”"
      },
      {
        "id": "d2-q15",
        "type": "text",
        "text": "Odbitka — klient podczas audytu mówi: „Muszę się zastanowić.”",
        "points": 0.75,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "„Rozumiem — to poważna sprawa i ma Pan prawo to przemyśleć. Tylko nad czym się zastanawiać przed audytem? Audyt jest bezpłatny i właśnie po to jest, żeby Pan WIEDZIAŁ, czy jest sens. Zróbmy go, a POTEM będzie Pan miał konkret do przemyślenia.” Zasada: zastanowi się PO audycie, nie zamiast niego."
      },
      {
        "id": "d2-q16",
        "type": "text",
        "text": "Odbitka — klient podczas audytu mówi: „Nie chcę brać kredytu.”",
        "points": 0.75,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "„Rozumiem — dobrze, że Pan to mówi, to częste nieporozumienie. To nie jest kredyt — to dotacja, pieniądze nie do zwrotu. Przy wyższych progach jest prefinansowanie — środki wpływają ZANIM zaczną się prace. Zero kredytu, zero długu. Audyt pokaże, na jaki próg się Pan łapie — policzymy to razem.”"
      },
      {
        "id": "d2-q17",
        "type": "text",
        "text": "Odbitka — klient podczas audytu mówi: „Muszę porozmawiać z dziećmi.”",
        "points": 0.75,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "„Oczywiście — dobrze, że tak Państwo podchodzą, to ważna decyzja. Właśnie dlatego dziś nie proszę o żadną decyzję — robię tylko bezpłatny audyt, zbiorę dane, a Państwo pokażą wynik dzieciom i razem zdecydują.” Audyt to nie decyzja, to dane do decyzji."
      },
      {
        "id": "d2-q18",
        "type": "text",
        "text": "Odbitka — klient podczas audytu mówi: „Brak zaufania — to jakieś oszustwo.”",
        "points": 0.75,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "„Rozumiem — dobrze, że Pan pyta, na rynku chodzi dużo firm obiecujących złote góry. Właśnie dlatego działamy z OC na 2 miliony, nie bierzemy zaliczek, a program Czyste Powietrze można sprawdzić na czystepowietrze.gov.pl. Dziś nie biorę od Pana złotówki — robię tylko bezpłatny audyt, pokażę dokumenty, Pan oceni sam.”"
      },
      {
        "id": "d2-q19",
        "type": "text",
        "text": "(Dla managera, niepunktowane) Dlaczego nie możemy robić pauzy po przedstawieniu Funduszu Remontowego?",
        "points": 0,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "Pauza = moment na „nie, dziękuję”. Natychmiastowe proste pytanie (o piec) sprawia, że klient myśli nad odpowiedzią zamiast odmawiać."
      },
      {
        "id": "d2-q20",
        "type": "text",
        "text": "(Dla managera, niepunktowane) Dlaczego klient siada po Twojej lewicy, a nie naprzeciwko?",
        "points": 0,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "Naprzeciwko = przesłuchanie, obok = współpraca — razem patrzycie na papiery. Przy dwojgu właścicielach po lewej sadzamy alfę domu (osobę decyzyjną)."
      },
      {
        "id": "d2-q21",
        "type": "text",
        "text": "(Dla managera, niepunktowane) Dlaczego w Tajemnicy Ekonomicznej celowo wprowadzamy element niepewności po wyliczeniu progu dochodowego?",
        "points": 0,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "Bo dochód to dopiero jeden element — o przyznaniu i kwocie decydują też kryteria techniczne, których nie da się ocenić gołym okiem; potrzebny jest pomiar. Nie obiecujemy kwoty przed pomiarem, a niepewność uzasadnia umówienie pomiaru („bez pomiaru nie ma wniosku”)."
      },
      {
        "id": "d2-q22",
        "type": "text",
        "text": "(Dla managera, niepunktowane) Co to jest pozorny wybór i dlaczego działa lepiej niż pytanie „czy chce Pan/Pani”?",
        "points": 0,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "Pozorny wybór to pytanie o wybór między dwiema opcjami (np. „13 czy 17?”) zamiast pytania tak/nie. Klient wybiera godzinę zamiast decydować, czy w ogóle się spotkać; pytanie „czy chce Pan” otwiera drogę do odmowy. Po pytaniu — cisza."
      },
      {
        "id": "d2-q23",
        "type": "text",
        "text": "(Dla managera, niepunktowane) Dlaczego pierwsza wizyta w nowym rejonie zawsze zaczyna się od sołtysa?",
        "points": 0,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "Sołtys zna ludzi i otwiera całą wieś zaufaniem — gdy mieszkańcy wiedzą, że byłeś u sołtysa, drzwi otwierają się łatwiej. Robimy to raz na rejon (gdy sołtys jest osiągalny), nie przed każdym domem."
      }
    ]
  },
  {
    "id": "manager",
    "title": "Egzamin managerski — case study: prowadzenie zespołu",
    "instructions": "Ten egzamin nie sprawdza, czy umiesz wyrecytować definicję — sprawdza, czy umiesz PROWADZIĆ ludzi. Większość to sytuacje z terenu NLE: opisz własnymi słowami, co konkretnie robisz i dlaczego. Część I zaznacz krzyżykiem. Część II rozpisz na liniach.",
    "timeLimitMinutes": null,
    "questions": [
      {
        "id": "manager-q1",
        "type": "choice",
        "text": "Nowy audytor, pierwszy tydzień, pełen zapału, ale nic jeszcze nie umie. Jak go prowadzisz?",
        "points": 2,
        "options": [
          "Dajesz mu pełną swobodę i autonomię",
          "Mówisz dokładnie co i jak, krok po kroku",
          "Głównie słuchasz i czekasz, aż sam dojdzie",
          "Zostawiasz, niech uczy się sam na błędach"
        ],
        "items": null,
        "correctIndex": 1,
        "modelAnswer": null
      },
      {
        "id": "manager-q2",
        "type": "choice",
        "text": "Na odprawie nikt nigdy nie oponuje, wszyscy zawsze przytakują. Co to najczęściej znaczy?",
        "points": 2,
        "options": [
          "Zespół jest zdrowy i zgrany",
          "Ludzie nie ufają na tyle, by powiedzieć, co myślą",
          "Wszyscy naprawdę się zgadzają",
          "Prowadzisz odprawy wzorowo"
        ],
        "items": null,
        "correctIndex": 1,
        "modelAnswer": null
      },
      {
        "id": "manager-q3",
        "type": "choice",
        "text": "Audytor coś przeżył w terenie. Żeby naprawdę się z tego nauczył na trwałe, po doświadczeniu trzeba:",
        "points": 2,
        "options": [
          "Tylko powtórzyć tę samą czynność jeszcze raz",
          "Zatrzymać się, wyciągnąć wniosek i spróbować inaczej",
          "Dać nagrodę finansową",
          "Od razu przejść do następnego zadania"
        ],
        "items": null,
        "correctIndex": 1,
        "modelAnswer": null
      },
      {
        "id": "manager-q4",
        "type": "choice",
        "text": "Audytor przychodzi z problemem. Chcesz, żeby sam znalazł rozwiązanie, a nie dostał gotowca. Najlepiej:",
        "points": 2,
        "options": [
          "Rozliczyć go z liczb i odesłać do pracy",
          "Prowadzić pytaniami: cel, jak jest teraz, opcje, co zrobi",
          "Powiedzieć mu wprost, co ma zrobić",
          "Zignorować, niech radzi sobie sam"
        ],
        "items": null,
        "correctIndex": 1,
        "modelAnswer": null
      },
      {
        "id": "manager-q5",
        "type": "choice",
        "text": "Nowe zachowanie staje się trwałym nawykiem (robionym bez myślenia) średnio dopiero po około:",
        "points": 2,
        "options": [
          "3 dniach",
          "tygodniu",
          "dwóch miesiącach nieprzerwanego powtarzania",
          "jednym dniu"
        ],
        "items": null,
        "correctIndex": 2,
        "modelAnswer": null
      },
      {
        "id": "manager-q6",
        "type": "text",
        "text": "CASE 1 — Audytor traci wiarę w Orbicie. Monika była gwiazdą w pierwszym miesiącu — 10 pomiarów. W drugim spadła do 4, mówi „chyba się do tego nie nadaję”, choć technikę ma opanowaną. Jest załamana. Na jakim etapie rozwoju jest teraz Monika i jak ją poprowadzisz? Co konkretnie powiesz na rozmowie 1:1?",
        "points": 10,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "D3 (umie, ale traci wiarę) — styl WSPIERAJĄCY (S3). Nie instruować technicznie (umie), tylko odbudować pewność: przypomnieć sukcesy, znormalizować dołek, dać wsparcie emocjonalne. Coaching pytaniami. BŁĄD: dosypanie instrukcji technicznych albo presji liczbowej."
      },
      {
        "id": "manager-q7",
        "type": "text",
        "text": "CASE 2 — Cisza na odprawie. Od dwóch tygodni Twoje odprawy są „grzeczne” — przedstawiasz cele, wszyscy kiwają głowami, nikt nie zgłasza uwag, nie ma sporu. Wyniki zespołu powoli spadają. Co ta cisza naprawdę oznacza i co konkretnie zrobisz na najbliższej odprawie, żeby to przełamać?",
        "points": 10,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "Cisza = brak zaufania i strach przed konfliktem. Manager buduje zaufanie własną wrażliwością (przyznaje swój błąd pierwszy), prowokuje zdrowy spór: pyta wprost „kto się z tym NIE zgadza?”, wyciąga ciche osoby. BŁĄD: branie ciszy za zgodę/sukces."
      },
      {
        "id": "manager-q8",
        "type": "text",
        "text": "CASE 3 — Nowy nie raportuje w CRM. Jakub jest 5 dni w Ignition. Dwa razy nie wypełnił CRM na czas, tłumaczy, że „nie ogarnia systemu”. Jest sympatyczny i chce dobrze. Jakim stylem go poprowadzisz i jakie konkretne kroki podejmiesz? Gdzie jest granica między wsparciem a egzekwowaniem zasady?",
        "points": 10,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "D1 (nowy) — styl DYREKTYWNY: pokazać CRM krok po kroku, nie zakładać, że umie. ALE zasada CRM jest twarda (warunek konieczny) — wsparcie w nauce TAK, taryfa ulgowa dla zasady NIE. Po instruktażu: żółta kartka, jeśli się powtarza. Równowaga: ucz + egzekwuj."
      },
      {
        "id": "manager-q9",
        "type": "text",
        "text": "CASE 4 — Senior, którego dusisz kontrolą. Natalia jest na Next Level, dowozi 12+ pomiarów, jest samodzielna. Zauważasz, że odkąd codziennie pytasz ją o szczegóły i sprawdzasz każdy krok, stała się zniechęcona i mniej aktywna. Co robisz źle i jak powinieneś prowadzić Natalię? Jakiego prowadzenia ona teraz potrzebuje?",
        "points": 10,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "Natalia to D4 (samodzielny ekspert) — styl DELEGUJĄCY i MENTORING, nie kontrola. Mikrozarządzanie niszczy najlepszych. Manager ma zejść z drogi, dać autonomię, być dostępny, ale nie nadzorować. Rola mentora: delegowanie, nie instruktaż."
      },
      {
        "id": "manager-q10",
        "type": "text",
        "text": "CASE 5 — Zespół gra na siebie, nie na wynik. Audytorzy rywalizują o indywidualne statystyki, podkradają sobie rejony, nie pomagają nowym. Każdy patrzy na swój wynik, nie na target spółki. Na czym polega problem tego zespołu i jak zbudujesz nastawienie na wspólny wynik? Podaj konkretne działanie.",
        "points": 10,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "Brak dbałości o wspólny wynik + brak wzajemnej odpowiedzialności. Manager: widoczna wspólna tablica wyniku zespołu, nagradzanie pomocy nowym, jasny wspólny cel ponad ego. Audytorzy rozliczają się nawzajem. BŁĄD: premiowanie tylko indywidualnych gwiazd."
      },
      {
        "id": "manager-q11",
        "type": "text",
        "text": "CASE 6 — Debrief po dniu terenowym. Wracasz z dnia w terenie z nowym audytorem. Miał 8 pukań, 1 lead, kilka razy zaciął się przy obiekcji „nie mam czasu”. Chcesz, żeby się z tego nauczył na trwałe. Jak poprowadzisz omówienie tego dnia, żeby audytor naprawdę się nauczył? Rozpisz krok po kroku z pytaniami.",
        "points": 10,
        "options": null,
        "items": null,
        "correctIndex": null,
        "modelAnswer": "4 fazy: 1) DOŚWIADCZENIE (było); 2) REFLEKSJA: „co się stało? jak się czułeś?”; 3) WNIOSEK: „dlaczego klient się zamknął? jaka reguła?”; 4) EKSPERYMENT: „co zrobisz inaczej jutro?”. Sedno: audytor SAM wyciąga wniosek, nie dostaje gotowca. Utrwala 3x mocniej."
      }
    ]
  }
];
