import type { AcademyStage } from "./types";

/**
 * PRZYKŁADOWA TREŚĆ AKADEMII — do podmiany przez NLE (skrypty, obiekcje, filmy).
 * Struktura jest docelowa; teksty są szkicem, żeby pokazać działanie ścieżek,
 * quizów i egzaminów. Docelowo edycja w panelu admina (Supabase).
 */

const sales: AcademyStage[] = [
  {
    id: "s1",
    track: "sales",
    order: 1,
    title: "Fundamenty",
    description: "Program Czyste Powietrze, Next Level Energy i Twoja rola jako doradcy.",
    lessons: [
      {
        id: "s1-l1",
        kind: "script",
        title: "Czym zajmujemy się w NLE",
        minutes: 6,
        sections: [
          { heading: "Misja", text: "Pomagamy właścicielom domów jednorodzinnych przejść termomodernizację z dofinansowaniem z programu Czyste Powietrze — od audytu, przez wniosek, po realizację." },
          { heading: "Droga klienta", text: "Audytor wykonuje audyt i pomiary, przygotowuje ofertę i przekazuje ją handlowcowi. Handlowiec podpisuje umowę, a biuro prowadzi klienta przez weryfikację dokumentów i wniosek do WFOŚiGW." },
          { heading: "Twoja rola", text: "Jesteś doradcą: wyjaśniasz zakres prac, korzyści i proces. Uczciwość i rzetelność to podstawa — każda obietnica musi mieć pokrycie w ofercie." },
        ],
      },
      {
        id: "s1-l2",
        kind: "video",
        title: "Program Czyste Powietrze w 10 minut",
        minutes: 10,
        url: null,
        summary: "Progi dochodowe, zakres prac, prefinansowanie i rola WFOŚiGW — w prostych słowach, tak jak tłumaczysz to klientowi.",
      },
      {
        id: "s1-l3",
        kind: "quiz",
        title: "Sprawdź się",
        minutes: 3,
        questions: [
          {
            id: "s1-q1",
            text: "Kto przekazuje handlowcowi ofertę do podpisania?",
            options: ["Biuro", "Audytor", "Klient", "WFOŚiGW"],
            correct: [1],
            explanation: "Audytor po pomiarach tworzy ofertę i przekazuje ją handlowcowi (status „PRZEKAZANA DO PH”).",
          },
        ],
      },
    ],
    exam: {
      questions: [
        {
          id: "s1-e1",
          text: "Od jakiego statusu prowizja handlowca jest zielona?",
          options: ["UMOWA PODPISANA", "REALIZACJA AUDYTU - GWD", "W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW", "WELCOME CALL"],
          correct: [2],
          explanation: "Prowizja handlowca zielenieje od „W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW” lub dalej.",
        },
        {
          id: "s1-e2",
          text: "Klient ma termomodernizację i kocioł. Ile prowizji dostaje handlowiec?",
          options: ["Dwie — za każdą umowę", "Jedną za klienta (Duet)", "Jedną, ale tylko za termo", "Żadnej, dopóki nie ma REK"],
          correct: [1],
          explanation: "Rozliczamy za klienta: termo + źródło ciepła = jedna prowizja w stawce Duet.",
        },
        {
          id: "s1-e3",
          text: "Które zdania są prawdziwe? (zaznacz wszystkie)",
          options: [
            "Obietnice wobec klienta muszą mieć pokrycie w ofercie",
            "Lead zakładamy w aplikacji",
            "Spotkania można umawiać poza aplikacją",
            "Dokumenty po podpisie powinny być kompletne w 24h",
          ],
          correct: [0, 1, 3],
          explanation: "Spotkania umawiamy tylko w aplikacji — wtedy trafiają do Misji i Kalendarza Google.",
        },
        {
          id: "s1-e4",
          text: "Co oznacza „Duet”?",
          options: ["Dwóch handlowców u jednego klienta", "Termo + co najmniej jedno źródło ciepła u klienta", "Dwie umowy termo", "Umowa z rekuperacją"],
          correct: [1],
          explanation: "Duet to zakres umów u jednego klienta: termomodernizacja + źródło ciepła.",
        },
        {
          id: "s1-e5",
          text: "Gdzie widzisz, na jakim etapie są umowy Twoich klientów?",
          options: ["Tylko w CRM", "W Trajektorii w Skarbcu", "W Orbicie", "Nigdzie"],
          correct: [1],
          explanation: "Trajektoria w Skarbcu pokazuje drogę każdej umowy przez statusy, na żywo.",
        },
      ],
    },
  },
  {
    id: "s2",
    track: "sales",
    order: 2,
    title: "Skrypt rozmowy",
    description: "Otwarcie, diagnoza potrzeb, prezentacja oferty i domknięcie.",
    lessons: [
      {
        id: "s2-l1",
        kind: "script",
        title: "Cztery kroki rozmowy",
        minutes: 8,
        sections: [
          { heading: "1. Otwarcie", text: "Przedstaw się, przypomnij wizytę audytora i cel spotkania. Zapytaj, ile klient ma czasu — i dopasuj rozmowę." },
          { heading: "2. Diagnoza", text: "Dopytaj o rachunki, komfort cieplny i plany na dom. Słuchaj więcej, niż mówisz; zapisuj słowa klienta." },
          { heading: "3. Oferta", text: "Pokaż zakres z audytu i wyjaśnij, jak przekłada się na potrzeby, które klient sam nazwał. Liczby pokazuj w Konfiguratorze." },
          { heading: "4. Domknięcie", text: "Podsumuj korzyści, zapytaj o decyzję i ustal kolejny krok z datą. Brak decyzji też wymaga konkretnego terminu." },
        ],
      },
      {
        id: "s2-l2",
        kind: "video",
        title: "Nagranie wzorcowej rozmowy",
        minutes: 15,
        url: null,
        summary: "Pełne spotkanie domykające z komentarzem trenera.",
      },
    ],
    exam: {
      questions: [
        {
          id: "s2-e1",
          text: "Jaka jest kolejność kroków rozmowy?",
          options: ["Oferta → Diagnoza → Domknięcie → Otwarcie", "Otwarcie → Diagnoza → Oferta → Domknięcie", "Diagnoza → Otwarcie → Domknięcie → Oferta"],
          correct: [1],
          explanation: "Otwarcie, diagnoza potrzeb, oferta, domknięcie.",
        },
        {
          id: "s2-e2",
          text: "Klient nie podjął decyzji. Co robisz?",
          options: ["Kończę spotkanie bez ustaleń", "Ustalam konkretny termin kolejnego kroku", "Obniżam cenę bez konsultacji"],
          correct: [1],
          explanation: "Każde spotkanie kończy się konkretnym kolejnym krokiem z datą.",
        },
        {
          id: "s2-e3",
          text: "Na czym opierasz prezentację oferty?",
          options: ["Na zakresie z audytu i potrzebach nazwanych przez klienta", "Na najdroższym pakiecie", "Na ofercie konkurencji"],
          correct: [0],
          explanation: "Oferta wynika z audytu i odpowiada na potrzeby, które klient sam wskazał.",
        },
      ],
    },
  },
  {
    id: "s3",
    track: "sales",
    order: 3,
    title: "Bank obiekcji",
    description: "Najczęstsze obiekcje klientów i sprawdzone odpowiedzi.",
    lessons: [
      {
        id: "s3-l1",
        kind: "objections",
        title: "Najczęstsze obiekcje",
        minutes: 10,
        items: [
          { objection: "Muszę się zastanowić.", answer: "Oczywiście. Żeby było łatwiej — co jeszcze musiałoby być jasne, żeby podjąć decyzję?", tip: "Ustal konkretny termin kolejnego kontaktu." },
          { objection: "To za drogie.", answer: "Rozumiem. Porównajmy to z tym, ile dziś wydaje Pan na ogrzewanie, i z kwotą dofinansowania.", tip: "Mów o całkowitym koszcie i oszczędnościach, nie o samej cenie." },
          { objection: "Boję się formalności.", answer: "To my prowadzimy wniosek i dokumenty — w aplikacji widzę na bieżąco, na jakim etapie jest Pana umowa.", tip: "Pokaż Trajektorię." },
          { objection: "Sąsiad miał złe doświadczenia.", answer: "Dziękuję, że Pan mówi. Co dokładnie poszło nie tak? Pokażę, jak u nas wygląda ten etap." },
        ],
      },
      {
        id: "s3-l2",
        kind: "quiz",
        title: "Dopasuj odpowiedź",
        minutes: 3,
        questions: [
          {
            id: "s3-q1",
            text: "Klient: „To za drogie”. Najlepszy pierwszy krok?",
            options: ["Od razu obniżyć cenę", "Porównać z obecnymi kosztami ogrzewania i dofinansowaniem", "Zakończyć rozmowę"],
            correct: [1],
            explanation: "Przenieś rozmowę z ceny na koszt całkowity i oszczędności.",
          },
        ],
      },
    ],
    exam: {
      questions: [
        {
          id: "s3-e1",
          text: "Klient: „Muszę się zastanowić”. Co robisz?",
          options: ["Pytam, co jeszcze musiałoby być jasne, i ustalam termin", "Naciskam na natychmiastowy podpis", "Odpuszczam bez ustaleń"],
          correct: [0],
          explanation: "Dopytaj o wątpliwości i ustal konkretny termin.",
        },
        {
          id: "s3-e2",
          text: "Co pomaga klientowi, który boi się formalności? (zaznacz wszystkie)",
          options: ["Wyjaśnienie, że biuro prowadzi wniosek", "Pokazanie Trajektorii umowy", "Zbycie tematu", "Podanie kolejnego kroku z datą"],
          correct: [0, 1, 3],
          explanation: "Konkret i przejrzystość procesu zmniejszają obawy.",
        },
      ],
    },
  },
  {
    id: "s4",
    track: "sales",
    order: 4,
    title: "Po podpisie",
    description: "Komplet dokumentów w 24h, statusy, Skarbiec i Trajektoria.",
    lessons: [
      {
        id: "s4-l1",
        kind: "script",
        title: "Pierwsze 24 godziny",
        minutes: 5,
        sections: [
          { heading: "Komplet dokumentów", text: "KPI „Komplet dokumentów (handlowiec + biuro)” liczy czas od podpisania umowy do pierwszego pozytywnego statusu po weryfikacji. Cel: do 24h." },
          { heading: "Statusy", text: "Status negatywny w trakcie weryfikacji liczy się do czasu. Braki uzupełniaj od razu — biuro widzi je w CRM." },
        ],
      },
    ],
    exam: {
      questions: [
        {
          id: "s4-e1",
          text: "Ile czasu masz razem z biurem na komplet dokumentów?",
          options: ["24h", "48h", "7 dni"],
          correct: [0],
          explanation: "Okno KPI to 24h (wartość w ustawieniach).",
        },
        {
          id: "s4-e2",
          text: "Co się dzieje, gdy umowa po wypłacie prowizji spadnie w status negatywny?",
          options: ["Nic", "Potrącenie w rozliczeniu okresu spadku", "Utrata poziomu"],
          correct: [1],
          explanation: "Potrącenie w rozliczeniu okresu, w którym nastąpił spadek; zdobyty poziom zostaje.",
        },
      ],
    },
  },
];

const auditor: AcademyStage[] = [
  {
    id: "a1",
    track: "auditor",
    order: 1,
    title: "Rola audytora",
    description: "Audyt energetyczny, program Czyste Powietrze i współpraca z handlowcem.",
    lessons: [
      {
        id: "a1-l1",
        kind: "script",
        title: "Twoja rola",
        minutes: 6,
        sections: [
          { heading: "Audyt", text: "Wykonujesz pomiary i dokumentację, na podstawie których powstaje oferta. Rzetelność danych decyduje o całym procesie." },
          { heading: "Przekazanie", text: "Po utworzeniu oferty przekazujesz ją handlowcowi (status „PRZEKAZANA DO PH”). Od tej chwili w Radarze biegnie licznik 3 dni." },
        ],
      },
      { id: "a1-l2", kind: "video", title: "Dzień z audytorem", minutes: 12, url: null, summary: "Jak wygląda wizyta audytowa krok po kroku." },
    ],
    exam: {
      questions: [
        {
          id: "a1-e1",
          text: "Od jakiego statusu prowizja audytora jest szara, a od jakiego zielona?",
          options: ["Szara od W TRAKCIE POMIARÓW, zielona od SUKCES", "Szara od DOKUMENTACJA POMIAROWA, zielona od TWORZENIE OFERTY", "Zielona od UMOWA PODPISANA"],
          correct: [1],
          explanation: "Szara od „DOKUMENTACJA POMIAROWA”, zielona od „TWORZENIE OFERTY”.",
        },
        {
          id: "a1-e2",
          text: "Kiedy dostajesz bonus za zamknięcie?",
          options: ["Gdy handlowiec zamknie klienta z Twojego audytu", "Za każdy audyt", "Tylko na poziomie 5+"],
          correct: [0],
          explanation: "Bonus należy się zawsze, gdy prowizja handlowca u Twojego klienta jest zielona.",
        },
        {
          id: "a1-e3",
          text: "Od czego zależy stawka audytora za klienta?",
          options: ["Od progu dochodowego klienta i poziomu audytora", "Od wartości umowy", "Od liczby pomiarów"],
          correct: [0],
          explanation: "Stawka: próg dochodowy (podstawowy / podwyższony / najwyższy) × poziom.",
        },
      ],
    },
  },
  {
    id: "a2",
    track: "auditor",
    order: 2,
    title: "Pomiary i dokumentacja",
    description: "Kompletna dokumentacja pomiarowa bez poprawek.",
    lessons: [
      {
        id: "a2-l1",
        kind: "script",
        title: "Lista kontrolna pomiarów",
        minutes: 8,
        sections: [
          { heading: "Przed wizytą", text: "Sprawdź dane klienta i termin w Misjach. Naładuj sprzęt." },
          { heading: "Na miejscu", text: "Wykonaj pomiary według listy, zrób zdjęcia, uzupełnij dokumentację od razu — nie po powrocie." },
          { heading: "Po wizycie", text: "Wyślij dokumentację pomiarową; negatywna weryfikacja pomiarowa oznacza poprawki i opóźnienie oferty." },
        ],
      },
    ],
    exam: {
      questions: [
        {
          id: "a2-e1",
          text: "Kiedy uzupełniasz dokumentację?",
          options: ["Na miejscu, od razu", "Na koniec tygodnia", "Gdy biuro przypomni"],
          correct: [0],
          explanation: "Dokumentacja uzupełniona na miejscu = mniej poprawek i szybsza oferta.",
        },
        {
          id: "a2-e2",
          text: "Co oznacza „NEGATYWNA WERYFIKACJA POMIAROWA”?",
          options: ["Poprawki i opóźnienie oferty", "Koniec procesu", "Zieloną prowizję"],
          correct: [0],
          explanation: "To status negatywny — trzeba poprawić dokumentację.",
        },
      ],
    },
  },
  {
    id: "a3",
    track: "auditor",
    order: 3,
    title: "Rozmowa z klientem",
    description: "Obiekcje na etapie audytu i dobre przekazanie do handlowca.",
    lessons: [
      {
        id: "a3-l1",
        kind: "objections",
        title: "Obiekcje przy audycie",
        minutes: 6,
        items: [
          { objection: "Po co ten audyt?", answer: "Audyt pokazuje, które prace dadzą największą oszczędność i jest podstawą dofinansowania." },
          { objection: "Nie mam teraz czasu.", answer: "Rozumiem — umówmy termin, który Panu pasuje. Wpiszę go od razu w aplikacji." },
        ],
      },
    ],
    exam: {
      questions: [
        {
          id: "a3-e1",
          text: "Klient pyta „po co audyt?”. Najlepsza odpowiedź?",
          options: ["Bo tak trzeba", "Pokazuje, które prace dadzą największą oszczędność, i jest podstawą dofinansowania", "Żeby sprzedać więcej"],
          correct: [1],
          explanation: "Mów o korzyści klienta i roli audytu w programie.",
        },
      ],
    },
  },
];

export const academyStages: AcademyStage[] = [...sales, ...auditor];
