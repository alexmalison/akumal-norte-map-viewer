// Public, read-only map feed. Deploy as HMB Sargassum Project, execute as me,
// accessible to anyone. Only the three Detail columns below are read.
const SPREADSHEET_ID = '1tbXRKF9f5TPvFh1nFQn1krqEmt3d2AQQxU6EMzerx7Q';
const LOT_GUIDE = [["138C811A148A9155","F0",0,"Casa de Espehas"],["K31GYERMMUY41290521FF42988E4","F1-3",0,"Casa Alux"],["K31GYERMMUY412905344B82C6EDC","F5",0,"Casa Cascadas"],["138697A25CF8EABC","F6",0,"Casa Seagate"],["1386987029629BCA","F7",0,"Casa Dos Palmas"],["1386993FE456BA88","F8-9",1,"Casa Papagayo"],["1386AB1C777A0B97","F12-13",0,"Casa Magna"],["K31GYERMMUY412955A6EC3DCC026","F14",0,"Casa Solymar"],["K31GYERMMUY412955AFE9451AEC8","F15",0,"Casa El Cielo"],["1386AEBF4BFDB8D3","F16",0,"Casa Iguana"],["K31GYERMMUY412955EA66146D238","F17",0,"Lot-F17"],["K31GYERMMUY41295623FA470206B","F18",0,"Casa Del Mar"],["K31GYERMMUY4129562D729BC3D6B","F19",0,"Casa Nicte-Ha"],["K31GYERMMUY4129563C4EC33DC8C","F20",0,"Casa Redonda"],["K31GYERMMUY41295647BC1200592","F21",0,"Casa Caribe"],["K31GYERMMUY41295567AB86ED04C","F22-23",0,"Casa Miramar"],["K31GYERMMUY4129566B724C47D0A","F24",0,"Casa Luna"],["K31GYERMMUY412956D143F1C9C72","F25",0,"Casa Zama"],["K31GYERMMUY412956A046F286B0A","F26",0,"Casa Rosa"],["K31GYERMMUY412956EE0DF497CFB","F27",0,"Casa Balam Ek / Casa Balam Ek 2",["Casa Balam Ek","Casa Balam Ek 2"]],["K31GYERMMUY412957090BB45C658","F28",0,"Villa Valhalla"],["K31GYERMMUY41295713B651A083C","F29",0,"Kokobeach"],["1386B31BB21D4792","F31-32",0,"M\u0026M Desaarrollo Inmobiliario"],["K31GYERMMUY41295752DA9EA4181","F33",0,"Villa de la Playa"],["K31GYERMMUY41295775EADE5923C","F34, F35-37",0,"The Rock House / La Buena Vida",["The Rock House","La Buena Vida"]],["K31GYERMMUY412957D2D167E0D71","G41B-1, G41B-2/4",0,"Half Moon Bay / La Belle Vie",["Half Moon Bay","La Belle Vie"]],["K31GYERMMUY412957EEB2F87BF30","G41C",0,"Lol Ka\u0027Naab"],["K31GYERMMUY412958010C636B4FD","G41D",0,"Operadora Media Luna"],["K31GYERMMUY4129581736C535685","G41E",0,"Playa Blanca"],["13450DA02B9C6F85","G42",0,"Nikte"],["K31GYERMMUY4129582A023656180","G42, G43",0,"Nikte Ha"],["K31GYERMMUY4129584B993D2264B","G",0,"Casa Blanca"],["K31GYERMMUY4129585FAF5FD9992","G44",0,"Playa Caribe",["Playa Caribe","Playa Caribe Casita Annette","Playa Caribe Casita Maria","Playa Caribe Casita Natasha"]],["134503CECD0C0441","G45",0,"Luna Azul",["Luna Azul","Luna Azul Bodega Norte","Luna Azul Bodega-Sur","Luna Azul Casita South"]],["1345000717FF1893","G46",0,"The Reef"],["1344FE5661098FE2","G46",0,"La Bahia"],["1344FD57387742A1","G48/49",1,"Los Flamingos"],["1344F9DA75148865","G48/49",1,"Los Flamingos"],["138CDE1C5C3FCD4B","G",0,"Flamingos studios across street"],["1344F8F1079FFAD2","G50",0,"La Joya"],["138CDF519A78DF0E","G50A",0,"Nai-Na"],["1344F66C32B695D5","G51",0,"Casa Fortuna"],["138CDFDF09934500","G51A",0,"Casita Fortuna"],["1344F5993152D523","G52",0,"Lot-G52"],["138CE07B3C104386","G52A",0,"Lot-G52A"],["K31GYERMMUY412907A7891570C8A","G53",0,"Tan- Ik"],["138CE0DC8A5F1579","G53A",0,"Cristal Azul"],["13452E4865929A53","HA",0,"Lot-HA"],["13452DDFA9593111","HB/C",1,"Lot-HB/C"],["13452C3BF1AAD0A6","HB/C",1,"Lot-HB/C"],["1344F132AE486465","HD",0,"La Mirage"],["K31GYERMMUY412905F5706D11B38","HE",0,"La Tortuga"],["1344ECB9BB0B5952","HF",0,"Lot-HF"],["13259B562ABA446C","H1-3",1,"Lot-H1-3"],["13259D0FE34CBAB6","H4",0,"Lot-H4"],["13259E60A8B0E87B","H5",0,"Lagoon Access"],["132597758F2BE663","H6",0,"Casa del Sol"],["1325968FDC7E4665","H7",0,"Azul Riviera"],["132595DF97276B8E","H8",0,"Adventuras Mayas"],["13259513A1D72478","H9",0,"Caleta Yalku"],["1325825C9A34ACF2","H10",0,"Casa Romero"],["1386E7C944A479B7","H11",0,"Casa Mariposa (fractional ownership)"],["132583D18B11BC9B","H12",0,"Villa Las Vigas"],["132584A1ECC9BB68","H13",0,"Quinta del Mar"],["1386E8A5CC43CC28","H14",0,"Casa Bella"],["1386E9858E65D78E","H15",0,"Casa Aurora"],["K31GYERMMUY4129080CE9D64D196","H16",0,"Villa Gaugain"],["1325A21A0729C559","H17",0,"Lot-H17"],["1325A2B259DDAC6D","H18",0,"Lot-H18"],["13869430C4DB46AC","H19/20",1,"Casa Christiansen"],["1325A3220496545B","H19/20",1,"Casa Christiansen"],["1325A449F9170121","H21/22",1,"Lot-H21/22"],["1325A5073CB6F8ED","H21/22",1,"Lot-H21/22"],["1325A8722110FC3D","H23",0,"Villa de los Suenos"],["1325A91B2BD88AEA","H24",0,"Lot-H24"],["1325AAB0457B7585","H26",0,"Yalku Cai"],["1325B4F0792FAA49","H27",0,"Lot-H27"],["1325ABB8BB3A2CB2","H28",0,"Casa Jaguar"],["444AF0DB7318BC0D","H29",1,"Lot-H29"],["444AF17FBADBCB09","H30",1,"Casa de Colores"],["444AF22E81564DD2","H31",1,"Nah Ha"],["444AF833517D8DAE","H32",0,"Lot-H32"],["13452A23C02B4F94","H29",1,"Lot-H29"],["13452AC64DFBFFF9","H30",1,"Casa de Colores"],["13452B83FDDE1432","H31",1,"Nah Ha"],["13452875C1F662CB","H32/33",0,"La Iguana"],["K31GYERMMUY41290652996ED43BB","H34/35",0,"La Sirena"],["13451A9BE683C32C","H36",0,"Villa Bellamar"],["13451BDF08C9F6BC","H37",0,"Lot-H37"],["13451CE5F46CA6E9","H38",0,"CasaTlalocan"],["1345210D01EDB312","H39",0,"Lot-H39"],["13452026D6700A24","H40/41",1,"Casa Mayanah (fractional ownership)"],["13451E8396D12D7E","H40/41",1,"Casa Mayanah (fractional ownership)"],["4ABA2A81B247B7C1","H42",1,"Nahil"],["K31GYERMMUY412906380CCE36283","H43",0,"Yool Canal"],["134516FEF0697D61","H44",0,"Casa Maya"],["13452D6662367A88","H45",0,"Lot-H45"],["1344E2278238CB63","H50/51",1,"Casa Laguna"],["1344E07BACC28836","H50/51",1,"Casa Laguna"],["1344DFAD027F8BA0","H52",0,"Casa Las Culpas"],["1344DF136C3FA0AC","H53",0,"Casa Savasana"],["1344DA5CAE07A7E7","H54/55/56/57",1,"Lot-H54/55 56/57"],["1344DADDE65CC976","H54/55/56/57",1,"Lot-H54/55 56/57"],["1344DB4DC84B0C95","H54/55/56/57",1,"Lot-H54/55 56/57"],["1344D88B36B8B332","H54/55/56/57",1,"Lot-H54/55 56/57"],["1344E2D6E63603E8","H58",0,"Casa Torroella"],["1344E3ED0E2BFCB2","H59",0,"Oﬃce"],["1344E470E752C43C","H60",0,"Casa Ikoods"],["1344E507B00DDB0B","H61",0,"Casa Alcaraz"],["1325C021B352238E","H73",0,"Lot-H73"],["1325C080F1EE167C","H74",0,"Casa Chile"],["1325C1C2397D5274","H75/76",1,"Casa Konomi"],["1325C28F3B45EBA1","H75/76",1,"Casa Konomi"],["1325C2FCA4E3AED9","H77",0,"Lot-H77"],["1325C34EEBD679BF","H78",0,"Lot-H78"],["1325C3B83263B303","H79",0,"Casa Galeria"],["1325B76907CB337E","H80/81/82",1,"Casa Orozco"],["1325B8E1D482F6F0","H80/81/82",1,"Casa Orozco"],["1325B9DC3B5BE8B5","H80/81/82",1,"Casa Orozco"],["1325BAEC57CECB66","H83",0,"Casa Tucan y Quetzal"],["1325BB841734FC97","84",0,"Lot-84"],["1325BBF613E06F69","H85",0,"Casa Jimenez"],["1325BD6C735266B1","H86",0,"Lot-H86"],["1325BDD6D2BBFA7A","87",0,"Morningstar Restaurant"],["1325BEB9E270A761","H88",0,"Akumal Villas"],["1325BF65BC026645","H89",0,"Lot-H89"],["132592DE8E4E4374","H94",0,"Lot-H94"],["132592253878ED05","H95",0,"Lot-H95"],["K31GYERMMUY4129080101B34655A","H96",0,"VILLA SOFIA"],["1386E55A992A11EE","H97",0,"Que Onda House"],["1386E3D9D86F17E1","H98, H99",0,"Que Onda Restaurant / Que Onda Hotel",["Que Onda Restaurant","Que Onda Hotel"]],["K31GYERMMUY412907B6DB78C63D2","H100",0,"Casa Gatos"],["1325B5B8A5723C17","H101",0,"Casa Ventura"],["K31GYERMMUY412907CF11421E785","H102",0,"Casa Tranquilidad"],["132590D0D7F2A385","H103",0,"Villa Milagro"],["1325917AD3C079B1","H104",0,"Lot-H104"],["44541EECBCCF5BDA","G44A",0,"Lot-G44A"],["445449289AC872EF","G",0,"Midway store and building"],["448CA6BD3D8F94BA","H1-3",1,"Lot-H1-3"],["448CA9196A21BA7C","H1-3",1,"Lot-H1-3"],["138699C16F6663C7","F8-9",1,"Casa Papagayo"],["4ABA298BEFD99826","H42",1,"Nahil"],["K31GYERMMUY412957C761B3BBB58","G38-41A",0,"Del Sol Condos and Hotel"],["13869FE1A0D8B328","F10",0,"Mi Casa del Mar"]];

function normalizeName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeCode(value) {
  return String(value || '').replace(/\s*\n\s*/g, '/')
    .replace(/\/+/g, '/').replace(/\s+/g, '').toUpperCase();
}

function splitCodes(value) {
  return String(value).split(',').map(normalizeCode).filter(Boolean);
}

function cents(value) {
  if (value === '' || value === null) return 0;
  const number = typeof value === 'number' ? value :
    Number(String(value).replace(/[$,]/g, '').trim());
  if (!Number.isFinite(number) || number < 0 ||
      Math.abs(number * 100 - Math.round(number * 100)) > 0.005) {
    throw new Error('Invalid donated amount');
  }
  return Math.round(number * 100);
}

function readDetail() {
  const response = Sheets.Spreadsheets.Values.batchGet(SPREADSHEET_ID, {
    ranges: ["'Detail'!A3:A", "'Detail'!F3:F", "'Detail'!AZ3:AZ"],
    valueRenderOption: 'UNFORMATTED_VALUE'
  });
  if (!response.valueRanges || response.valueRanges.length !== 3) {
    throw new Error('Expected three Detail column ranges');
  }
  const columns = response.valueRanges.map(block =>
    (block.values || []).map(row => row[0] === undefined ? '' : row[0]));
  if (columns[0][0] !== 'Stakeholder Name' || columns[1][0] !== 'Donated' ||
      columns[2][0] !== 'S-N Sequence') {
    throw new Error('Detail headers have changed');
  }
  const length = Math.max(...columns.map(column => column.length));
  if (length < 100) throw new Error('Detail tab has too few rows');
  const rows = [];
  for (let i = 1; i < length; i++) {
    const name = String(columns[0][i] || '').trim().replace(/\s+/g, ' ');
    const code = normalizeCode(columns[2][i]);
    if (name) rows.push([name, cents(columns[1][i]), code]);
  }
  if (rows.length < 100) throw new Error('Too few named Detail rows');
  return rows;
}

function buildDonations(rows) {
  const groups = new Map();
  const byCode = new Map();
  LOT_GUIDE.forEach(entry => {
    const knownNames = entry[4] || [entry[3]];
    const sourceCodes = splitCodes(entry[1]);
    const key = JSON.stringify([sourceCodes, knownNames.map(normalizeName)]);
    if (!groups.has(key)) groups.set(key, { knownNames, records: [] });
    sourceCodes.forEach(code => {
      if (!byCode.has(code)) byCode.set(code, new Set());
      byCode.get(code).add(key);
    });
  });

  const ambiguous = [];
  rows.forEach(([name, amount, code]) => {
    if (!code) return;
    const candidates = [...(byCode.get(code) || [])];
    const named = candidates.filter(key => JSON.parse(key)[1].includes(normalizeName(name)));
    const key = named.length === 1 ? named[0] :
      named.length === 0 && candidates.length === 1 ? candidates[0] : null;
    if (key) groups.get(key).records.push([name, amount]);
    else if (candidates.length) ambiguous.push(code);
  });
  const missing = [...groups].filter(([, group]) => !group.records.length);
  if (ambiguous.length || missing.length) {
    throw new Error('Uncertain lot matching: ' +
      JSON.stringify({ ambiguous: [...new Set(ambiguous)], missing: missing.length }));
  }

  return LOT_GUIDE.map(entry => {
    const [id, sourceCode, shared, originalName, known] = entry;
    const knownNames = known || [originalName];
    const key = JSON.stringify([splitCodes(sourceCode), knownNames.map(normalizeName)]);
    const records = groups.get(key).records;
    const amount = records.reduce((sum, row) => sum + row[1], 0) / 100;
    const actualNames = [...new Set(records.map(row => row[0]))];
    const orderedNames = [];
    knownNames.forEach(knownName => actualNames.forEach(name => {
      if (normalizeName(name) === normalizeName(knownName) &&
          !orderedNames.includes(name)) orderedNames.push(name);
    }));
    actualNames.forEach(name => {
      if (!orderedNames.includes(name)) orderedNames.push(name);
    });
    const label = orderedNames.length === 1 ? orderedNames[0] :
      orderedNames.slice(1).every(name => name.startsWith(orderedNames[0] + ' '))
        ? orderedNames[0] : orderedNames.join(' / ');
    const result = [id, amount, sourceCode, shared, label];
    if (orderedNames.length > 1) result.push(orderedNames);
    return result;
  });
}

// Donors with no lot code (businesses and friends), largest first.
function buildContributors(rows) {
  const totals = new Map();
  rows.forEach(([name, amount, code]) => {
    if (!code && amount > 0) totals.set(name, (totals.get(name) || 0) + amount);
  });
  return [...totals].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, amount]) => [name, amount / 100]);
}

function doGet() {
  const rows = readDetail();
  const donations = buildDonations(rows);
  const contributors = buildContributors(rows);
  const ownerRows = rows.filter(([, amount, code]) => code && amount > 0);
  const ownerSummary = {
    contributors: ownerRows.length,
    amount: ownerRows.reduce((sum, row) => sum + row[1], 0) / 100
  };
  const payload = { generatedAt: new Date().toISOString(), donations, contributors, ownerSummary };
  const json = JSON.stringify(payload).replace(/</g, '\\u003c');
  return ContentService.createTextOutput('akumalReceiveDonations(' + json + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
