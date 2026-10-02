// Generează docs/program.json din calendarul OFICIAL 2026 al Primăriei Sâncraiu de Mureș
// (operator Sylevy Cleaning): https://sancraiums.ro/wp-content/uploads/2026/02/Program-de-colectare-deseuri-Sancraiu-de-Mures.pdf
//
// Calendarul are 5 zone (pubela neagră + maro, o zi fixă pe săptămână, tot anul) și zile comune
// pentru ambalaje (sâmbăta) și sticlă (o miercuri pe lună).
// Rulare: node scripts/build-program-2026.js
const fs = require('fs');
const path = require('path');
const { formatProgram } = require('./format-program');

const programPath = path.join(__dirname, '..', 'docs', 'program.json');
const current = JSON.parse(fs.readFileSync(programPath, 'utf8'));

// Străzile exact ca în calendar; corectate doar greșelile evidente de tipar
// („Laleleor” → „Lalelelor”, „Crinzantemelor” → „Crizantemelor”).
const zones = [
  {
    weekday: 1, // luni
    streets: [
      'Principală (între Strâmbă și Vale)', 'Digului', 'Rândunicii', 'Cotului', 'Salcilor', 'Nucului',
      'Toamnei', 'Verii', 'Primăverii', 'Zorilor', 'Mureșului', 'Apelor', 'Garofiței', 'Gladiolelor',
      'Irisului', 'Iasomniei', 'Muscății', 'Târgului', 'Crizantemelor', 'Pieței',
    ],
  },
  {
    weekday: 2, // marți
    streets: [
      'Strâmbă', 'Noua', 'Florilor', 'Fabricii', 'Scurta', 'Buchetului', 'Margaretelor', 'Lalelelor',
      'Măcieșului', 'Alunișului', 'Cooperativei', 'Plopilor', 'Delureni', 'Dealului', 'Mestecănișului',
      'Orizontului', 'Lutului', 'Subpădurii',
    ],
  },
  {
    weekday: 3, // miercuri
    streets: [
      'Principală (între Vale și Luminișului)', 'Vale', 'Stejarului', 'Teilor', 'Pârâului', 'Panseluțelor',
      'Valea Viilor', 'Ghioceilor', 'Lavandei', 'Rozmarinului', 'Pădurii', 'Livezilor', 'Lămâiței',
      'Răsăritului', 'Platanilor', 'Bradului', 'Socului', 'Paltinilor',
    ],
  },
  {
    weekday: 4, // joi
    streets: [
      'Principală (între Luminișului și Vadului)', 'Luminișului', 'Lăcrămioarei', 'Magnoliei', 'Rozelor',
      'Viitorului', 'Tineretului', 'Pășunii', 'Narciselor', 'Violetelor', 'Nufărului', 'Liliacului',
      'Cerbului', 'Mioriței', 'Speranței', 'Salcâmilor', 'Macului', 'Vadului', 'Căprioarei',
    ],
  },
  {
    weekday: 5, // vineri
    streets: [
      'Principală (între Vadului și Gării)', 'Școlii', 'Mureșului', 'Plaiului', 'Digului', 'Crinului',
      'Grâului', 'Câmpului', 'Busuiocului', 'Gării', 'Izvorului', 'Apiculturilor', 'Fagului',
      'Trandafirilor', 'Bujorului', 'Aleea Nordului', 'Viilor', 'Sportivilor',
    ],
  },
];

// Comune pentru toată comuna (citite lună cu lună din calendar).
const common = {
  paper: { 1: [3, 17], 2: [7, 21], 3: [7, 21], 4: [4, 18], 5: [2, 16], 6: [6, 20], 7: [4, 18], 8: [1, 15], 9: [5, 19], 10: [3, 17], 11: [7, 21], 12: [5, 19] },
  plastic: { 1: [10, 24], 2: [14, 28], 3: [14, 28], 4: [11, 25], 5: [9, 23], 6: [13, 27], 7: [11, 25], 8: [8, 22], 9: [12, 26], 10: [10, 24], 11: [14, 28], 12: [12, 26] },
  glass: { 1: [21], 2: [18], 3: [18], 4: [15], 5: [20], 6: [17], 7: [15], 8: [19], 9: [16], 10: [21], 11: [18], 12: [16] },
  exceptions: { 1: [31], 5: [30], 8: [29], 10: [31] },
};

const program = {
  ...current,
  version: current.version + 1,
  updated: new Date().toISOString().slice(0, 10),
  sectors: zones.map((z, i) => ({
    id: `zona${i + 1}`,
    number: i + 1,
    streets: z.streets,
    years: { 2026: { residualWeekday: z.weekday, ...common } },
    notes: [],
  })),
};

fs.writeFileSync(programPath, formatProgram(program));
console.log(`program.json: versiunea ${program.version}, ${program.sectors.length} zone, ${zones.reduce((n, z) => n + z.streets.length, 0)} străzi`);
