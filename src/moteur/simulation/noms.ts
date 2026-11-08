// Prénoms des échos : le nom proposé à l'éclosion (le dé) et celui des échos sauvages.
// Les 62 + 62 prénoms du prototype (WILD_ECHO_NAMES_M / _F) sont gardés en tête ; s'y ajoutent des prénoms
// doux, inventés ou rares, dans l'esprit du jeu (pas de marque, pas de personnage connu, aucun PNJ du jeu).
// Le tirage évite les noms déjà portés (écho du joueur, échos sauvages connus, autres parties du profil).
import type { Aleatoire, Etat, Genre } from './types';

const PROTOTYPE_M = ['Filo', 'Brindo', 'Kesh', 'Namoro', 'Talvi', 'Orin', 'Sculo', 'Ranvik', 'Isendo', 'Volren', 'Maldo', 'Threnn', 'Zaphir', 'Corvin', 'Wenlo', 'Dravo', 'Bram', 'Halvor', 'Jorik', 'Sennik', 'Tavro', 'Ombric', 'Wyrn', 'Kaldur', 'Fenro', 'Silvo', 'Dorrin', 'Askel', 'Grynn', 'Ulvar', 'Perrin', 'Mordan', 'Ravik', 'Skerin', 'Tolven', 'Yorric', 'Aldren', 'Bosvin', 'Cendric', 'Draygo', 'Elorin', 'Fenwick', 'Garrow', 'Holwin', 'Ivarn', 'Jothen', 'Kestrel', 'Lorvan', 'Marrow', 'Norvik', 'Oskar', 'Pyrren', 'Quenlo', 'Renwick', 'Stravo', 'Torrin', 'Uskan', 'Vendrin', 'Wrenlo', 'Xarion', 'Yulric', 'Zenwar'];
const PROTOTYPE_F = ['Fila', 'Brinda', 'Kesha', 'Namora', 'Talvia', 'Orina', 'Sculla', 'Ranvika', 'Isenda', 'Volrena', 'Malda', 'Threnna', 'Zaphira', 'Corvina', 'Wenla', 'Dravina', 'Brama', 'Halvora', 'Jorika', 'Sennika', 'Tavra', 'Ombrica', 'Wyrna', 'Kaldura', 'Fenra', 'Silva', 'Dorrina', 'Askela', 'Grynna', 'Ulvara', 'Perrina', 'Mordana', 'Ravika', 'Skerina', 'Tolvena', 'Yorrica', 'Aldrena', 'Bosvina', 'Cendrica', 'Draygona', 'Elorina', 'Fenwicka', 'Garrowa', 'Holwina', 'Ivarna', 'Jothena', 'Kestrela', 'Lorvana', 'Marrowa', 'Norvika', 'Oskara', 'Pyrrena', 'Quenla', 'Renwicka', 'Stravona', 'Torrina', 'Uskana', 'Vendrina', 'Wrenla', 'Xariona', 'Yulrica', 'Zenwara'];

const DOUX_M = [
  'Aelio', 'Amrel', 'Anwel', 'Arven', 'Aubrin', 'Avelin', 'Bael', 'Belren', 'Berio', 'Brevel', 'Brumo', 'Brizo', 'Caelin', 'Calvio',
  'Camrel', 'Celio', 'Cendrin', 'Cirnel', 'Dalvin', 'Daryo', 'Delwin', 'Doriel', 'Dunel', 'Edrin', 'Elvio', 'Emrel', 'Enzel', 'Erwal',
  'Esmon', 'Evrin', 'Fabrel', 'Falen', 'Ferlin', 'Fiorel', 'Florin', 'Galvin', 'Gaspel', 'Gildo', 'Gorwen', 'Hadrel', 'Halin', 'Helio',
  'Hobrin', 'Ilvan', 'Isaël', 'Ivrel', 'Jassel', 'Javin', 'Joren', 'Kalvo', 'Kerrin', 'Kiriel', 'Lanvel', 'Laurin', 'Lenno', 'Lirel',
  'Lodo', 'Loris', 'Luvel', 'Maelor', 'Marlo', 'Mavel', 'Mirlo', 'Moussin', 'Nalio', 'Nebel', 'Nilo', 'Noriel', 'Nuvo', 'Obrel', 'Olwin',
  'Ombel', 'Orlio', 'Palvin', 'Pelio', 'Pellin', 'Perlin', 'Pimrel', 'Quillo', 'Quirin', 'Rafel', 'Ralin', 'Renvo', 'Rilo', 'Rivo',
  'Robel', 'Romel', 'Salvin', 'Savel', 'Selio', 'Sirel', 'Solen', 'Sorvo', 'Tarvel', 'Telio', 'Tillo', 'Tilvan', 'Tobrel', 'Torvel',
  'Ulrin', 'Umbel', 'Valio', 'Varin', 'Velmo', 'Wilmo', 'Wistan', 'Yanel', 'Yorel', 'Zalvo', 'Zenio', 'Zilo', 'Aubépin', 'Brunel',
  'Céladon', 'Duvel', 'Églantin', 'Frimas', 'Givrin', 'Houblin', 'Lichen', 'Mélilot', 'Noisel', 'Orvet', 'Pistil', 'Ramel', 'Sorbier',
  'Tamaris', 'Velin',
];
const DOUX_F = [
  'Aelia', 'Albane', 'Alwen', 'Amrelle', 'Anwen', 'Ardelia', 'Aubrine', 'Aveline', 'Belia', 'Bellune', 'Bérille', 'Brisane', 'Brumelle',
  'Brisa', 'Caelia', 'Calvina', 'Camrelle', 'Cendrine', 'Cirnelle', 'Dalvine', 'Daryla', 'Delwine', 'Dorielle', 'Dunelle', 'Edrine',
  'Elvia', 'Emrelle', 'Enzella', 'Erwanne', 'Esmée', 'Evrine', 'Fabrelle', 'Falène', 'Ferline', 'Fiorella', 'Florine', 'Galvine',
  'Gaspelle', 'Gorwenne', 'Hadrelle', 'Haline', 'Hélia', 'Hobrine', 'Ilvane', 'Isaëlle', 'Ivrelle', 'Jasselle', 'Javine', 'Jorenne',
  'Kalva', 'Kerrine', 'Kirielle', 'Lanvelle', 'Laurine', 'Lenna', 'Lirelle', 'Loda', 'Lorise', 'Luvelle', 'Maelora', 'Mavelle', 'Mirla',
  'Moussine', 'Nalia', 'Nebelle', 'Nila', 'Norielle', 'Nuva', 'Obrelle', 'Olwine', 'Ombelle', 'Orlia', 'Palvine', 'Pélia', 'Pelline',
  'Perline', 'Pimrelle', 'Quilla', 'Quirine', 'Rafelle', 'Raline', 'Renva', 'Rila', 'Riva', 'Robelle', 'Romelle', 'Salvine', 'Savelle',
  'Sélia', 'Sirelle', 'Solène', 'Sorva', 'Tarvelle', 'Télia', 'Tilla', 'Tilvane', 'Tobrelle', 'Torvelle', 'Ulrine', 'Umbelle', 'Valia',
  'Varine', 'Wistane', 'Yanelle', 'Yorelle', 'Zalva', 'Zénia', 'Zila', 'Aubépine', 'Brunelle', 'Célandine', 'Duvelle', 'Églantine',
  'Frimousse', 'Givrine', 'Houbline', 'Liane', 'Mélisse', 'Noisette', 'Orvette', 'Pistille', 'Ramée', 'Sorbelle', 'Tamarise', 'Véline',
];

/** Noms qu'un écho ne porte jamais : ceux des personnages du jeu. */
const RESERVES = new Set(['ash', 'bourbella', 'finn', 'garry', 'glamp', 'grimp', 'hevann', 'hibert', 'jumpy', 'karla', 'roger', 'maiko', 'maïko', 'morthen', 'myhra', 'nyxara', 'phil', 'tourby', 'vinland']);

const unique = (l: string[]) => [...new Set(l)].filter((n) => !RESERVES.has(cle(n)));
/** Clé de comparaison : sans majuscule ni accent. */
export const cle = (n: string) => n.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export const NOMS_ECHOS_M: readonly string[] = unique([...PROTOTYPE_M, ...DOUX_M]);
export const NOMS_ECHOS_F: readonly string[] = unique([...PROTOTYPE_F, ...DOUX_F]);

/**
 * Un prénom au hasard pour un écho de ce genre, en évitant ceux de `pris` (comparaison sans casse ni accent).
 * Si tous étaient pris (impossible en pratique : plus de 300 prénoms), un prénom quelconque.
 */
export function tirerNom(genre: Genre, rng: Aleatoire, pris: Iterable<string> = []): string {
  const liste = genre === 'f' ? NOMS_ECHOS_F : NOMS_ECHOS_M;
  const exclus = new Set([...pris].filter(Boolean).map(cle));
  const libres = liste.filter((n) => !exclus.has(cle(n)));
  const l = libres.length ? libres : liste;
  return l[Math.floor(rng() * l.length)];
}

/** Les noms déjà portés dans une partie : l'écho du joueur et les échos sauvages qu'il connaît. */
export const nomsPris = (e: Pick<Etat, 'nom' | 'echosSauvages'> | null | undefined): string[] =>
  e ? [e.nom, ...(e.echosSauvages ?? []).map((s) => s.nom)] : [];
