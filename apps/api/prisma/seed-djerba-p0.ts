import {
  GuideActionType,
  GuideParentType,
  PaymentMethod,
  PriceLevel,
  PricingType,
  PrismaClient,
  RuleCategory,
  RuleScope,
  RuleSeverity,
  SourceType,
  TransportMode,
  VerificationStatus,
} from '@prisma/client';

const REVIEWED = new Date('2026-07-24T00:00:00.000Z');
/** Phase 07 P1 beta pack (supersedes djerba-fake-v1). */
const PACK = 'djerba-fake-v2';
const LEGACY_PACKS = ['djerba-fake-v1', PACK] as const;
const PHOTO = 'https://placehold.co/800x600/png?text=LocalLife+Djerba';

type CatMap = Record<string, string>;

export async function seedDjerbaP0(
  prisma: PrismaClient,
  opts: {
    countryId: string;
    cityId: string;
    adminUserId: string;
    guideUserId: string;
    cats: CatMap;
  },
) {
  const { countryId, cityId, adminUserId, guideUserId, cats } = opts;

  // Wipe previous fake pack content (idempotent reseed)
  await prisma.guideStep.deleteMany({
    where: {
      OR: [
        { arrivalGuide: { cityId } },
        { howToGuide: { cityId } },
      ],
    },
  });
  await prisma.arrivalGuide.deleteMany({ where: { cityId } });
  await prisma.howToGuide.deleteMany({ where: { cityId } });
  await prisma.transportRoute.deleteMany({
    where: { transportSystem: { cityId } },
  });
  await prisma.transportHub.deleteMany({
    where: { transportSystem: { cityId } },
  });
  await prisma.transportSystem.deleteMany({ where: { cityId } });
  await prisma.localRule.deleteMany({
    where: { OR: [{ cityId }, { countryId }] },
  });
  await prisma.event.deleteMany({ where: { cityId } });
  await prisma.experienceStep.deleteMany({
    where: { experience: { cityId } },
  });
  await prisma.experience.deleteMany({ where: { cityId } });
  await prisma.placePhoto.deleteMany({
    where: {
      place: {
        cityId,
        OR: LEGACY_PACKS.map((p) => ({
          metadata: { path: ['pack'], equals: p },
        })),
      },
    },
  });
  await prisma.placeHour.deleteMany({
    where: {
      place: {
        cityId,
        OR: LEGACY_PACKS.map((p) => ({
          metadata: { path: ['pack'], equals: p },
        })),
      },
    },
  });
  await prisma.place.deleteMany({
    where: {
      cityId,
      OR: LEGACY_PACKS.map((p) => ({
        metadata: { path: ['pack'], equals: p },
      })),
    },
  });

  const placeDefs: Array<{
    slug: string;
    name: string;
    summary: string;
    categoryKey: string;
    lat: number;
    lng: number;
    priceLevel?: PriceLevel;
    addressText?: string;
  }> = [
    {
      slug: 'djerba-zarzis-airport',
      name: 'Djerba–Zarzis Airport (DJE)',
      summary: 'Main island airport — taxis, SIM desks, ATMs near arrivals.',
      categoryKey: 'transport_hubs',
      lat: 33.875,
      lng: 10.7755,
      addressText: 'Mellita, Djerba',
    },
    {
      slug: 'airport-taxi-rank',
      name: 'Airport official taxi rank',
      summary: 'Official taxi queue outside arrivals. Agree fare before boarding.',
      categoryKey: 'transport_hubs',
      lat: 33.8745,
      lng: 10.776,
    },
    {
      slug: 'houmt-souk-louage',
      name: 'Houmt Souk louage station',
      summary: 'Shared taxi hub for island routes and mainland connections.',
      categoryKey: 'transport_hubs',
      lat: 33.8758,
      lng: 10.857,
    },
    {
      slug: 'midoun-taxi-hub',
      name: 'Midoun taxi / louage hub',
      summary: 'Central Midoun pickup point for taxis and shared rides.',
      categoryKey: 'transport_hubs',
      lat: 33.807,
      lng: 11.0,
    },
    {
      slug: 'hopital-houmt-souk',
      name: 'Houmt Souk Regional Hospital',
      summary: 'Main public hospital for emergencies on the island.',
      categoryKey: 'hospitals',
      lat: 33.872,
      lng: 10.86,
    },
    {
      slug: 'clinique-midoun',
      name: 'Clinique Midoun (placeholder)',
      summary: 'Private clinic option near Midoun tourist zone.',
      categoryKey: 'hospitals',
      lat: 33.81,
      lng: 10.995,
    },
    {
      slug: 'pharmacie-centrale-hs',
      name: 'Pharmacie Centrale Houmt Souk',
      summary: 'Central pharmacy; ask for night rota (pharmacie de garde).',
      categoryKey: 'pharmacies',
      lat: 33.8765,
      lng: 10.8585,
    },
    {
      slug: 'pharmacie-midoun',
      name: 'Pharmacie Midoun Centre',
      summary: 'Convenient pharmacy near Midoun shops and hotels.',
      categoryKey: 'pharmacies',
      lat: 33.8085,
      lng: 10.998,
    },
    {
      slug: 'atm-stb-airport',
      name: 'ATM — Airport arrivals',
      summary: 'Cash point in arrivals hall; fees may apply for foreign cards.',
      categoryKey: 'banks',
      lat: 33.8752,
      lng: 10.7758,
    },
    {
      slug: 'atm-biat-houmt-souk',
      name: 'ATM BIAT Houmt Souk',
      summary: 'Reliable town-centre ATM near the medina.',
      categoryKey: 'banks',
      lat: 33.876,
      lng: 10.8575,
    },
    {
      slug: 'plage-sejoumi',
      name: 'Sidi Mahrez Beach',
      summary: 'Popular north-east sandy beach near hotel strip.',
      categoryKey: 'beaches',
      lat: 33.86,
      lng: 11.02,
      priceLevel: PriceLevel.FREE,
    },
    {
      slug: 'plage-ras-errmel',
      name: 'Ras Rmel Beach',
      summary: 'Wide beach west of Houmt Souk; good sunset walks.',
      categoryKey: 'beaches',
      lat: 33.89,
      lng: 10.82,
      priceLevel: PriceLevel.FREE,
    },
    {
      slug: 'plage-aghir',
      name: 'Aghir Beach',
      summary: 'Quieter south-east shore stretch with local cafés nearby.',
      categoryKey: 'beaches',
      lat: 33.75,
      lng: 11.02,
      priceLevel: PriceLevel.FREE,
    },
    {
      slug: 'restaurant-el-houd',
      name: 'Restaurant El Houd (fake)',
      summary: 'Seafood plates and grilled fish — tourist-friendly menus.',
      categoryKey: 'restaurants',
      lat: 33.877,
      lng: 10.859,
      priceLevel: PriceLevel.MODERATE,
    },
    {
      slug: 'restaurant-midoun-grill',
      name: 'Midoun Grill House (fake)',
      summary: 'Grills, salads, and family portions near Midoun centre.',
      categoryKey: 'restaurants',
      lat: 33.809,
      lng: 10.997,
      priceLevel: PriceLevel.BUDGET,
    },
    {
      slug: 'cafe-place-publique',
      name: 'Café Place Publique',
      summary: 'Classic café terrace for mint tea and people-watching.',
      categoryKey: 'cafes',
      lat: 33.8762,
      lng: 10.8568,
      priceLevel: PriceLevel.BUDGET,
    },
    {
      slug: 'cafe-midoun-corner',
      name: 'Midoun Corner Café',
      summary: 'Coffee, juices, and Wi‑Fi near Midoun main road.',
      categoryKey: 'cafes',
      lat: 33.8078,
      lng: 10.999,
      priceLevel: PriceLevel.BUDGET,
    },
    {
      slug: 'souk-houmt-souk',
      name: 'Houmt Souk Medina & Souks',
      summary: 'Handicrafts, spices, and pottery — bargain politely.',
      categoryKey: 'shops_souks',
      lat: 33.8755,
      lng: 10.8565,
    },
    {
      slug: 'carrefour-market-hs',
      name: 'Carrefour Market Houmt Souk (placeholder)',
      summary: 'Supermarket for water, snacks, toiletries, and SIM top-ups.',
      categoryKey: 'supermarkets',
      lat: 33.87,
      lng: 10.865,
      priceLevel: PriceLevel.BUDGET,
    },
    {
      slug: 'monoprix-midoun',
      name: 'Monoprix Midoun (placeholder)',
      summary: 'Convenient supermarket near hotels and residences.',
      categoryKey: 'supermarkets',
      lat: 33.805,
      lng: 11.002,
      priceLevel: PriceLevel.BUDGET,
    },
    {
      slug: 'musee-guellala',
      name: 'Guellala Museum (placeholder)',
      summary: 'Heritage museum on pottery village history and traditions.',
      categoryKey: 'museums',
      lat: 33.74,
      lng: 10.9,
      priceLevel: PriceLevel.BUDGET,
    },
    {
      slug: 'synagogue-ghriba',
      name: 'El Ghriba Synagogue',
      summary: 'Historic pilgrimage synagogue — dress modestly, check opening.',
      categoryKey: 'museums',
      lat: 33.815,
      lng: 10.855,
      priceLevel: PriceLevel.FREE,
    },
    {
      slug: 'hotel-zone-touristique',
      name: 'Zone Touristique Midoun strip',
      summary: 'Hotel corridor with beaches, restaurants, and nightlife.',
      categoryKey: 'hotels',
      lat: 33.82,
      lng: 11.03,
      priceLevel: PriceLevel.MODERATE,
    },
    {
      slug: 'park-borj-el-kebir',
      name: 'Borj El Kebir surroundings',
      summary: 'Fort area walks with views over Houmt Souk harbour.',
      categoryKey: 'parks',
      lat: 33.88,
      lng: 10.855,
      priceLevel: PriceLevel.FREE,
    },
    {
      slug: 'activity-quad-aghir',
      name: 'Quad / buggy outing Aghir (fake)',
      summary: 'Booked dune and coastal tracks — agree price and helmet use.',
      categoryKey: 'activities',
      lat: 33.76,
      lng: 11.01,
      priceLevel: PriceLevel.MODERATE,
    },
    {
      slug: 'activity-boat-trip',
      name: 'Flamingo island boat trip (fake)',
      summary: 'Half-day boat excursions; bring cash and sunscreen.',
      categoryKey: 'activities',
      lat: 33.885,
      lng: 10.84,
      priceLevel: PriceLevel.MODERATE,
    },
    {
      slug: 'nightlife-midoun',
      name: 'Midoun evening cafés strip',
      summary: 'Low-key nightlife — shisha cafés and late snacks.',
      categoryKey: 'nightlife',
      lat: 33.806,
      lng: 11.001,
      priceLevel: PriceLevel.BUDGET,
    },
    {
      slug: 'mosque-houmt-souk',
      name: 'Great Mosque area Houmt Souk',
      summary: 'Landmark mosque zone — quiet streets, modest dress nearby.',
      categoryKey: 'museums',
      lat: 33.875,
      lng: 10.8555,
      priceLevel: PriceLevel.FREE,
    },
    {
      slug: 'ajim-ferry-port',
      name: 'Ajim ferry landing',
      summary: 'Ferry link toward mainland Jorf — check timetable locally.',
      categoryKey: 'transport_hubs',
      lat: 33.72,
      lng: 10.75,
    },
    {
      slug: 'guellala-pottery',
      name: 'Guellala pottery workshops',
      summary: 'Village known for clay workshops and souvenir ceramics.',
      categoryKey: 'shops_souks',
      lat: 33.735,
      lng: 10.905,
    },
    {
      slug: 'restaurant-fish-aghir',
      name: 'Aghir Fish Terrace (fake)',
      summary: 'Simple grilled fish with sea views — cash preferred.',
      categoryKey: 'restaurants',
      lat: 33.752,
      lng: 11.015,
      priceLevel: PriceLevel.MODERATE,
    },
    {
      slug: 'cafe-harbour',
      name: 'Harbour Café Houmt Souk',
      summary: 'Coffee overlooking the fishing harbour.',
      categoryKey: 'cafes',
      lat: 33.879,
      lng: 10.854,
      priceLevel: PriceLevel.BUDGET,
    },
    {
      slug: 'supermarket-express-hs',
      name: 'Express Market Houmt Souk',
      summary: 'Smaller grocery for late snacks and bottled water.',
      categoryKey: 'supermarkets',
      lat: 33.874,
      lng: 10.859,
      priceLevel: PriceLevel.BUDGET,
    },
    {
      slug: 'beach-club-zone',
      name: 'Hotel beach club access (fake)',
      summary: 'Day access sometimes sold to non-guests — ask reception rates.',
      categoryKey: 'beaches',
      lat: 33.825,
      lng: 11.035,
      priceLevel: PriceLevel.MODERATE,
    },
    {
      slug: 'atm-midoun-centre',
      name: 'ATM Midoun Centre',
      summary: 'Town ATM near shops; have a backup card.',
      categoryKey: 'banks',
      lat: 33.808,
      lng: 10.996,
    },
    // —— Phase 07 P1 daily-life expansion ——
    {
      slug: 'pharmacie-aghir',
      name: 'Pharmacie Aghir',
      summary: 'Pharmacy near south-east beaches; check garde rota for nights.',
      categoryKey: 'pharmacies',
      lat: 33.748,
      lng: 11.018,
    },
    {
      slug: 'pharmacie-houmt-souk-sud',
      name: 'Pharmacie Houmt Souk Sud',
      summary: 'Second pharmacy option south of the medina.',
      categoryKey: 'pharmacies',
      lat: 33.871,
      lng: 10.861,
    },
    {
      slug: 'clinic-houmt-souk-private',
      name: 'Private clinic Houmt Souk (placeholder)',
      summary: 'Private consultation option; confirm insurance coverage.',
      categoryKey: 'hospitals',
      lat: 33.8735,
      lng: 10.862,
    },
    {
      slug: 'atm-airport-secondary',
      name: 'ATM — Airport secondary hall',
      summary: 'Backup cash point if the main ATM queue is long.',
      categoryKey: 'banks',
      lat: 33.8748,
      lng: 10.7762,
    },
    {
      slug: 'atm-houmt-souk-medina',
      name: 'ATM near Medina gate',
      summary: 'Useful before shopping; have a backup card.',
      categoryKey: 'banks',
      lat: 33.8752,
      lng: 10.8558,
    },
    {
      slug: 'plage-sidi-baker',
      name: 'Sidi Baker Beach stretch',
      summary: 'Quieter sand pockets west of the hotel strip.',
      categoryKey: 'beaches',
      lat: 33.845,
      lng: 11.01,
      priceLevel: PriceLevel.FREE,
    },
    {
      slug: 'plage-mezraya',
      name: 'Mezraya Beach',
      summary: 'North-east beach popular with families and windsurfers.',
      categoryKey: 'beaches',
      lat: 33.855,
      lng: 11.04,
      priceLevel: PriceLevel.FREE,
    },
    {
      slug: 'plage-borj-jillij',
      name: 'Borj Jillij coastal walk',
      summary: 'Scenic west-coast walk near the airport approach.',
      categoryKey: 'beaches',
      lat: 33.88,
      lng: 10.78,
      priceLevel: PriceLevel.FREE,
    },
    {
      slug: 'restaurant-brik-house',
      name: 'Brik & Local Kitchen (fake)',
      summary: 'Tunisian staples — brik, salade méchouia, grilled meats.',
      categoryKey: 'restaurants',
      lat: 33.8768,
      lng: 10.8572,
      priceLevel: PriceLevel.BUDGET,
    },
    {
      slug: 'restaurant-student-menu',
      name: 'Student Menu Corner (fake)',
      summary: 'Cheap daily specials near Houmt Souk — good for tight budgets.',
      categoryKey: 'restaurants',
      lat: 33.8745,
      lng: 10.858,
      priceLevel: PriceLevel.BUDGET,
    },
    {
      slug: 'restaurant-family-midoun',
      name: 'Family Table Midoun (fake)',
      summary: 'Spacious seating, kids portions, and mixed grills.',
      categoryKey: 'restaurants',
      lat: 33.81,
      lng: 10.994,
      priceLevel: PriceLevel.MODERATE,
    },
    {
      slug: 'restaurant-seafood-harbour',
      name: 'Harbour Seafood Catch (fake)',
      summary: 'Fresh catch near Houmt Souk harbour — ask the daily price.',
      categoryKey: 'restaurants',
      lat: 33.8785,
      lng: 10.8535,
      priceLevel: PriceLevel.MODERATE,
    },
    {
      slug: 'cafe-quiet-midoun',
      name: 'Quiet Garden Café Midoun',
      summary: 'Calmer terrace away from the main road — good for laptop/chat.',
      categoryKey: 'cafes',
      lat: 33.8095,
      lng: 10.9935,
      priceLevel: PriceLevel.BUDGET,
    },
    {
      slug: 'cafe-aghir-sea',
      name: 'Aghir Sea View Café',
      summary: 'Mint tea and snacks with a sea breeze.',
      categoryKey: 'cafes',
      lat: 33.751,
      lng: 11.016,
      priceLevel: PriceLevel.BUDGET,
    },
    {
      slug: 'cafe-night-houmt',
      name: 'Late Café Houmt Souk',
      summary: 'Open later than most — juices, coffee, light snacks.',
      categoryKey: 'cafes',
      lat: 33.8758,
      lng: 10.8595,
      priceLevel: PriceLevel.BUDGET,
    },
    {
      slug: 'supermarket-aghir',
      name: 'Aghir Mini Market',
      summary: 'Water, snacks, and basics near Aghir beaches.',
      categoryKey: 'supermarkets',
      lat: 33.749,
      lng: 11.014,
      priceLevel: PriceLevel.BUDGET,
    },
    {
      slug: 'supermarket-zone-touristique',
      name: 'Zone Touristique grocery',
      summary: 'Hotel-strip convenience store with longer evening hours.',
      categoryKey: 'supermarkets',
      lat: 33.822,
      lng: 11.028,
      priceLevel: PriceLevel.BUDGET,
    },
    {
      slug: 'hotel-houmt-souk-riad',
      name: 'Houmt Souk riad-style stay (fake)',
      summary: 'Central courtyard lodging — walkable to souks and harbour.',
      categoryKey: 'hotels',
      lat: 33.876,
      lng: 10.856,
      priceLevel: PriceLevel.MODERATE,
    },
    {
      slug: 'hotel-midoun-family',
      name: 'Midoun Family Resort strip (fake)',
      summary: 'Family resorts with pools near Midoun beaches.',
      categoryKey: 'hotels',
      lat: 33.818,
      lng: 11.032,
      priceLevel: PriceLevel.EXPENSIVE,
    },
    {
      slug: 'museum-djerbahood',
      name: 'Djerbahood / Erriadh street art (placeholder)',
      summary: 'Village murals and photo walks — go early for shade.',
      categoryKey: 'museums',
      lat: 33.82,
      lng: 10.855,
      priceLevel: PriceLevel.FREE,
    },
    {
      slug: 'heritage-borj-el-kebir',
      name: 'Borj El Kebir fort visit',
      summary: 'Ottoman-era fort overlooking Houmt Souk harbour.',
      categoryKey: 'museums',
      lat: 33.8805,
      lng: 10.8545,
      priceLevel: PriceLevel.BUDGET,
    },
    {
      slug: 'park-olive-grove-walk',
      name: 'Olive grove countryside walk',
      summary: 'Quiet inland paths — take water and sun protection.',
      categoryKey: 'parks',
      lat: 33.79,
      lng: 10.92,
      priceLevel: PriceLevel.FREE,
    },
    {
      slug: 'shop-spices-hs',
      name: 'Spice stalls Houmt Souk',
      summary: 'Spices and blends — compare prices across a few stalls.',
      categoryKey: 'shops_souks',
      lat: 33.8756,
      lng: 10.8568,
      priceLevel: PriceLevel.BUDGET,
    },
    {
      slug: 'shop-pottery-erriadh',
      name: 'Erriadh craft shops',
      summary: 'Small craft boutiques near street-art lanes.',
      categoryKey: 'shops_souks',
      lat: 33.819,
      lng: 10.854,
      priceLevel: PriceLevel.MODERATE,
    },
    {
      slug: 'activity-cooking-class',
      name: 'Home-style cooking class (fake)',
      summary: 'Booked local cooking session — confirm dietary needs.',
      categoryKey: 'activities',
      lat: 33.872,
      lng: 10.858,
      priceLevel: PriceLevel.MODERATE,
    },
    {
      slug: 'activity-kitesurf-mezraya',
      name: 'Kitesurf / wind session Mezraya (fake)',
      summary: 'Seasonal wind sports — rent gear from beach schools.',
      categoryKey: 'activities',
      lat: 33.856,
      lng: 11.042,
      priceLevel: PriceLevel.MODERATE,
    },
    {
      slug: 'activity-camel-sunset',
      name: 'Sunset camel stroll (fake)',
      summary: 'Short beach camel rides near tourist strip — agree price first.',
      categoryKey: 'activities',
      lat: 33.83,
      lng: 11.03,
      priceLevel: PriceLevel.BUDGET,
    },
    {
      slug: 'nightlife-harbour-terrace',
      name: 'Harbour evening terraces',
      summary: 'Relaxed evening drinks/snacks overlooking fishing boats.',
      categoryKey: 'nightlife',
      lat: 33.8795,
      lng: 10.8538,
      priceLevel: PriceLevel.BUDGET,
    },
    {
      slug: 'bus-stop-houmt-souk',
      name: 'Houmt Souk regional bus point',
      summary: 'Occasional regional buses — confirm timetable the same day.',
      categoryKey: 'transport_hubs',
      lat: 33.873,
      lng: 10.86,
    },
    {
      slug: 'louage-ajim',
      name: 'Ajim louage / ferry approach',
      summary: 'Shared rides toward Ajim ferry for mainland links.',
      categoryKey: 'transport_hubs',
      lat: 33.722,
      lng: 10.752,
    },
    {
      slug: 'mosque-midoun',
      name: 'Midoun mosque area',
      summary: 'Neighbourhood mosque zone — modest dress nearby.',
      categoryKey: 'museums',
      lat: 33.8072,
      lng: 10.9975,
      priceLevel: PriceLevel.FREE,
    },
    {
      slug: 'park-midoun-public',
      name: 'Midoun public garden',
      summary: 'Small shaded park for a short rest with kids.',
      categoryKey: 'parks',
      lat: 33.8088,
      lng: 10.9955,
      priceLevel: PriceLevel.FREE,
    },
    {
      slug: 'restaurant-pizza-zone',
      name: 'Zone Pizza & Pasta (fake)',
      summary: 'Familiar tourist menus near hotels — handy with kids.',
      categoryKey: 'restaurants',
      lat: 33.821,
      lng: 11.029,
      priceLevel: PriceLevel.MODERATE,
    },
    {
      slug: 'cafe-erriadh',
      name: 'Erriadh Art Café',
      summary: 'Coffee stop between mural streets.',
      categoryKey: 'cafes',
      lat: 33.8205,
      lng: 10.8555,
      priceLevel: PriceLevel.BUDGET,
    },
  ];

  const places: Record<string, string> = {};
  for (const def of placeDefs) {
    const catId = cats[def.categoryKey];
    if (!catId) throw new Error(`Missing category ${def.categoryKey}`);
    const place = await prisma.place.create({
      data: {
        cityId,
        slug: def.slug,
        name: def.name,
        summary: def.summary,
        description: `${def.summary} (seed pack ${PACK} — placeholder content).`,
        latitude: def.lat,
        longitude: def.lng,
        addressText: def.addressText,
        priceLevel: def.priceLevel,
        primaryCategoryId: catId,
        verificationStatus: VerificationStatus.APPROVED,
        sourceType: SourceType.ADMIN,
        createdByUserId: adminUserId,
        publishedAt: REVIEWED,
        metadata: { pack: PACK, tip: 'Confirm hours locally — seed is approximate.' },
        photos: {
          create: [
            {
              url: `${PHOTO}&slug=${def.slug}`,
              caption: `${def.name} placeholder`,
              status: VerificationStatus.APPROVED,
            },
          ],
        },
      },
    });
    places[def.slug] = place.id;
  }

  // Guide zone-knowledge pack (attributed to seed Guide — fake demo content)
  const guidePlaceDefs: Array<{
    slug: string;
    name: string;
    summary: string;
    categoryKey: string;
    lat: number;
    lng: number;
    priceLevel?: PriceLevel;
    attributes?: Record<string, string | boolean>;
  }> = [
    {
      slug: 'guide-phone-repair-hs',
      name: 'Houmt Souk Phone Fix (demo)',
      summary: 'Guide tip: cheap screen + battery swaps near the souk.',
      categoryKey: 'phone_repair',
      lat: 33.8762,
      lng: 10.8568,
      priceLevel: PriceLevel.BUDGET,
      attributes: { budgetFriendly: true, zoneHint: 'local' },
    },
    {
      slug: 'guide-car-repair-midoun',
      name: 'Midoun Garage Express (demo)',
      summary: 'Guide tip: reliable puncture + oil change for island roads.',
      categoryKey: 'car_repair',
      lat: 33.8075,
      lng: 11.0,
      priceLevel: PriceLevel.MODERATE,
      attributes: { zoneHint: 'local' },
    },
    {
      slug: 'guide-budget-shop-hs',
      name: 'Souk Bargain Lane (demo)',
      summary: 'Guide tip: cheapest basics and souvenirs — bargain politely.',
      categoryKey: 'budget_shops',
      lat: 33.8755,
      lng: 10.8575,
      priceLevel: PriceLevel.BUDGET,
      attributes: { budgetFriendly: true, zoneHint: 'tourist' },
    },
    {
      slug: 'guide-camping-aghir',
      name: 'Aghir Quiet Camping Spot (demo)',
      summary: 'Guide tip: informal camping-friendly stretch — ask locals, leave no trace.',
      categoryKey: 'camping',
      lat: 33.73,
      lng: 11.02,
      priceLevel: PriceLevel.BUDGET,
      attributes: { zoneHint: 'quiet', safetyNote: 'Avoid isolated nights alone' },
    },
    {
      slug: 'guide-car-rental-airport',
      name: 'Airport Car Rental Desk (demo)',
      summary: 'Guide tip: compare desk rates; check insurance for dirt roads.',
      categoryKey: 'car_rental',
      lat: 33.8745,
      lng: 10.776,
      priceLevel: PriceLevel.MODERATE,
      attributes: { zoneHint: 'tourist' },
    },
    {
      slug: 'guide-sunset-ras-rmal',
      name: 'Ras Rmal Sunset Walk (demo)',
      summary: 'Guide tip: soft light and flamingo season — best near sunset.',
      categoryKey: 'activities',
      lat: 33.89,
      lng: 10.88,
      priceLevel: PriceLevel.FREE,
      attributes: { bestTimeOfDay: 'sunset', zoneHint: 'tourist' },
    },
    {
      slug: 'guide-beach-sejoumi-rated',
      name: 'Sidi Mahrez Beach Pick (demo)',
      summary: 'Guide rating: top east-coast beach for swimming when wind is calm.',
      categoryKey: 'beaches',
      lat: 33.86,
      lng: 11.05,
      priceLevel: PriceLevel.FREE,
      attributes: { bestTimeOfDay: 'morning', zoneHint: 'tourist' },
    },
    {
      slug: 'guide-rental-midoun-zone',
      name: 'Midoun Longer-Stay Rentals Area (demo)',
      summary: 'Guide tip: apartments for weekly stays — quieter than hotel strip.',
      categoryKey: 'hotels',
      lat: 33.805,
      lng: 10.995,
      priceLevel: PriceLevel.MODERATE,
      attributes: { zoneHint: 'local' },
    },
  ];

  for (const def of guidePlaceDefs) {
    const catId = cats[def.categoryKey];
    if (!catId) throw new Error(`Missing category ${def.categoryKey}`);
    const place = await prisma.place.create({
      data: {
        cityId,
        slug: def.slug,
        name: def.name,
        summary: def.summary,
        description: `${def.summary} (seed pack ${PACK} — Guide demo content).`,
        latitude: def.lat,
        longitude: def.lng,
        priceLevel: def.priceLevel,
        primaryCategoryId: catId,
        verificationStatus: VerificationStatus.APPROVED,
        sourceType: SourceType.GUIDE_VERIFIED,
        createdByUserId: guideUserId,
        publishedAt: REVIEWED,
        metadata: {
          pack: PACK,
          attributes: def.attributes ?? {},
          tip: 'Guide-authored fake seed — replace with real local notes.',
        },
        photos: {
          create: [
            {
              url: `${PHOTO}&slug=${def.slug}`,
              caption: `${def.name} placeholder`,
              status: VerificationStatus.APPROVED,
              uploadedByUserId: guideUserId,
            },
          ],
        },
      },
    });
    places[def.slug] = place.id;
  }

  // Pending place to prove it does not leak publicly
  await prisma.place.create({
    data: {
      cityId,
      slug: 'pending-hidden-place',
      name: 'PENDING Hidden Place',
      summary: 'Should never appear on public list',
      latitude: 33.8,
      longitude: 10.9,
      verificationStatus: VerificationStatus.PENDING,
      sourceType: SourceType.ADMIN,
      createdByUserId: adminUserId,
      metadata: { pack: PACK },
    },
  });

  const taxi = await prisma.transportSystem.create({
    data: {
      countryId,
      cityId,
      name: 'Djerba airport & local taxis',
      mode: TransportMode.TAXI,
      summary: 'Official airport rank + metered/negotiated town taxis.',
      howItWorks:
        'At the airport use the official rank. In town, agree fare or ensure meter is on. Prefer daylight for long island hops.',
      accessInstructions: 'Exit arrivals → follow Taxi signs to official queue.',
      pricingType: PricingType.NEGOTIABLE,
      priceMin: 15,
      priceMax: 60,
      currency: 'TND',
      paymentMethods: [PaymentMethod.CASH, PaymentMethod.CARD],
      operatingHoursText: '24/7 at airport; town taxis denser daytime',
      coverageNotes: 'Island-wide; airport→Midoun typically 30–50 TND (fake seed range)',
      warnings: [
        'Ignore unofficial touts inside the terminal',
        'Agree fare before boarding if no meter',
        'Keep small TND bills',
      ],
      appsJson: { notes: 'In-app ride-hail coverage is limited — cash taxi is default' },
      verificationStatus: VerificationStatus.APPROVED,
      sourceType: SourceType.ADMIN,
      lastReviewedAt: REVIEWED,
    },
  });

  const louage = await prisma.transportSystem.create({
    data: {
      countryId,
      cityId,
      name: 'Louage (shared taxi)',
      mode: TransportMode.SHARED_TAXI,
      summary: 'Shared vans/cars on fixed-ish island corridors.',
      howItWorks:
        'Go to louage station, tell destination, wait until vehicle fills. Cheaper than private taxi.',
      pricingType: PricingType.FIXED,
      priceMin: 2,
      priceMax: 12,
      currency: 'TND',
      paymentMethods: [PaymentMethod.CASH],
      warnings: [
        'Departures when full — expect wait',
        'Luggage space limited',
        'Confirm destination village name',
      ],
      verificationStatus: VerificationStatus.APPROVED,
      sourceType: SourceType.ADMIN,
      lastReviewedAt: REVIEWED,
    },
  });

  // Pending transport — must stay hidden
  await prisma.transportSystem.create({
    data: {
      countryId,
      cityId,
      name: 'PENDING mystery shuttle',
      mode: TransportMode.AIRPORT_SHUTTLE,
      summary: 'Hidden pending system',
      pricingType: PricingType.UNKNOWN,
      paymentMethods: [PaymentMethod.CASH],
      warnings: [],
      verificationStatus: VerificationStatus.PENDING,
      sourceType: SourceType.ADMIN,
    },
  });

  const hubAirport = await prisma.transportHub.create({
    data: {
      placeId: places['airport-taxi-rank'],
      transportSystemId: taxi.id,
      hubType: 'TAXI_RANK',
      name: 'DJE official taxi rank',
      notes: 'Prefer this queue over private offers',
    },
  });
  const hubHs = await prisma.transportHub.create({
    data: {
      placeId: places['houmt-souk-louage'],
      transportSystemId: taxi.id,
      hubType: 'TOWN_HUB',
      name: 'Houmt Souk taxi point',
    },
  });
  const hubMidoun = await prisma.transportHub.create({
    data: {
      placeId: places['midoun-taxi-hub'],
      transportSystemId: taxi.id,
      hubType: 'TOWN_HUB',
      name: 'Midoun taxi hub',
    },
  });
  const hubLouageHs = await prisma.transportHub.create({
    data: {
      placeId: places['houmt-souk-louage'],
      transportSystemId: louage.id,
      hubType: 'LOUAGE_STATION',
      name: 'Houmt Souk louage',
    },
  });
  const hubLouageMidoun = await prisma.transportHub.create({
    data: {
      placeId: places['midoun-taxi-hub'],
      transportSystemId: louage.id,
      hubType: 'LOUAGE_STATION',
      name: 'Midoun louage stop',
    },
  });

  const ferry = await prisma.transportSystem.create({
    data: {
      countryId,
      cityId,
      name: 'Ajim–Jorf ferry',
      mode: TransportMode.FERRY,
      summary: 'Car/passenger ferry link between Djerba (Ajim) and mainland Jorf.',
      howItWorks:
        'Drive or taxi to Ajim landing, buy ticket at booth, wait for next crossing. Timetables shift — ask locals same day.',
      accessInstructions: 'Follow signs to Ajim port; arrive 20–30 min early in peak season.',
      pricingType: PricingType.FIXED,
      priceMin: 2,
      priceMax: 25,
      currency: 'TND',
      paymentMethods: [PaymentMethod.CASH],
      coverageNotes: 'Island ↔ mainland; not for Midoun hotel hops',
      warnings: [
        'Queues build on weekends and holidays',
        'Confirm last crossing time before late travel',
      ],
      verificationStatus: VerificationStatus.APPROVED,
      sourceType: SourceType.ADMIN,
      lastReviewedAt: REVIEWED,
    },
  });

  const hubAjim = await prisma.transportHub.create({
    data: {
      placeId: places['ajim-ferry-port'],
      transportSystemId: ferry.id,
      hubType: 'FERRY_PORT',
      name: 'Ajim ferry landing',
    },
  });
  void hubAjim;

  const hubLouageAjim = await prisma.transportHub.create({
    data: {
      placeId: places['louage-ajim'],
      transportSystemId: louage.id,
      hubType: 'LOUAGE_STATION',
      name: 'Ajim louage approach',
    },
  });

  const routeData = [
    {
      systemId: taxi.id,
      from: hubAirport.id,
      to: hubHs.id,
      duration: 25,
      min: 20,
      max: 35,
      freq: 'On demand after landing',
    },
    {
      systemId: taxi.id,
      from: hubAirport.id,
      to: hubMidoun.id,
      duration: 35,
      min: 30,
      max: 50,
      freq: 'On demand; night surcharge possible',
    },
    {
      systemId: taxi.id,
      from: hubHs.id,
      to: hubMidoun.id,
      duration: 25,
      min: 15,
      max: 30,
      freq: 'Daytime plentiful',
    },
    {
      systemId: louage.id,
      from: hubLouageHs.id,
      to: hubLouageMidoun.id,
      duration: 30,
      min: 3,
      max: 6,
      freq: 'When full; daytime denser',
    },
    {
      systemId: louage.id,
      from: hubLouageMidoun.id,
      to: hubLouageHs.id,
      duration: 30,
      min: 3,
      max: 6,
      freq: 'When full',
    },
    {
      systemId: louage.id,
      from: hubLouageHs.id,
      to: hubLouageAjim.id,
      duration: 35,
      min: 4,
      max: 8,
      freq: 'Daytime when full',
    },
    {
      systemId: taxi.id,
      from: hubHs.id,
      to: hubAirport.id,
      duration: 25,
      min: 20,
      max: 35,
      freq: 'On demand return to airport',
    },
  ];

  for (const r of routeData) {
    await prisma.transportRoute.create({
      data: {
        transportSystemId: r.systemId,
        fromHubId: r.from,
        toHubId: r.to,
        approxDurationMin: r.duration,
        priceMin: r.min,
        priceMax: r.max,
        currency: 'TND',
        frequencyNotes: r.freq,
        verificationStatus: VerificationStatus.APPROVED,
      },
    });
  }

  const arrival = await prisma.arrivalGuide.create({
    data: {
      cityId,
      airportPlaceId: places['djerba-zarzis-airport'],
      title: 'First hour after landing in Djerba',
      summary:
        'Orientation from DJE arrivals: SIM, cash, official taxi, reach Houmt Souk or Midoun safely.',
      estimatedTotalTimeMin: 60,
      audience: 'ALL',
      verificationStatus: VerificationStatus.APPROVED,
      lastReviewedAt: REVIEWED,
    },
  });

  const arrivalSteps: Array<{
    order: number;
    title: string;
    action: GuideActionType;
    description: string;
    time?: number;
    costMin?: number;
    costMax?: number;
    payments?: PaymentMethod[];
    warnings?: string[];
    placeSlug?: string;
    transportId?: string;
    optional?: boolean;
  }> = [
    {
      order: 1,
      title: 'Clear immigration & find arrivals hall',
      action: GuideActionType.CLEAR_IMMIGRATION,
      description:
        'Follow Arrivals signs. Keep passport handy. Meet-and-greet touts start early — stay with official signage.',
      time: 20,
      warnings: ['Do not hand passport to strangers offering “help”'],
    },
    {
      order: 2,
      title: 'Get a local SIM or eSIM plan',
      action: GuideActionType.BUY_SIM,
      description:
        'Look for Ooredoo / Tunisie Telecom / Orange desks in arrivals. Passport usually required. Top up later in town.',
      time: 15,
      costMin: 10,
      costMax: 40,
      payments: [PaymentMethod.CASH, PaymentMethod.CARD],
      warnings: ['Confirm data validity days before paying'],
    },
    {
      order: 3,
      title: 'Withdraw or exchange a little cash',
      action: GuideActionType.WITHDRAW_ATM,
      description:
        'Use airport ATM for small TND amount. Keep a backup card. Exchange offices exist but compare rates.',
      time: 10,
      placeSlug: 'atm-stb-airport',
      payments: [PaymentMethod.CARD],
      warnings: ['Watch for shoulder-surfing at ATMs'],
    },
    {
      order: 4,
      title: 'Take an official taxi (not lobby touts)',
      action: GuideActionType.TAKE_TAXI,
      description:
        'Exit to the official taxi rank. Agree fare to Houmt Souk or Midoun before boarding if meter unused.',
      time: 10,
      costMin: 20,
      costMax: 50,
      payments: [PaymentMethod.CASH],
      placeSlug: 'airport-taxi-rank',
      transportId: taxi.id,
      warnings: ['Refuse unmarked cars inside the terminal'],
    },
    {
      order: 5,
      title: 'Reach Houmt Souk / Midoun / hotel zone',
      action: GuideActionType.GO_TO_PLACE,
      description:
        'Typical taxi ride: ~25–40 min depending on destination. Share hotel name in French/Arabic if helpful.',
      time: 35,
      transportId: taxi.id,
    },
    {
      order: 6,
      title: 'First water & simple food',
      action: GuideActionType.OTHER,
      description:
        'Buy sealed water from supermarket or hotel shop. Avoid raw salads if your stomach is sensitive on day 1.',
      time: 15,
      costMin: 5,
      costMax: 20,
      payments: [PaymentMethod.CASH],
      placeSlug: 'carrefour-market-hs',
      optional: true,
    },
    {
      order: 7,
      title: 'First-night safety basics',
      action: GuideActionType.CHECK_SAFETY,
      description:
        'Save emergency numbers. Prefer lit routes. Tell your hotel reception if arriving very late.',
      time: 5,
      warnings: ['Keep bag zipped in crowded souks'],
    },
  ];

  for (const s of arrivalSteps) {
    await prisma.guideStep.create({
      data: {
        parentType: GuideParentType.ARRIVAL_GUIDE,
        arrivalGuideId: arrival.id,
        stepOrder: s.order,
        title: s.title,
        actionType: s.action,
        description: s.description,
        estimatedTimeMin: s.time,
        estimatedCostMin: s.costMin,
        estimatedCostMax: s.costMax,
        currency: 'TND',
        paymentMethods: s.payments ?? [],
        relatedPlaceId: s.placeSlug ? places[s.placeSlug] : undefined,
        relatedTransportSystemId: s.transportId,
        warnings: s.warnings ?? [],
        isOptional: s.optional ?? false,
      },
    });
  }

  const survival = await prisma.howToGuide.create({
    data: {
      cityId,
      countryId,
      title: 'Djerba 48-hour survival kit',
      summary:
        'SIM, cash, transport, supermarket, pharmacy/hospital — the first two days checklist.',
      categoryKey: 'SURVIVAL_48H',
      verificationStatus: VerificationStatus.APPROVED,
      lastReviewedAt: REVIEWED,
      createdByUserId: adminUserId,
    },
  });

  const survivalSteps = [
    {
      order: 1,
      title: 'Stay connected',
      action: GuideActionType.BUY_SIM,
      description: 'Buy/activate SIM and save hotel + emergency contacts.',
    },
    {
      order: 2,
      title: 'Cash buffer',
      action: GuideActionType.WITHDRAW_ATM,
      description: 'Keep 50–100 TND small bills for taxis and tips.',
    },
    {
      order: 3,
      title: 'Know your taxi norms',
      action: GuideActionType.TAKE_TAXI,
      description: 'Official rank at airport; agree fares in town when needed.',
    },
    {
      order: 4,
      title: 'Find a supermarket',
      action: GuideActionType.GO_TO_PLACE,
      description: 'Stock water, fruit, and basics near Houmt Souk or Midoun.',
      place: 'carrefour-market-hs',
    },
    {
      order: 5,
      title: 'Locate pharmacy & hospital',
      action: GuideActionType.GO_TO_PLACE,
      description: 'Save Pharmacie Centrale and regional hospital pins offline.',
      place: 'pharmacie-centrale-hs',
    },
  ];

  for (const s of survivalSteps) {
    await prisma.guideStep.create({
      data: {
        parentType: GuideParentType.HOW_TO_GUIDE,
        howToGuideId: survival.id,
        stepOrder: s.order,
        title: s.title,
        actionType: s.action,
        description: s.description,
        relatedPlaceId: s.place ? places[s.place] : undefined,
        warnings: [],
        paymentMethods: [],
      },
    });
  }

  const rules: Array<{
    scope: RuleScope;
    category: RuleCategory;
    severity: RuleSeverity;
    title: string;
    summary: string;
    details?: string;
    audience?: string;
  }> = [
    {
      scope: RuleScope.COUNTRY,
      category: RuleCategory.EMERGENCY,
      severity: RuleSeverity.CRITICAL,
      title: 'Tunisia emergency numbers',
      summary: 'Police 197 · Ambulance 190 · Fire 198 (confirm locally).',
      details:
        'Save these before you lose signal. Hotels can also call on your behalf.',
    },
    {
      scope: RuleScope.CITY,
      category: RuleCategory.SAFETY,
      severity: RuleSeverity.IMPORTANT,
      title: 'Night movement basics in Djerba',
      summary:
        'Prefer lit main roads and hotel taxis late at night; travel with company when possible.',
    },
    {
      scope: RuleScope.CITY,
      category: RuleCategory.SCAM_WARNING,
      severity: RuleSeverity.CRITICAL,
      title: 'Airport taxi touts',
      summary:
        'Decline unofficial drivers inside the terminal; use the marked taxi rank.',
      details: 'If pressured, walk to official signage and ask airport staff.',
    },
    {
      scope: RuleScope.CITY,
      category: RuleCategory.MONEY,
      severity: RuleSeverity.IMPORTANT,
      title: 'Cash is still king',
      summary:
        'Many taxis, cafés, and souk stalls prefer cash TND; cards work better in hotels/supermarkets.',
    },
    {
      scope: RuleScope.CITY,
      category: RuleCategory.DRESS_CULTURE,
      severity: RuleSeverity.INFO,
      title: 'Dress respectfully in towns & religious sites',
      summary:
        'Beachwear is for beaches/hotels; cover shoulders/knees in medina and religious sites.',
    },
    {
      scope: RuleScope.CITY,
      category: RuleCategory.PHOTOGRAPHY,
      severity: RuleSeverity.IMPORTANT,
      title: 'Ask before photographing people',
      summary:
        'Always ask before close-up photos of people, especially in markets and religious contexts.',
    },
    {
      scope: RuleScope.CITY,
      category: RuleCategory.TRANSPORT,
      severity: RuleSeverity.IMPORTANT,
      title: 'Agree taxi fares early',
      summary:
        'If the meter is off, agree the fare to your destination before the car moves.',
    },
    {
      scope: RuleScope.CITY,
      category: RuleCategory.SCAM_WARNING,
      severity: RuleSeverity.IMPORTANT,
      title: 'Souk commission circuits',
      summary:
        'Friendly “guides” may steer you to specific shops for commission — feel free to decline.',
    },
    {
      scope: RuleScope.CITY,
      category: RuleCategory.MONEY,
      severity: RuleSeverity.INFO,
      title: 'Student-budget eating',
      summary:
        'Look for daily specials and local grill corners away from hotel-front menus; cash helps.',
    },
    {
      scope: RuleScope.CITY,
      category: RuleCategory.SAFETY,
      severity: RuleSeverity.INFO,
      title: 'Family-friendly daytime zones',
      summary:
        'Houmt Souk medina daytime, Midoun centre, and hotel beaches are typically comfortable for families.',
    },
    {
      scope: RuleScope.CITY,
      category: RuleCategory.TRANSPORT,
      severity: RuleSeverity.INFO,
      title: 'Ferry timing to the mainland',
      summary:
        'Ajim–Jorf ferry queues grow on weekends — confirm last crossing before late trips.',
    },
  ];

  for (const r of rules) {
    await prisma.localRule.create({
      data: {
        scope: r.scope,
        countryId,
        cityId: r.scope === RuleScope.CITY ? cityId : undefined,
        category: r.category,
        severity: r.severity,
        audience: r.audience ?? 'ALL',
        title: r.title,
        summary: r.summary,
        details: r.details,
        sourceType: SourceType.ADMIN,
        verificationStatus: VerificationStatus.APPROVED,
        lastReviewedAt: REVIEWED,
      },
    });
  }

  // Rejected rule — must not list publicly
  await prisma.localRule.create({
    data: {
      scope: RuleScope.CITY,
      countryId,
      cityId,
      category: RuleCategory.OTHER,
      severity: RuleSeverity.INFO,
      audience: 'ALL',
      title: 'REJECTED placeholder rule',
      summary: 'Should be hidden',
      sourceType: SourceType.ADMIN,
      verificationStatus: VerificationStatus.REJECTED,
    },
  });

  const eventDefs: Array<{
    title: string;
    summary: string;
    placeSlug: string;
    start: string;
    end: string;
    cat: string;
    price?: PriceLevel;
  }> = [
    {
      title: 'Evening medina stroll (seed)',
      summary: 'Casual walk through Houmt Souk lanes after sunset.',
      placeSlug: 'souk-houmt-souk',
      start: '2026-08-01T18:00:00.000Z',
      end: '2026-08-01T20:00:00.000Z',
      cat: 'activities',
      price: PriceLevel.FREE,
    },
    {
      title: 'Friday pottery village visit',
      summary: 'Guellala workshops — better light in the morning.',
      placeSlug: 'guellala-pottery',
      start: '2026-08-07T09:00:00.000Z',
      end: '2026-08-07T12:00:00.000Z',
      cat: 'activities',
      price: PriceLevel.BUDGET,
    },
    {
      title: 'Sunset at Ras Rmel',
      summary: 'Wide beach sunset walk west of Houmt Souk.',
      placeSlug: 'plage-ras-errmel',
      start: '2026-08-02T17:30:00.000Z',
      end: '2026-08-02T19:00:00.000Z',
      cat: 'beaches',
      price: PriceLevel.FREE,
    },
    {
      title: 'Erriadh mural morning',
      summary: 'Street-art walk before midday heat.',
      placeSlug: 'museum-djerbahood',
      start: '2026-08-03T08:30:00.000Z',
      end: '2026-08-03T11:00:00.000Z',
      cat: 'museums',
      price: PriceLevel.FREE,
    },
    {
      title: 'Harbour coffee meetup',
      summary: 'Casual coffee overlooking fishing boats.',
      placeSlug: 'cafe-harbour',
      start: '2026-08-04T10:00:00.000Z',
      end: '2026-08-04T11:00:00.000Z',
      cat: 'cafes',
      price: PriceLevel.BUDGET,
    },
    {
      title: 'Family beach half-day',
      summary: 'Sidi Mahrez sand time with nearby cafés.',
      placeSlug: 'plage-sejoumi',
      start: '2026-08-05T10:00:00.000Z',
      end: '2026-08-05T14:00:00.000Z',
      cat: 'beaches',
      price: PriceLevel.FREE,
    },
    {
      title: 'Midoun night snack crawl',
      summary: 'Late cafés and light snacks on Midoun strip.',
      placeSlug: 'nightlife-midoun',
      start: '2026-08-06T20:00:00.000Z',
      end: '2026-08-06T22:30:00.000Z',
      cat: 'nightlife',
      price: PriceLevel.BUDGET,
    },
    {
      title: 'Synagogue visit window',
      summary: 'El Ghriba — confirm opening and dress code.',
      placeSlug: 'synagogue-ghriba',
      start: '2026-08-08T09:00:00.000Z',
      end: '2026-08-08T11:00:00.000Z',
      cat: 'museums',
      price: PriceLevel.FREE,
    },
    {
      title: 'Aghir seafood lunch',
      summary: 'Simple grilled fish near Aghir shore.',
      placeSlug: 'restaurant-fish-aghir',
      start: '2026-08-09T12:30:00.000Z',
      end: '2026-08-09T14:00:00.000Z',
      cat: 'restaurants',
      price: PriceLevel.MODERATE,
    },
    {
      title: 'Student budget lunch hour',
      summary: 'Daily specials near Houmt Souk for tight budgets.',
      placeSlug: 'restaurant-student-menu',
      start: '2026-08-10T12:00:00.000Z',
      end: '2026-08-10T13:30:00.000Z',
      cat: 'restaurants',
      price: PriceLevel.BUDGET,
    },
    {
      title: 'Fort & harbour photo stop',
      summary: 'Borj El Kebir views then harbour café.',
      placeSlug: 'heritage-borj-el-kebir',
      start: '2026-08-11T16:00:00.000Z',
      end: '2026-08-11T18:00:00.000Z',
      cat: 'museums',
      price: PriceLevel.BUDGET,
    },
    {
      title: 'Mezraya wind morning',
      summary: 'Beach sports weather window (seasonal).',
      placeSlug: 'plage-mezraya',
      start: '2026-08-12T08:00:00.000Z',
      end: '2026-08-12T11:00:00.000Z',
      cat: 'activities',
      price: PriceLevel.MODERATE,
    },
  ];

  for (const e of eventDefs) {
    await prisma.event.create({
      data: {
        cityId,
        placeId: places[e.placeSlug],
        title: e.title,
        summary: e.summary,
        startsAt: new Date(e.start),
        endsAt: new Date(e.end),
        categoryId: cats[e.cat],
        priceLevel: e.price ?? PriceLevel.FREE,
        verificationStatus: VerificationStatus.APPROVED,
        createdByUserId: adminUserId,
      },
    });
  }

  // Guide-authored tips, rules, events, experience (zone knowledge demo)
  await prisma.howToGuide.create({
    data: {
      cityId,
      countryId,
      title: 'How taxis & louage work in Djerba (Guide tip)',
      summary:
        'Airport official rank; in town agree fare or use meter; louage for island hops from known ranks.',
      categoryKey: 'transport_tip',
      verificationStatus: VerificationStatus.APPROVED,
      lastReviewedAt: REVIEWED,
      createdByUserId: guideUserId,
    },
  });
  await prisma.howToGuide.create({
    data: {
      cityId,
      countryId,
      title: 'Where to rent longer-term in Midoun (Guide tip)',
      summary:
        'Look slightly inland from the hotel strip for quieter weekly apartments; always check summer noise.',
      categoryKey: 'rental_tip',
      verificationStatus: VerificationStatus.APPROVED,
      lastReviewedAt: REVIEWED,
      createdByUserId: guideUserId,
    },
  });

  await prisma.localRule.create({
    data: {
      scope: RuleScope.CITY,
      countryId,
      cityId,
      category: RuleCategory.SAFETY,
      severity: RuleSeverity.IMPORTANT,
      audience: 'ALL',
      title: 'Isolated beaches after dark (Guide note)',
      summary:
        'Avoid empty stretches alone after sunset — prefer lit promenades and known hotel zones.',
      details: 'Demo Guide LocalRule — not a map polygon; surfaces in AI/rules.',
      sourceType: SourceType.GUIDE_VERIFIED,
      verificationStatus: VerificationStatus.APPROVED,
      lastReviewedAt: REVIEWED,
      createdByUserId: guideUserId,
    },
  });
  await prisma.localRule.create({
    data: {
      scope: RuleScope.CITY,
      countryId,
      cityId,
      category: RuleCategory.HOUSING,
      severity: RuleSeverity.INFO,
      audience: 'ALL',
      title: 'Camping etiquette (Guide note)',
      summary:
        'Ask permission, carry water out, avoid dunes with nesting birds, never block beach access.',
      sourceType: SourceType.GUIDE_VERIFIED,
      verificationStatus: VerificationStatus.APPROVED,
      lastReviewedAt: REVIEWED,
      createdByUserId: guideUserId,
    },
  });

  const guideEvents = [
    {
      title: 'Guide sunset walk — Ras Rmal (demo)',
      summary: 'Meet for golden-hour walk; flamingo season varies.',
      placeSlug: 'guide-sunset-ras-rmal',
      start: '2026-08-15T17:30:00.000Z',
      end: '2026-08-15T19:00:00.000Z',
      cat: 'activities',
    },
    {
      title: 'Guide budget souk hour (demo)',
      summary: 'Cheap finds + bargaining tips with the Guide.',
      placeSlug: 'guide-budget-shop-hs',
      start: '2026-08-16T10:00:00.000Z',
      end: '2026-08-16T11:30:00.000Z',
      cat: 'budget_shops',
    },
    {
      title: 'Guide beach pick day — Sidi Mahrez (demo)',
      summary: 'Calm-water morning swim recommendation.',
      placeSlug: 'guide-beach-sejoumi-rated',
      start: '2026-08-17T09:00:00.000Z',
      end: '2026-08-17T12:00:00.000Z',
      cat: 'beaches',
    },
  ];
  for (const e of guideEvents) {
    await prisma.event.create({
      data: {
        cityId,
        placeId: places[e.placeSlug],
        title: e.title,
        summary: e.summary,
        startsAt: new Date(e.start),
        endsAt: new Date(e.end),
        categoryId: cats[e.cat],
        priceLevel: PriceLevel.FREE,
        verificationStatus: VerificationStatus.APPROVED,
        createdByUserId: guideUserId,
        metadata: { pack: PACK, guideDemo: true },
      },
    });
  }

  await prisma.experience.create({
    data: {
      cityId,
      title: 'Guide golden-hour micro trip (demo)',
      summary: 'Budget souk stop then Ras Rmal sunset — Guide curated.',
      description: 'Fake Guide experience for historic + AI grounding tests.',
      durationMin: 180,
      priceLevel: PriceLevel.BUDGET,
      audience: 'TOURIST',
      verificationStatus: VerificationStatus.APPROVED,
      createdByUserId: guideUserId,
      steps: {
        create: [
          {
            stepOrder: 1,
            title: 'Bargain lane',
            placeId: places['guide-budget-shop-hs'],
            estimatedTimeMin: 45,
          },
          {
            stepOrder: 2,
            title: 'Sunset walk',
            placeId: places['guide-sunset-ras-rmal'],
            estimatedTimeMin: 90,
          },
        ],
      },
    },
  });

  const experiences: Array<{
    title: string;
    summary: string;
    durationMin: number;
    price: PriceLevel;
    steps: Array<{ title: string; placeSlug: string; min: number }>;
  }> = [
    {
      title: 'Half-day pottery & beach (fake)',
      summary: 'Guellala pottery stop then Aghir beach time.',
      durationMin: 240,
      price: PriceLevel.MODERATE,
      steps: [
        { title: 'Guellala workshops', placeSlug: 'guellala-pottery', min: 90 },
        { title: 'Aghir beach unwind', placeSlug: 'plage-aghir', min: 120 },
      ],
    },
    {
      title: '48h classic Djerba starter',
      summary: 'Souk + harbour day, then beach + Midoun evening.',
      durationMin: 2880,
      price: PriceLevel.MODERATE,
      steps: [
        { title: 'Houmt Souk medina', placeSlug: 'souk-houmt-souk', min: 120 },
        { title: 'Harbour café', placeSlug: 'cafe-harbour', min: 45 },
        { title: 'Sidi Mahrez beach', placeSlug: 'plage-sejoumi', min: 150 },
        { title: 'Midoun evening', placeSlug: 'nightlife-midoun', min: 90 },
      ],
    },
    {
      title: 'Family half-day (shade + sand)',
      summary: 'Short museum/fort stop then family beach time.',
      durationMin: 210,
      price: PriceLevel.BUDGET,
      steps: [
        { title: 'Fort surroundings', placeSlug: 'park-borj-el-kebir', min: 60 },
        { title: 'Family beach', placeSlug: 'plage-sejoumi', min: 120 },
      ],
    },
    {
      title: 'Student budget food crawl',
      summary: 'Local plates without hotel-front prices.',
      durationMin: 180,
      price: PriceLevel.BUDGET,
      steps: [
        { title: 'Student menu lunch', placeSlug: 'restaurant-student-menu', min: 60 },
        { title: 'Spice stall wander', placeSlug: 'shop-spices-hs', min: 45 },
        { title: 'Quiet café', placeSlug: 'cafe-place-publique', min: 45 },
      ],
    },
    {
      title: 'Sunset beach circuit',
      summary: 'Best-light beaches for photos and walks.',
      durationMin: 180,
      price: PriceLevel.FREE,
      steps: [
        { title: 'Ras Rmel sunset', placeSlug: 'plage-ras-errmel', min: 90 },
        { title: 'Harbour terrace wind-down', placeSlug: 'nightlife-harbour-terrace', min: 60 },
      ],
    },
    {
      title: 'Art village morning',
      summary: 'Erriadh murals + craft shops before heat.',
      durationMin: 180,
      price: PriceLevel.BUDGET,
      steps: [
        { title: 'Street art lanes', placeSlug: 'museum-djerbahood', min: 90 },
        { title: 'Craft browse', placeSlug: 'shop-pottery-erriadh', min: 45 },
        { title: 'Art café', placeSlug: 'cafe-erriadh', min: 30 },
      ],
    },
  ];

  for (const xp of experiences) {
    const exp = await prisma.experience.create({
      data: {
        cityId,
        title: xp.title,
        summary: xp.summary,
        durationMin: xp.durationMin,
        priceLevel: xp.price,
        audience: 'ALL',
        verificationStatus: VerificationStatus.APPROVED,
        createdByUserId: adminUserId,
      },
    });
    await prisma.experienceStep.createMany({
      data: xp.steps.map((s, i) => ({
        experienceId: exp.id,
        stepOrder: i + 1,
        title: s.title,
        placeId: places[s.placeSlug],
        estimatedTimeMin: s.min,
      })),
    });
  }

  await prisma.city.update({
    where: { id: cityId },
    data: { contentPackVersion: PACK },
  });

  return {
    pack: PACK,
    placeCount: placeDefs.length,
    airportPlaceId: places['djerba-zarzis-airport'],
    taxiSystemId: taxi.id,
    arrivalGuideId: arrival.id,
    survivalGuideId: survival.id,
  };
}
