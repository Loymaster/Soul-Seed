// Les astuces du carnet d'éleveur (section « Astuces » du grand carnet du ranch, et du petit carnet ailleurs).
// Des conseils tirés des règles réelles du jeu (simulation, exploration, village, combat), formulés sans jamais
// révéler l'état chiffré de l'écho : on parle de durées, d'heures, de prix, de ce qu'on observe.
// Certaines ne se dévoilent qu'une fois la situation rencontrée (drapeau du monde, stade atteint) : avant, une ligne
// « encore à découvrir… » et une piste. Vérifier chaque phrase contre le code quand une règle change.
import type { Etat } from '@/moteur/simulation';
import type { Monde } from '@/moteur/monde';
import { IC } from '../ranch/icones';

/** Ce qu'il faut savoir pour dévoiler une astuce : l'écho, et le monde de la partie s'il est connu. */
export interface ContexteAstuces {
  e: Etat;
  m?: Pick<Monde, 'drapeaux' | 'corvees'> | null;
}

export interface Astuce {
  texte: string;
  /** Absent : toujours lisible. Sinon, l'astuce reste « à découvrir » tant que la condition est fausse. */
  quand?: (c: ContexteAstuces) => boolean;
  /** Piste donnée tant qu'elle reste à découvrir (« au sanctuaire »…). */
  piste?: string;
}

export interface ThemeAstuces {
  k: string;
  nom: string;
  /** Tracé SVG 24 × 24 (au trait). */
  icone: string;
  /** Une phrase d'éleveur, écrite à la main au bas de la page. */
  mot: string;
  astuces: Astuce[];
}

const drapeau = (cle: string) => (c: ContexteAstuces) => !!c.m?.drapeaux?.[cle];
const aGrandi = (c: ContexteAstuces) => c.e.stade === 'adolescent' || c.e.stade === 'adulte';
const corveesOuvertes = (c: ContexteAstuces) => Object.values(c.m?.corvees ?? {}).some((n) => (n ?? 0) > 0);

const VILLAGE = 'M3 20h18M5 20v-8l7-6 7 6v8M10 20v-5h4v5';
const BOUSSOLE = 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17zM15.5 8.5l-2 5-5 2 2-5z';
const EPEE = 'M14.5 3.5H20.5V9.5L10 20l-2-2zM6 14l4 4M4 20l2.5-2.5M13 8l3 3';
/** Icône de l'onglet « Astuces » : une ampoule de lanterne. */
export const ICONE_ASTUCES = 'M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2V17h5v-1c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3zM9.8 20h4.4M10.8 22h2.4M12 7v3';

export const THEMES_ASTUCES: ThemeAstuces[] = [
  {
    k: 'soins', nom: 'Prendre soin de lui', icone: IC.soins,
    mot: 'Un ventre plein, un pelage propre, une bonne nuit : le reste suit.',
    astuces: [
      { texte: 'Nourrir ne prend pas de temps, mais n’en abusez pas : attendez qu’il lorgne votre sacoche ou que son ventre gargouille : un écho déjà repu mange du bout des lèvres, refuse souvent, et ce repas de trop le contrarie.' },
      { texte: 'Chaque écho est carnivore, végétarien ou omnivore. Un plat contraire à son régime est souvent refusé, et avalé en grimaçant quand il passe. Les carnivores ne crachent pas sur les sucreries.' },
      { texte: 'Son plat préféré et sa saveur favorite le mettent en joie ; le plat qu’il déteste le met de mauvaise humeur. Jumpy, à la boutique, finit toujours par les deviner.' },
      { texte: 'S’il refuse un plat, vous pouvez insister : il mangera le suivant sans broncher, mais la mine triste. Respecter son refus le rend un peu plus autonome.' },
      { texte: 'Le ventre vide, il s’affaiblit d’heure en heure : un écho peut mourir de faim. Rassasié et sans blessure, il se refait peu à peu une santé.' },
      { texte: 'On ne peut le coucher que lorsqu’il bâille ; il dort alors jusqu’à être reposé. S’il va jusqu’au bout de ses forces, il s’écroule où il se trouve, d’une humeur massacrante.' },
      { texte: 'Chaque écho a son rythme : matinal, diurne, du soir ou nocturne. En dehors de ses heures, il se fatigue deux fois plus vite. Jumpy sait le reconnaître.' },
      { texte: 'Le brosser (1 h) l’apaise et resserre votre lien, mais ne remplace pas un bain (2 h). Sale, il se morfond plus vite et tombe plus facilement malade.' },
      { texte: 'Après un repas, il finit tôt ou tard par faire ses besoins, et se salit un peu au passage. Ramassez d’un clic, ou « Tout balayer » depuis l’onglet Ranch ; quand le ranch déborde, il va se soulager… chez le voisin.' },
      { texte: 'La maladie guette l’écho sale, blessé ou rongé d’angoisse. Malade, il refuse un repas sur deux, ne peut ni s’entraîner ni faire de corvée, et s’affaiblit de plus en plus vite.' },
      { texte: 'Un médicament (25 or, quand Jumpy en a en rayon) le guérit sur-le-champ, le remet d’aplomb et le protège de la maladie pendant un jour et demi. Seul, un écho robuste et choyé guérit parfois de lui-même.' },
      { texte: 'Un pansement (10 or) referme une blessure. Livrée à elle-même, elle finit par guérir — plus vite chez un écho âgé — mais sa santé s’use en attendant.' },
      { texte: '« Laisser le temps passer » fait filer les heures, mais il s’ennuie : la colère, le dégoût et la tristesse montent.' },
    ],
  },
  {
    k: 'lien', nom: 'Le lien et l’éducation', icone: IC.caliner,
    mot: 'Il ne retient pas ce que vous dites, mais comment vous le dites.',
    astuces: [
      { texte: 'Il accepte une dizaine de caresses par jour, puis n’en veut plus. La première de la journée est celle qui compte le plus.' },
      { texte: 'Câlin, jeux, discussion, partage, éducation : chaque genre de moment se partage une fois par jour et dure une heure. Variez-les.' },
      { texte: 'Chaque écho a son moment préféré — câlins, discussion, jeux ou partage — dont il retire un peu plus de bonheur et d’affection.' },
      { texte: 'S’il vous suit du regard, puis vient se coller à vous, il manque de tendresse. Laissé à lui-même, ce manque tourne à l’angoisse ; les échos anxieux en réclament plus souvent.' },
      { texte: 'Quand il a « quelque chose à vous montrer », il attend votre réaction quelques heures, puis passe à autre chose.' },
      { texte: 'Dans le carnet d’événement, féliciter une bêtise l’encourage à recommencer ; gronder une réussite décourage sa volonté de bien faire.' },
      { texte: 'Ne rien dire le rend plus autonome. Un écho autonome se débrouille parfois seul : il trouve à manger, fait une sieste, se lave ou se calme sans vous.' },
      { texte: 'Quand il vous offre une trouvaille, elle rejoint votre sac quoi que vous répondiez, s’il reste de la place ; un merci resserre votre lien, une critique l’abîme.' },
      { texte: 'Ses élans spontanés naissent de ses traits : plus un trait est marqué, plus il s’exprime. L’onglet Tempérament de sa fiche aide à deviner ce qu’il va faire.' },
    ],
  },
  {
    k: 'grandir', nom: 'Grandir et évoluer', icone: IC.memoire,
    mot: 'Chaque geste du quotidien laisse une trace dans la forme qu’il prendra.',
    astuces: [
      { texte: 'Bébé, il devient enfant à partir de son 2ᵉ jour, adolescent à partir du 6ᵉ, adulte à partir du 12ᵉ — toujours l’après-midi, à une heure qui lui est propre.' },
      { texte: 'Un écho vit vingt jours : le vingtième, à midi, il s’en va, et son souvenir rejoint la mémoire des échos.' },
      { texte: 'Grandir le remet d’aplomb : rassasié, reposé, propre, guéri de ses maux, et nettement plus fort.' },
      { texte: 'Chaque entraînement nourrit une émotion : Tenir en équilibre la joie, Soulever des pierres la colère, Sauter sur place le dégoût, Méditer la peur, Résoudre des problèmes la tristesse. Courir n’en nourrit aucune.' },
      { texte: 'Les corvées réussies nourrissent la joie, les ratées la tristesse, les désastres la colère. Les combats, eux, nourrissent la colère et la peur.' },
      { texte: 'Chaque graine a son émotion : solaire, la joie ; tellurique, la colère ; caustique, le dégoût ; boréale, la tristesse ; spectrale, la peur. Si l’émotion la plus cultivée est celle de sa graine, il grandit dans sa lignée ; sinon, il peut bifurquer vers une branche.' },
      { texte: 'Équilibrez le corps (entraînements physiques, combats), l’esprit (méditer, résoudre des problèmes, corvées) et le cœur (caresses, brossage, ce que vous lui dites) : un écho qui ne cultive presque qu’un seul des trois devient « fragmenté »… et ne sera jamais adulte.' },
      { texte: 'Pour devenir adulte, l’adolescent doit rester fidèle à ce qui l’a formé : l’émotion de sa graine en tête ou, pour une branche, ses deux émotions devant toutes les autres. Sinon, il reste adolescent jusqu’à ce que l’équilibre revienne.', quand: aGrandi, piste: 'à l’adolescence' },
      { texte: 'Trois émotions presque à parts égales, dont celle de sa graine, peuvent donner une forme adulte « mêlée ».', quand: aGrandi, piste: 'à l’adolescence' },
      { texte: 'La lignée d’un écho, et donc sa forme sombre, se décide à l’éclosion : rien de ce que vous ferez ne la changera. Aimez-le tel qu’il est.' },
      { texte: 'C’est adolescent qu’il tire le plus de ses entraînements ; bébé, il n’en retient encore que peu. De bonne humeur, il progresse mieux.' },
      { texte: 'Les entraînements liés à ses tempéraments innés lui profitent davantage : l’équilibre à la curiosité, les pierres à la résolution, le saut au discernement, la méditation à l’anticipation, les problèmes à l’observation.' },
      { texte: 'Une corvée réussit d’autant mieux que le trait qu’elle demande est marqué, et que l’écho en a l’habitude. Un mot après la corvée (le féliciter, ou l’encourager s’il a échoué) compte comme une leçon de plus.', quand: corveesOuvertes, piste: 'quand une corvée sera praticable' },
      { texte: 'Chaque corvée ne se fait qu’une fois par jour. Plus Ash a remis son matériel en état, plus elle compte d’essais et plus l’écho y progresse (le rangement, lui, compte toujours huit objets). Réparer la barrière pardonne davantage, mais une pièce mal posée en déplace d’autres.', quand: drapeau('ash.recrute'), piste: 'quelqu’un sait réparer' },
    ],
  },
  {
    k: 'visiteurs', nom: 'Les échos de passage', icone: IC.relations,
    mot: 'Qui se ressemble s’assemble… le plus souvent.',
    astuces: [
      { texte: 'Un écho sauvage vient parfois passer quelques heures au ranch, et ceux qu’on connaît reviennent de temps en temps. Vos liens avec eux se lisent dans le carnet, page Relations.' },
      { texte: 'Les échos sauvages grandissent eux aussi, jour après jour : le bébé d’hier revient enfant, puis adolescent. Au bout de vingt jours, comme le vôtre, ils ne reviennent plus.', quand: (c) => c.e.echosSauvages.length >= 1, piste: 'après une première visite' },
      { texte: 'Plus deux échos se ressemblent de caractère, mieux ils s’entendent. Passer du temps ensemble fait parfois naître un signe d’inspiration qui les rapproche encore.' },
      { texte: 'Pendant une visite, les deux échos font parfois quelque chose ensemble d’eux-mêmes : un jeu, un partage, une dispute…' },
      { texte: 'Se bagarrer avec un visiteur peut blesser votre écho. L’affronter en combat, en revanche, n’est qu’un entraînement : il n’en garde aucune blessure.' },
      { texte: 'Un appât à écho (45 or) attire un écho sauvage au ranch ; ceux qui apprécient le vôtre reviennent plus volontiers.' },
      { texte: 'Passé une dizaine d’échos connus, plus aucun inconnu ne vient de lui-même : seuls les habitués reviennent.', quand: (c) => c.e.echosSauvages.length >= 3, piste: 'après quelques visites' },
    ],
  },
  {
    k: 'explorer', nom: 'Explorer', icone: BOUSSOLE,
    mot: 'Le sentier récompense les patients et punit les pressés.',
    astuces: [
      { texte: 'Récolter (une demi-heure) ne dérange aucun écho : bois, fibres et résine en forêt et au bord de l’eau, pierre un peu partout, ferraille dans la montagne et les cavernes, cristaux seulement près du crystal en fusion.' },
      { texte: 'Le sac ne porte pas plus de cinq unités de chaque matériau : au-delà, ce que vous récoltez reste par terre.' },
      { texte: 'Fouiller ouvre cinq cachettes : arrêtez-vous quand vous voulez pour garder vos trouvailles. Un écho caché peut jaillir et les disperser — gagnez le combat pour les récupérer.' },
      { texte: 'Fouiller, récolter, envoyer l’écho : chaque lieu ne s’y prête qu’une fois par jour. Mieux vaut pousser plus loin que tourner en rond.' },
      { texte: 'Envoyé fouiner (vingt minutes), un écho curieux rapporte plus souvent, et des choses plus rares ; un fonceur revient plus souvent… avec un écho sauvage aux trousses. Blessé, malade ou à bout de forces, il refuse de s’éloigner.' },
      { texte: 'La nuit, dehors, les échos sauvages rôdent davantage ; au fond des cavernes, jour et nuit se valent.' },
      { texte: 'Là où l’on vient de croiser un écho, les environs restent plus calmes pendant près d’une journée.' },
      { texte: 'Une repousse (30 or) tient les échos à distance une demi-journée : moitié moins de rencontres, et des cachettes plus souvent sans surprise.' },
      { texte: 'La tente (60 or) ne s’use pas : plantée n’importe où, elle permet de le nourrir, le laver, le soigner, et de le faire dormir quand il bâille. Sans elle, pas de repas en chemin.' },
      { texte: 'Avec une canne à pêche (60 or), là où il y a de l’eau : attendez que ça morde pour ferrer, trop tôt les poissons filent. Ils se mangent crus… sauf par un végétarien.' },
      { texte: 'Plus on s’éloigne du village, plus les échos sauvages sont âgés : les falaises et les tréfonds sont pour les échos aguerris. S’il tremble ou se plaque contre vos jambes, l’adversaire est d’une autre trempe.' },
      { texte: 'S’éclipser réussit plus souvent avec un écho prudent, moins face à un adversaire bien plus fort ; si l’on vous coupe la route, il faut se battre.' },
    ],
  },
  {
    k: 'combat', nom: 'Combattre', icone: EPEE,
    mot: 'Un écho aimé se bat pour deux.',
    astuces: [
      { texte: 'Chaque combat, gagné ou perdu, le fait progresser un peu en tout ; une victoire davantage, et elle rapporte de l’or — d’autant plus que l’adversaire est âgé, sombre ou d’une branche.' },
      { texte: 'La robustesse fait sa vigueur, l’agilité la vitesse à laquelle il passe à l’action. Ses progrès se lisent dans l’onglet Combat de sa fiche.' },
      { texte: 'Malade, il ne se bat plus qu’avec une fraction de ses forces : soignez-le avant de chercher la bagarre.' },
      { texte: 'Un écho aimé et de bonne humeur se bat mieux. La colère frappe fort mais vise mal ; la peur rend plus vif, mais moins puissant.' },
      { texte: '« Encourager » est toujours possible ; « Attaque ! », « Recule ! », « Défends-toi ! », « Reste à distance ! » puis le choix des techniques viennent à mesure qu’il gagne en intelligence.' },
      { texte: 'Il apprend ses techniques à mesure qu’il devient plus intelligent — Résoudre des problèmes y aide — et en garde trois en tête. Bébé, il n’en retient aucune.' },
      { texte: 'Plus il est autonome, plus il ose ses techniques de lui-même.' },
      { texte: 'Fuir un combat réussit bien plus souvent s’il est plus agile que l’adversaire ; entre deux tentatives, il faut patienter.' },
      { texte: 'Graines de vie, feuilles de vie et autres remèdes se donnent en plein combat ; il faut laisser passer un moment entre deux soins.' },
      { texte: 'Une défaite peut le blesser, et le laisse à bout de forces : plus question de se battre — une rencontre ne laisse que s’éclipser — jusqu’à un somme au ranch ou sous la tente, ou jusqu’à ce qu’on lui applique les premiers soins.' },
      { texte: 'Au ranch, « Appliquer les premiers soins » lui rend ses forces de combat : une demi-heure par dixième de forces perdu, au plus le temps qu’il faut pour tout refermer. Le pansement du sac, lui, sert aux blessures.' },
      { texte: 'Contre Garry, ou contre Phil et Hibert, une défaite blesse plus souvent, mais la victoire rapporte bien plus d’or.' },
      { texte: 'À la boutique, Jumpy accepte un combat autant de fois que vous le voulez — mais c’est un adversaire coriace.' },
    ],
  },
  {
    k: 'village', nom: 'Le village', icone: VILLAGE,
    mot: 'Chaque habitant qui revient rend le village un peu plus vivant.',
    astuces: [
      { texte: 'La boutique de Jumpy ouvre de 8 h à 20 h. Son étal change chaque jour — guettez le « deux pour le prix d’un » ; la tente et la canne à pêche sont toujours en rayon.' },
      { texte: '« En apprendre plus » sur votre écho auprès de Jumpy : un secret par jour — son régime, sa saveur favorite, son plat préféré ou détesté, son rythme, sa santé…' },
      { texte: 'Besoin d’or ? Jumpy vous embauche à la boutique, entre 8 h et 18 h, une fois par jour : quatre heures pendant lesquelles il veille sur votre écho — pas s’il est malade.' },
      { texte: 'Tant que Garry rôde, des bruits étranges effraient votre écho au ranch ; une fois Garry vaincu, le calme revient.' },
      { texte: 'Le coffre de Maïko garde vos objets, et les matériaux que vous y déposez : Ash y puise directement pour ses travaux.', quand: drapeau('maiko.recrute'), piste: 'un petit écho affamé, en forêt' },
      { texte: 'Ash mène un chantier à la fois, et en même temps une réparation au ranch. La première remise en état rend une corvée praticable ; deux améliorations la rendent plus profitable.', quand: drapeau('ash.recrute'), piste: 'vers la montagne, en journée' },
      { texte: 'Une fois par jour, Myhra rassure votre écho au sanctuaire : elle l’apaise et lui rend des forces, de quoi se battre de nouveau. S’il est au bord de la panique, elle le guérit même de ses maux.', quand: drapeau('myhra.vue'), piste: 'au sanctuaire' },
      { texte: 'Chaque habitant qui rejoint le village le rend plus prospère ; Myhra vous dira où vous en êtes.', quand: drapeau('myhra.vue'), piste: 'au sanctuaire' },
      { texte: 'Tous les deux jours, Hevann peut motiver votre écho au sanctuaire : ses entraînements portent bien davantage pendant quelques heures. Enchaînez-les !', quand: drapeau('hevann.vaincu'), piste: 'un gardien, sur le chemin de forêt' },
      { texte: 'Bourbella échange une anguille contre de la gélatine : pendant une journée, le poisson garde l’appât plus longtemps et se décroche moins.', quand: drapeau('bourbella.recrutee'), piste: 'une pêcheuse, devant une cabane' },
      { texte: 'Le potager de Tourby donne chaque jour deux nodules nutritifs, un mets que tous les régimes acceptent.', quand: drapeau('tourby.recrute'), piste: 'au bord de la rivière, le soir' },
      { texte: 'Lady Roger rachète les curiosités et les petites bêtes que vous rapportez d’exploration — et rien d’autre.', quand: drapeau('ladyroger.recrutee'), piste: 'une dame, au village' },
    ],
  },
];

/** Une ligne d'une page d'astuces : un conseil, ou une astuce encore à découvrir (avec sa piste). */
export interface LigneAstuce { texte: string; cachee: boolean; piste: string }

/** Espaces insécables de la typographie française (pas de « ; » ni de « : » en début de ligne). */
export const insecables = (t: string) => t.replace(/ ([;:!?»])/g, '\u202f$1').replace(/« /g, '«\u202f');

/** Le contenu d'un thème : les astuces dévoilées d'abord, puis celles à découvrir. */
export function lignesTheme(t: ThemeAstuces, c: ContexteAstuces): LigneAstuce[] {
  const vues: LigneAstuce[] = [], cachees: LigneAstuce[] = [];
  for (const a of t.astuces) {
    if (!a.quand || a.quand(c)) vues.push({ texte: insecables(a.texte), cachee: false, piste: '' });
    else cachees.push({ texte: 'encore à découvrir…', cachee: true, piste: a.piste ?? '' });
  }
  return [...vues, ...cachees];
}

/** Gabarit d'une page : caractères par ligne et lignes disponibles (estimation prudente, sans mesurer le texte). */
export interface GabaritPage { caracteres: number; lignes: number }
/** Le grand carnet du ranch, puis le petit carnet (pages un peu plus étroites). Réglés à l'œil : aucune page ne déborde. */
export const GABARIT_CARNET: GabaritPage = { caracteres: 53, lignes: 19 };
export const GABARIT_PETIT: GabaritPage = { caracteres: 48, lignes: 19 };

const hauteurLigne = (l: LigneAstuce, g: GabaritPage) => (l.cachee ? 1 : Math.ceil(l.texte.length / g.caracteres)) + 0.45;

function decouper(lignes: LigneAstuce[], g: GabaritPage, budget: number): LigneAstuce[][] {
  const pages: LigneAstuce[][] = [];
  let page: LigneAstuce[] = [], hauteur = 0;
  for (const l of lignes) {
    const h = hauteurLigne(l, g);
    if (page.length && hauteur + h > budget) { pages.push(page); page = []; hauteur = 0; }
    page.push(l); hauteur += h;
  }
  if (page.length) pages.push(page);
  return pages;
}

/**
 * Découpe les lignes d'un thème en pages qui tiennent dans le gabarit (au moins une ligne par page),
 * puis les équilibre : même nombre de pages, mais remplies à peu près autant (pas de dernière page presque vide).
 */
export function paginer(lignes: LigneAstuce[], g: GabaritPage = GABARIT_CARNET): LigneAstuce[][] {
  const pages = decouper(lignes, g, g.lignes);
  if (pages.length < 2) return pages.length ? pages : [[]];
  const total = lignes.reduce((t, l) => t + hauteurLigne(l, g), 0);
  for (let budget = Math.ceil(total / pages.length); budget < g.lignes; budget += 0.5) {
    const p = decouper(lignes, g, budget);
    if (p.length === pages.length) return p;
  }
  return pages;
}

/** Combien d'astuces sont dévoilées, sur combien, dans un thème. */
export function compteTheme(t: ThemeAstuces, c: ContexteAstuces) {
  const vues = t.astuces.filter((a) => !a.quand || a.quand(c)).length;
  return { vues, total: t.astuces.length };
}

export const CHIFFRES_ROMAINS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
