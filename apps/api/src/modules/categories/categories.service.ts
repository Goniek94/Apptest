import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type Node = { name: string; slug: string; children?: Node[] };

/** Taksonomia kategorii (parent → podkategorie), w stylu Vinted. Kolejność = pozycja na liście. */
const TAXONOMY: Node[] = [
  {
    name: 'Odzież damska', slug: 'odziez-damska',
    children: [
      { name: 'Sukienki', slug: 'odziez-damska-sukienki', children: [
        { name: 'Mini', slug: 'odziez-damska-sukienki-mini' },
        { name: 'Midi', slug: 'odziez-damska-sukienki-midi' },
        { name: 'Maxi', slug: 'odziez-damska-sukienki-maxi' },
        { name: 'Koktajlowe', slug: 'odziez-damska-sukienki-koktajlowe' },
        { name: 'Letnie', slug: 'odziez-damska-sukienki-letnie' },
        { name: 'Wieczorowe', slug: 'odziez-damska-sukienki-wieczorowe' },
      ] },
      { name: 'Spódnice', slug: 'odziez-damska-spodnice', children: [
        { name: 'Mini', slug: 'odziez-damska-spodnice-mini' },
        { name: 'Midi', slug: 'odziez-damska-spodnice-midi' },
        { name: 'Maxi', slug: 'odziez-damska-spodnice-maxi' },
        { name: 'Ołówkowe', slug: 'odziez-damska-spodnice-olowkowe' },
        { name: 'Plisowane', slug: 'odziez-damska-spodnice-plisowane' },
        { name: 'Jeansowe', slug: 'odziez-damska-spodnice-jeansowe' },
      ] },
      { name: 'T-shirty i topy', slug: 'odziez-damska-tshirty' },
      { name: 'Bluzki i koszule', slug: 'odziez-damska-bluzki' },
      { name: 'Bluzy', slug: 'odziez-damska-bluzy', children: [
        { name: 'Z kapturem', slug: 'odziez-damska-bluzy-kaptur' },
        { name: 'Bez kaptura', slug: 'odziez-damska-bluzy-bez-kaptura' },
        { name: 'Rozpinane', slug: 'odziez-damska-bluzy-rozpinane' },
      ] },
      { name: 'Swetry i kardigany', slug: 'odziez-damska-swetry', children: [
        { name: 'Swetry', slug: 'odziez-damska-swetry-swetry' },
        { name: 'Kardigany', slug: 'odziez-damska-swetry-kardigany' },
        { name: 'Golfy', slug: 'odziez-damska-swetry-golfy' },
      ] },
      { name: 'Marynarki i żakiety', slug: 'odziez-damska-marynarki' },
      { name: 'Kurtki i płaszcze', slug: 'odziez-damska-kurtki', children: [
        { name: 'Kurtki przejściowe', slug: 'odziez-damska-kurtki-przejsciowe' },
        { name: 'Kurtki zimowe', slug: 'odziez-damska-kurtki-zimowe' },
        { name: 'Płaszcze', slug: 'odziez-damska-kurtki-plaszcze' },
        { name: 'Kurtki jeansowe', slug: 'odziez-damska-kurtki-jeansowe' },
        { name: 'Ramoneski', slug: 'odziez-damska-kurtki-ramoneski' },
        { name: 'Pikowane', slug: 'odziez-damska-kurtki-pikowane' },
        { name: 'Parki', slug: 'odziez-damska-kurtki-parki' },
      ] },
      { name: 'Spodnie', slug: 'odziez-damska-spodnie', children: [
        { name: 'Eleganckie', slug: 'odziez-damska-spodnie-eleganckie' },
        { name: 'Dresowe', slug: 'odziez-damska-spodnie-dresowe' },
        { name: 'Cygaretki', slug: 'odziez-damska-spodnie-cygaretki' },
        { name: 'Cargo', slug: 'odziez-damska-spodnie-cargo' },
        { name: 'Szerokie', slug: 'odziez-damska-spodnie-szerokie' },
      ] },
      { name: 'Jeansy', slug: 'odziez-damska-jeansy', children: [
        { name: 'Skinny', slug: 'odziez-damska-jeansy-skinny' },
        { name: 'Mom', slug: 'odziez-damska-jeansy-mom' },
        { name: 'Straight', slug: 'odziez-damska-jeansy-straight' },
        { name: 'Boyfriend', slug: 'odziez-damska-jeansy-boyfriend' },
        { name: 'Flare / Dzwony', slug: 'odziez-damska-jeansy-flare' },
      ] },
      { name: 'Szorty', slug: 'odziez-damska-szorty' },
      { name: 'Legginsy', slug: 'odziez-damska-legginsy' },
      { name: 'Kombinezony', slug: 'odziez-damska-kombinezony' },
      { name: 'Dresy i odzież sportowa', slug: 'odziez-damska-sport' },
      { name: 'Bielizna', slug: 'odziez-damska-bielizna' },
      { name: 'Stroje kąpielowe', slug: 'odziez-damska-kapielowe' },
      { name: 'Piżamy i odzież domowa', slug: 'odziez-damska-pizamy' },
    ],
  },
  {
    name: 'Odzież męska', slug: 'odziez-meska',
    children: [
      { name: 'T-shirty', slug: 'odziez-meska-tshirty', children: [
        { name: 'Gładkie', slug: 'odziez-meska-tshirty-gladkie' },
        { name: 'Z nadrukiem', slug: 'odziez-meska-tshirty-nadruk' },
        { name: 'W paski', slug: 'odziez-meska-tshirty-paski' },
      ] },
      { name: 'Koszulki sportowe', slug: 'odziez-meska-koszulki-sportowe' },
      { name: 'Koszule', slug: 'odziez-meska-koszule', children: [
        { name: 'Gładkie', slug: 'odziez-meska-koszule-gladkie' },
        { name: 'W kratę', slug: 'odziez-meska-koszule-krata' },
        { name: 'W paski', slug: 'odziez-meska-koszule-paski' },
        { name: 'Jeansowe', slug: 'odziez-meska-koszule-jeansowe' },
        { name: 'Lniane', slug: 'odziez-meska-koszule-lniane' },
      ] },
      { name: 'Koszulki polo', slug: 'odziez-meska-polo' },
      { name: 'Bluzy', slug: 'odziez-meska-bluzy', children: [
        { name: 'Z kapturem', slug: 'odziez-meska-bluzy-kaptur' },
        { name: 'Bez kaptura', slug: 'odziez-meska-bluzy-bez-kaptura' },
        { name: 'Rozpinane', slug: 'odziez-meska-bluzy-rozpinane' },
      ] },
      { name: 'Swetry i kardigany', slug: 'odziez-meska-swetry', children: [
        { name: 'Swetry', slug: 'odziez-meska-swetry-swetry' },
        { name: 'Kardigany', slug: 'odziez-meska-swetry-kardigany' },
        { name: 'Golfy', slug: 'odziez-meska-swetry-golfy' },
      ] },
      { name: 'Kurtki i płaszcze', slug: 'odziez-meska-kurtki', children: [
        { name: 'Kurtki przejściowe', slug: 'odziez-meska-kurtki-przejsciowe' },
        { name: 'Kurtki zimowe', slug: 'odziez-meska-kurtki-zimowe' },
        { name: 'Płaszcze', slug: 'odziez-meska-kurtki-plaszcze' },
        { name: 'Kurtki jeansowe', slug: 'odziez-meska-kurtki-jeansowe' },
        { name: 'Kurtki skórzane', slug: 'odziez-meska-kurtki-skorzane' },
        { name: 'Pikowane', slug: 'odziez-meska-kurtki-pikowane' },
        { name: 'Parki', slug: 'odziez-meska-kurtki-parki' },
        { name: 'Bomberki', slug: 'odziez-meska-kurtki-bomberki' },
      ] },
      { name: 'Marynarki', slug: 'odziez-meska-marynarki' },
      { name: 'Garnitury', slug: 'odziez-meska-garnitury' },
      { name: 'Spodnie', slug: 'odziez-meska-spodnie', children: [
        { name: 'Chinosy', slug: 'odziez-meska-spodnie-chinosy' },
        { name: 'Dresowe', slug: 'odziez-meska-spodnie-dresowe' },
        { name: 'Eleganckie', slug: 'odziez-meska-spodnie-eleganckie' },
        { name: 'Cargo / Bojówki', slug: 'odziez-meska-spodnie-cargo' },
        { name: 'Joggery', slug: 'odziez-meska-spodnie-joggery' },
      ] },
      { name: 'Jeansy', slug: 'odziez-meska-jeansy', children: [
        { name: 'Slim', slug: 'odziez-meska-jeansy-slim' },
        { name: 'Regular', slug: 'odziez-meska-jeansy-regular' },
        { name: 'Skinny', slug: 'odziez-meska-jeansy-skinny' },
        { name: 'Straight', slug: 'odziez-meska-jeansy-straight' },
        { name: 'Loose', slug: 'odziez-meska-jeansy-loose' },
      ] },
      { name: 'Szorty', slug: 'odziez-meska-szorty' },
      { name: 'Dresy i odzież sportowa', slug: 'odziez-meska-sport' },
      { name: 'Bielizna', slug: 'odziez-meska-bielizna' },
      { name: 'Stroje kąpielowe', slug: 'odziez-meska-kapielowe' },
      { name: 'Piżamy', slug: 'odziez-meska-pizamy' },
    ],
  },
  {
    name: 'Odzież dziecięca', slug: 'odziez-dziecieca',
    children: [
      { name: 'Body i pajacyki', slug: 'odziez-dziecieca-body' },
      { name: 'T-shirty i koszulki', slug: 'odziez-dziecieca-koszulki' },
      { name: 'Bluzy', slug: 'odziez-dziecieca-bluzy' },
      { name: 'Swetry', slug: 'odziez-dziecieca-swetry' },
      { name: 'Sukienki', slug: 'odziez-dziecieca-sukienki' },
      { name: 'Spódnice', slug: 'odziez-dziecieca-spodnice' },
      { name: 'Spodnie', slug: 'odziez-dziecieca-spodnie' },
      { name: 'Jeansy', slug: 'odziez-dziecieca-jeansy' },
      { name: 'Szorty', slug: 'odziez-dziecieca-szorty' },
      { name: 'Kurtki', slug: 'odziez-dziecieca-kurtki' },
      { name: 'Dresy', slug: 'odziez-dziecieca-dresy' },
      { name: 'Komplety', slug: 'odziez-dziecieca-komplety' },
      { name: 'Piżamy', slug: 'odziez-dziecieca-pizamy' },
    ],
  },
  {
    name: 'Obuwie', slug: 'obuwie',
    children: [
      { name: 'Sneakersy', slug: 'obuwie-sneakersy' },
      { name: 'Buty sportowe', slug: 'obuwie-sportowe' },
      { name: 'Botki', slug: 'obuwie-botki' },
      { name: 'Kozaki', slug: 'obuwie-kozaki' },
      { name: 'Trzewiki', slug: 'obuwie-trzewiki' },
      { name: 'Sandały', slug: 'obuwie-sandaly' },
      { name: 'Klapki', slug: 'obuwie-klapki' },
      { name: 'Szpilki', slug: 'obuwie-szpilki' },
      { name: 'Czółenka', slug: 'obuwie-czolenka' },
      { name: 'Baleriny', slug: 'obuwie-baleriny' },
      { name: 'Mokasyny', slug: 'obuwie-mokasyny' },
      { name: 'Espadryle', slug: 'obuwie-espadryle' },
      { name: 'Kapcie', slug: 'obuwie-kapcie' },
    ],
  },
  {
    name: 'Torebki', slug: 'torebki',
    children: [
      { name: 'Na ramię', slug: 'torebki-na-ramie' },
      { name: 'Listonoszki', slug: 'torebki-listonoszki' },
      { name: 'Shopperki', slug: 'torebki-shopperki' },
      { name: 'Kopertówki', slug: 'torebki-kopertowki' },
      { name: 'Nerki', slug: 'torebki-nerki' },
      { name: 'Plecaki', slug: 'torebki-plecaki' },
      { name: 'Torby podróżne', slug: 'torebki-podrozne' },
      { name: 'Worki', slug: 'torebki-worki' },
    ],
  },
  {
    name: 'Akcesoria', slug: 'akcesoria',
    children: [
      { name: 'Paski', slug: 'akcesoria-paski' },
      { name: 'Czapki i kapelusze', slug: 'akcesoria-czapki' },
      { name: 'Szaliki i chusty', slug: 'akcesoria-szaliki' },
      { name: 'Rękawiczki', slug: 'akcesoria-rekawiczki' },
      { name: 'Okulary przeciwsłoneczne', slug: 'akcesoria-okulary' },
      { name: 'Portfele', slug: 'akcesoria-portfele' },
      { name: 'Krawaty i muszki', slug: 'akcesoria-krawaty' },
      { name: 'Parasole', slug: 'akcesoria-parasole' },
      { name: 'Etui i pokrowce', slug: 'akcesoria-etui' },
    ],
  },
  {
    name: 'Biżuteria', slug: 'bizuteria',
    children: [
      { name: 'Naszyjniki', slug: 'bizuteria-naszyjniki' },
      { name: 'Bransoletki', slug: 'bizuteria-bransoletki' },
      { name: 'Kolczyki', slug: 'bizuteria-kolczyki' },
      { name: 'Pierścionki', slug: 'bizuteria-pierscionki' },
      { name: 'Zegarki', slug: 'bizuteria-zegarki' },
      { name: 'Broszki', slug: 'bizuteria-broszki' },
      { name: 'Komplety', slug: 'bizuteria-komplety' },
    ],
  },
];

export type CategoryTreeNode = Category & { children?: CategoryTreeNode[] };

@Injectable()
export class CategoriesService implements OnModuleInit {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Przy starcie zapewniamy istnienie kategorii (idempotentnie, rekurencyjnie — do 3 poziomów). */
  async onModuleInit(): Promise<void> {
    await this.upsertNodes(TAXONOMY, null);

    // Sprzątanie: usuń kategorie spoza aktualnej taksonomii bez ogłoszeń i bez podkategorii
    // (pozostałości po zmianie nazwy/slug). Te z ogłoszeniami zostawiamy bezpiecznie.
    const validSlugs = new Set<string>();
    const collect = (nodes: Node[]) => nodes.forEach((n) => { validSlugs.add(n.slug); if (n.children) collect(n.children); });
    collect(TAXONOMY);

    const orphans = await this.prisma.category.findMany({
      where: { slug: { notIn: [...validSlugs] } },
      include: { _count: { select: { listings: true, children: true } } },
    });
    for (const o of orphans) {
      if (o._count.listings === 0 && o._count.children === 0) {
        await this.prisma.category.delete({ where: { id: o.id } }).catch(() => undefined);
      }
    }

    this.logger.log('Kategorie i podkategorie zsynchronizowane.');
  }

  /** Rekurencyjny upsert węzłów taksonomii z zachowaniem kolejności. */
  private async upsertNodes(nodes: Node[], parentId: string | null): Promise<void> {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const cat = await this.prisma.category.upsert({
        where: { slug: n.slug },
        update: { name: n.name, parentId, position: i },
        create: { name: n.name, slug: n.slug, parentId, position: i },
      });
      if (n.children?.length) await this.upsertNodes(n.children, cat.id);
    }
  }

  /** Drzewo: kategorie główne → podkategorie → pod-podkategorie (do 3 poziomów), w kolejności. */
  findTree(): Promise<CategoryTreeNode[]> {
    return this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { position: 'asc' },
      include: {
        children: {
          orderBy: { position: 'asc' },
          include: { children: { orderBy: { position: 'asc' } } },
        },
      },
    }) as unknown as Promise<CategoryTreeNode[]>;
  }

  async getBySlugOrThrow(slug: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({ where: { slug } });
    if (!category) throw new NotFoundException('Nie znaleziono kategorii.');
    return category;
  }
}
