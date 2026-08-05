import { Injectable, Logger } from '@nestjs/common';
import { AiDigestTargetType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OpenRouterClient } from './openrouter.client';
import { RetrievalToolsService, ToolCitation } from './retrieval.tools';
import { SessionContextService } from './session-context.service';
import { ProfileMemoryService } from './profile-memory.service';
import { TokenGovernorService } from './token-governor.service';
import { DigestService } from './digest.service';
import { MemoryCacheService } from '../shared/memory-cache.service';
import { AiFeatureFlagsService, AI_FEATURE_KEYS } from './ai-feature-flags.service';

export type GroundingStatus = 'grounded' | 'partial' | 'fallback';

export type OrchestratorResult = {
  content: string;
  grounding: GroundingStatus;
  citations: ToolCitation[];
  reasons: string[];
  cards: Array<{
    type: string;
    title: string;
    entityType?: string;
    entityId?: string;
  }>;
  meta: {
    modelId: string;
    provider: string;
    latencyMs: number;
    toolCount: number;
    mode: 'openrouter' | 'mock';
    intent: string;
    cacheHit?: boolean;
  };
};

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tools: RetrievalToolsService,
    private readonly openRouter: OpenRouterClient,
    private readonly sessionContext: SessionContextService,
    private readonly profileMemory: ProfileMemoryService,
    private readonly tokenGovernor: TokenGovernorService,
    private readonly digestService: DigestService,
    private readonly cache: MemoryCacheService,
    private readonly featureFlags: AiFeatureFlagsService,
  ) {}

  async getActiveModelConfig() {
    const config = await this.prisma.aiModelConfig.findFirst({
      where: { enabled: true },
      orderBy: { updatedAt: 'desc' },
    });
    return (
      config ?? {
        provider: 'openrouter',
        modelId: 'openai/gpt-4o-mini',
        fallbackModelId: null as string | null,
        enabled: true,
      }
    );
  }

  async answer(input: {
    cityId: string;
    content: string;
    locale?: string;
    lat?: number;
    lng?: number;
    gpsAccurate?: boolean;
    userId?: string;
  }): Promise<OrchestratorResult> {
    const started = Date.now();
    const intent = this.routeIntent(input.content);
    const tokenGovernorOn = await this.featureFlags.isEnabled(
      AI_FEATURE_KEYS.tokenGovernor,
      input.userId,
    );

    const budget =
      input.userId != null && tokenGovernorOn
        ? await this.tokenGovernor.canSpend(input.userId)
        : { allowed: true, used: 0, remaining: 0 };
    if (!budget.allowed) {
      return {
        content:
          'Your AI budget is reached for today. I can still help with deterministic plan tools and verified local data.',
        grounding: 'fallback',
        citations: [],
        reasons: ['Daily token budget reached'],
        cards: [],
        meta: {
          modelId: 'none',
          provider: 'local',
          latencyMs: Date.now() - started,
          toolCount: 0,
          mode: 'mock',
          intent,
        },
      };
    }

    // Greetings / small talk need no knowledge retrieval — never say "no verified data"
    if (intent === 'greeting' || intent === 'smalltalk') {
      const content = this.conversationalReply(input.content, intent, input.locale);
      return {
        content,
        grounding: 'grounded',
        citations: [],
        reasons: ['Conversational reply — no knowledge lookup needed'],
        cards: [],
        meta: {
          modelId: 'deterministic',
          provider: 'local',
          latencyMs: Date.now() - started,
          toolCount: 0,
          mode: 'mock',
          intent,
        },
      };
    }

    let blockAdultNightlife = false;
    let conservatismLevel: string | null = null;
    if (input.userId) {
      const prefs = await this.prisma.userPreference.findUnique({
        where: { userId: input.userId },
        select: { hardFiltersJson: true, conservatismLevel: true },
      });
      if (prefs) {
        const hard = (prefs.hardFiltersJson ?? {}) as Record<string, unknown>;
        blockAdultNightlife = Boolean(hard.blockAdultNightlife);
        conservatismLevel = prefs.conservatismLevel;
      }
    }

    const retrieved = await this.tools.retrieveForQuestion({
      cityId: input.cityId,
      content: input.content,
      lat: input.lat,
      lng: input.lng,
      gpsAccurate: input.gpsAccurate,
      filters: { blockAdultNightlife },
    });

    const digestCards = await Promise.all(
      retrieved.citations.slice(0, 3).map(async (c) => {
        const targetType =
          c.entityType === 'place'
            ? 'PLACE'
            : c.entityType === 'transport_system'
              ? 'TRANSPORT_SYSTEM'
              : null;
        if (!targetType) return null;
        return this.digestService.getDigest(
          targetType as AiDigestTargetType,
          c.entityId,
        );
      }),
    );

    const modelConfig = await this.getActiveModelConfig();
    const reasons: string[] = [];
    if (retrieved.citations.length > 0) {
      reasons.push('Retrieved APPROVED local knowledge for this city');
    }
    if (retrieved.asksUnknownPlace) {
      reasons.push('No matching APPROVED place found — refusing to invent');
    }
    if (blockAdultNightlife) {
      reasons.push('Applied hard filter: blockAdultNightlife');
    }

    const cards = retrieved.citations.slice(0, 6).map((c) => ({
      type: 'citation',
      title: c.title,
      entityType: c.entityType,
      entityId: c.entityId,
    }));

    const preferenceInstructions: string[] = [];
    if (blockAdultNightlife) {
      preferenceInstructions.push(
        'Hard filter: never recommend adult nightlife venues or nightlife-oriented bars/clubs.',
      );
    }
    if (conservatismLevel) {
      preferenceInstructions.push(
        `User conservatism level: ${conservatismLevel}. Match tone and venue choices accordingly (STRICT/CONSERVATIVE = family-safe, modest venues; OPEN = broader options).`,
      );
    }

    const [effectiveContext, profileCard] = input.userId
      ? await Promise.all([
          this.featureFlags
            .isEnabled(AI_FEATURE_KEYS.sessionContext, input.userId)
            .then((on) =>
              on
                ? this.sessionContext.getEffectiveContext(input.userId!)
                : Promise.resolve(null),
            ),
          this.featureFlags
            .isEnabled(AI_FEATURE_KEYS.profileMemory, input.userId)
            .then((on) =>
              on
                ? this.profileMemory.getProfileCard(input.userId!)
                : Promise.resolve(null),
            ),
        ])
      : [null, null];

    const digestSummary = digestCards
      .filter(Boolean)
      .map((d: { summaryText: string | null } | null) => d?.summaryText)
      .filter(Boolean)
      .join('\n');
    const cacheKey = `ai:${input.cityId}:${input.userId ?? 'anon'}:${intent}:${this.hash(
      input.content,
    )}:${this.hash(JSON.stringify(effectiveContext ?? {}))}`;
    const cached = this.cache.get<OrchestratorResult>(cacheKey);
    if (cached) {
      return {
        ...cached,
        meta: {
          ...cached.meta,
          cacheHit: true,
        },
      };
    }

    const highConfidenceDeterministic =
      (intent === 'faq' || intent === 'deterministic-plan') &&
      retrieved.citations.length >= 2 &&
      !retrieved.asksUnknownPlace;
    if (highConfidenceDeterministic) {
      const content = this.mockAnswer(input.content, retrieved);
      const response: OrchestratorResult = {
        content,
        grounding: 'grounded',
        citations: retrieved.citations,
        reasons: [...reasons, 'Skipped LLM — high-confidence deterministic answer'],
        cards,
        meta: {
          modelId: 'deterministic',
          provider: 'local',
          latencyMs: Date.now() - started,
          toolCount: retrieved.citations.length,
          mode: 'mock',
          intent,
        },
      };
      this.cache.set(cacheKey, response, 60_000);
      return response;
    }

    // Prefer OpenRouter when configured; always fall back to deterministic grounding
    if (this.openRouter.isConfigured() && modelConfig.enabled) {
      try {
        const system = [
          'You are LocalLife, a friendly local companion for Djerba/Tunisia.',
          'For greetings and chit-chat: reply warmly and invite the user to ask about taxis, arrival, pharmacies, food, or a day plan. Never say you lack verified data for a hello.',
          'For factual local questions: use ONLY the provided JSON knowledge. Never invent places, prices, or phone numbers.',
          'Answer the user question first. Do NOT open every reply with location/distance.',
          'If knowledge.userLocation.nearestDistrict is present: answer where-am-I using that district and distanceKm. NEVER ask the user to enable GPS in that case.',
          'Mention district/distance ONLY when the question is about where they are / nearby area.',
          'Only ask to enable GPS if the user asks where they are AND knowledge.userLocation is missing.',
          'If knowledge.gpsAccurate is false, say the area is approximate (city centre fallback) and suggest enabling precise GPS.',
          'If knowledge.districts is present but userLocation is missing, list main districts briefly.',
          'If knowledge.transport is present, answer taxi/louage questions from it (prices, how it works, warnings). Mention nearbyTransportHubs only when useful for the question.',
          'If knowledge.budgetHint is present, prioritize cheap options (louage, walk, budget food) and be concrete about ~20 TND constraints.',
          'If knowledge is empty for a factual question, say you do not have verified data yet and suggest categories (taxi, pharmacy, arrival, restaurants).',
          'Do not present rules as formal legal advice.',
          `Reply in the user locale when possible. Locale hint: ${input.locale ?? 'en'}`,
          'Keep answers concise and practical. Mention entity names that appear in knowledge.',
          'Prefer fresher / nearer places (distanceKm, freshnessScore) when ranking suggestions.',
          `Intent route: ${intent}`,
          `Effective context: ${JSON.stringify(effectiveContext ?? {}).slice(0, 700)}`,
          `Profile card: ${JSON.stringify(profileCard?.card ?? {}).slice(0, 700)}`,
          digestSummary ? `Digest summary: ${digestSummary.slice(0, 1000)}` : '',
          ...preferenceInstructions,
        ].join('\n');

        const bounds = this.tokenGovernor.getBounds();
        const userPayload = [
          `Question: ${input.content}`,
          `Knowledge JSON: ${this.tokenGovernor.trimToBudget(
            JSON.stringify(retrieved.pack),
            Math.floor(bounds.maxInputTokens * 0.75),
          )}`,
        ].join('\n\n');

        const result = await this.openRouter.chat({
          modelId: modelConfig.modelId,
          maxTokens: bounds.maxOutputTokens,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userPayload },
          ],
        });

        const grounding: GroundingStatus =
          retrieved.asksUnknownPlace || retrieved.citations.length === 0
            ? retrieved.citations.length === 0
              ? 'fallback'
              : 'partial'
            : 'grounded';

        const response: OrchestratorResult = {
          content: result.content || this.mockAnswer(input.content, retrieved),
          grounding,
          citations: retrieved.citations,
          reasons,
          cards,
          meta: {
            modelId: result.model,
            provider: modelConfig.provider,
            latencyMs: result.latencyMs,
            toolCount: retrieved.citations.length,
            mode: 'openrouter',
            intent,
          },
        };
        if (input.userId && tokenGovernorOn) {
          const promptTokens =
            result.usage?.promptTokens ??
            this.tokenGovernor.approximateTokens(`${system}\n${userPayload}`);
          const completionTokens =
            result.usage?.completionTokens ??
            this.tokenGovernor.approximateTokens(response.content);
          await this.tokenGovernor.recordUsage({
            userId: input.userId,
            provider: modelConfig.provider,
            modelId: result.model,
            intentType: intent,
            promptTokens,
            completionTokens,
            latencyMs: result.latencyMs,
          });
        }
        this.cache.set(cacheKey, response, 60_000);
        return response;
      } catch (err) {
        this.logger.warn(
          `OpenRouter failed, using mock grounding: ${String(err)}`,
        );
        if (modelConfig.fallbackModelId && this.openRouter.isConfigured()) {
          try {
            const fallback = await this.openRouter.chat({
              modelId: modelConfig.fallbackModelId,
              messages: [
                {
                  role: 'system',
                  content:
                    'You are LocalLife fallback model. Keep answer short and grounded in provided JSON only.',
                },
                {
                  role: 'user',
                  content: `Question: ${input.content}\nKnowledge: ${JSON.stringify(
                    retrieved.pack,
                  ).slice(0, 7000)}`,
                },
              ],
              maxTokens: Math.floor(this.tokenGovernor.getBounds().maxOutputTokens * 0.8),
            });
            return {
              content: fallback.content || this.mockAnswer(input.content, retrieved),
              grounding:
                retrieved.citations.length > 0 ? 'grounded' : 'fallback',
              citations: retrieved.citations,
              reasons: [...reasons, 'Primary model failed; fallback model used'],
              cards,
              meta: {
                modelId: fallback.model,
                provider: modelConfig.provider,
                latencyMs: fallback.latencyMs,
                toolCount: retrieved.citations.length,
                mode: 'openrouter',
                intent,
              },
            };
          } catch {
            reasons.push('Primary and fallback model unavailable');
          }
        }
        reasons.push('OpenRouter unavailable — used grounded mock answer');
      }
    }

    const content = this.mockAnswer(input.content, retrieved);
    const grounding: GroundingStatus = retrieved.asksUnknownPlace
      ? 'fallback'
      : retrieved.citations.length > 0
        ? 'grounded'
        : 'fallback';

    return {
      content,
      grounding,
      citations: retrieved.citations,
      reasons,
      cards,
      meta: {
        modelId: modelConfig.modelId,
        provider: modelConfig.provider,
        latencyMs: Date.now() - started,
        toolCount: retrieved.citations.length,
        mode: 'mock',
        intent,
      },
    };
  }

  private routeIntent(content: string) {
    const q = content.trim().toLowerCase();
    if (
      /^(hi|hello|hey|salut|bonjour|bonsoir|hola|salam|مرحبا|اهلا|أهلا|السلام|صباح|مساء)[\s!.؟?]*$/i.test(
        q,
      ) ||
      /^(hi|hello|hey|salut|bonjour)\b.{0,20}$/i.test(q)
    ) {
      return 'greeting';
    }
    if (
      /^(thanks|thank you|merci|ok|okay|yes|no|yep|nope|👍|تمام|شكرا|merci beaucoup)[\s!.]*$/i.test(
        q,
      ) ||
      /(i didn't understand|i dont understand|i don't understand|what do you mean|like what)/i.test(
        q,
      )
    ) {
      return 'smalltalk';
    }
    if (/(plan|route|timeline|station|transport|تاكسي|طاكسي|لواج|الواج|نقل|خطة|نهار|journée)/i.test(q))
      return 'deterministic-plan';
    if (/(closed|wrong|unsafe|problem|issue|danger|خطر|مغلق)/i.test(q))
      return 'report-signal';
    if (
      /(what|where|when|how|price|open|كيف|فين|وين|أين|شنوة|شنية|موجود|سعر|prix|comment|où|دينار|فلوس|budget|كم)/i.test(
        q,
      )
    )
      return 'faq';
    return 'full-llm';
  }

  private conversationalReply(
    content: string,
    intent: string,
    locale?: string,
  ) {
    const lang = (locale ?? 'en').toLowerCase();
    const isAr = lang.startsWith('ar');
    const isFr = lang.startsWith('fr');
    const q = content.trim().toLowerCase();

    if (intent === 'greeting') {
      if (isAr) {
        return 'أهلاً بك! أنا رفيقك المحلي في جربة. اسألني عن التاكسي، الوصول، الصيدليات، المطاعم، أو خطّة ليومك.';
      }
      if (isFr) {
        return 'Bonjour ! Je suis votre compagnon local à Djerba. Demandez-moi un taxi, l’arrivée, une pharmacie, un restaurant, ou un plan pour la journée.';
      }
      return 'Hi! I’m your LocalLife companion for Djerba. Ask me about taxis, arrival, pharmacies, food, or a day plan.';
    }

    if (/(like what|what can|what do you)/i.test(q)) {
      if (isAr) {
        return 'مثلاً: تاكسي من المطار، أقرب صيدلية، مطعم هادئ، أو خطّة لنصف يوم في ميدون.';
      }
      if (isFr) {
        return 'Par exemple : taxi depuis l’aéroport, pharmacie proche, restaurant calme, ou un demi-journée à Midoun.';
      }
      return 'For example: airport taxi, nearest pharmacy, a calm restaurant, or a half-day plan in Midoun.';
    }

    if (/(understand|comprend|فهم)/i.test(q)) {
      if (isAr) {
        return 'لا بأس — قل لي ماذا تحتاج: تنقل، مكان، طعام، أو خطّة؟';
      }
      if (isFr) {
        return 'Pas de souci — dites-moi ce dont vous avez besoin : transport, lieu, nourriture, ou un plan ?';
      }
      return 'No problem — tell me what you need: transport, a place, food, or a plan?';
    }

    if (isAr) return 'حاضر — كيف أقدر أساعدك في جربة؟';
    if (isFr) return 'Bien sûr — comment puis-je vous aider à Djerba ?';
    return 'Sure — how can I help you in Djerba?';
  }

  private hash(value: string) {
    let h = 0;
    for (let i = 0; i < value.length; i += 1) {
      h = (h << 5) - h + value.charCodeAt(i);
      h |= 0;
    }
    return `${Math.abs(h)}`;
  }

  private mockAnswer(
    question: string,
    retrieved: {
      pack: Record<string, unknown>;
      citations: ToolCitation[];
      asksUnknownPlace: boolean;
    },
  ) {
    if (retrieved.asksUnknownPlace) {
      return (
        'I could not find any verified LocalLife place matching that name in Djerba. ' +
        'I will not invent venues — try a nearby category like pharmacies, beaches, or restaurants.'
      );
    }

    const parts: string[] = [];
    const q = question.toLowerCase();
    const isLocationQuestion =
      /where\s+am\s+i|where\s+i\s+am|منطق|منطقة|فين انا|وين انا|أين أنا|ou suis|quelle zone|شنو اسم منطقة|eara|my location|exactly where/.test(
        q,
      );

    const userLocation = retrieved.pack.userLocation as
      | {
          lat?: number;
          lng?: number;
          nearestDistrict?: {
            name: string;
            slug: string;
            distanceKm: number;
          } | null;
        }
      | undefined;
    if (isLocationQuestion && userLocation?.nearestDistrict) {
      const d = userLocation.nearestDistrict;
      parts.push(
        `**Your area** — nearest district: ${d.name} (~${d.distanceKm} km from your GPS).`,
      );
    }

    const arrival = retrieved.pack.arrivalGuide as
      | {
          title: string;
          steps: Array<{
            stepOrder: number;
            title: string;
            description: string;
          }>;
        }
      | undefined;
    if (arrival) {
      parts.push(`**${arrival.title}**`);
      for (const s of arrival.steps.slice(0, 6)) {
        parts.push(`${s.stepOrder}. ${s.title} — ${s.description}`);
      }
    }

    const transport = retrieved.pack.transport as
      | Array<{
          name: string;
          mode?: string;
          summary?: string;
          pricingType: string;
          priceMin?: unknown;
          priceMax?: unknown;
          currency?: string;
          paymentMethods: string[];
          warnings?: string[];
          routes: Array<{
            from: string;
            to: string;
            priceMin: unknown;
            priceMax: unknown;
            currency: string;
          }>;
        }>
      | undefined;
    if (transport?.length) {
      parts.push('**Transport options (verified)**');
      for (const t of transport.slice(0, 3)) {
        const priceBit =
          t.priceMin != null || t.priceMax != null
            ? ` ~${String(t.priceMin ?? '?')}-${String(t.priceMax ?? '?')} ${t.currency ?? 'TND'}`
            : '';
        parts.push(
          `- ${t.name}: pricing ${t.pricingType}${priceBit}; payments ${(t.paymentMethods ?? []).join(', ') || 'cash'}`,
        );
        if (t.summary) parts.push(`  · ${t.summary}`);
        const midoun = t.routes?.find((r) =>
          r.to.toLowerCase().includes('midoun'),
        );
        if (midoun) {
          parts.push(
            `  · Route ${midoun.from} → ${midoun.to}: about ${String(midoun.priceMin)}-${String(midoun.priceMax)} ${midoun.currency}`,
          );
        }
      }
    }

    const nearbyHubs = retrieved.pack.nearbyTransportHubs as
      | Array<{ name: string; summary: string; distanceKm?: number }>
      | undefined;
    if (nearbyHubs?.length) {
      parts.push('**Nearby transport hubs**');
      for (const p of nearbyHubs.slice(0, 4)) {
        const dist =
          p.distanceKm != null ? ` (~${p.distanceKm} km)` : '';
        parts.push(`- ${p.name}${dist}: ${p.summary}`);
      }
    }

    const pharmacies = retrieved.pack.pharmacies as
      Array<{ name: string; summary: string; distanceKm?: number }> | undefined;
    if (pharmacies?.length) {
      parts.push('**Pharmacies**');
      for (const p of pharmacies.slice(0, 3)) {
        const dist =
          p.distanceKm != null ? ` (~${p.distanceKm} km)` : '';
        parts.push(`- ${p.name}${dist}: ${p.summary}`);
      }
    }

    const hospitals = retrieved.pack.hospitals as
      Array<{ name: string; summary: string }> | undefined;
    if (hospitals?.length) {
      parts.push('**Hospitals / clinics**');
      for (const p of hospitals.slice(0, 3)) {
        parts.push(`- ${p.name}: ${p.summary}`);
      }
    }

    const food = retrieved.pack.food as
      Array<{ name: string; summary: string }> | undefined;
    if (food?.length) {
      parts.push('**Food & cafés**');
      for (const p of food.slice(0, 4)) {
        parts.push(`- ${p.name}: ${p.summary}`);
      }
    }

    const rules = retrieved.pack.rules as
      Array<{ severity: string; title: string; summary: string }> | undefined;
    if (rules?.length) {
      parts.push('**Local practical notes** (not legal advice)');
      for (const r of rules.slice(0, 4)) {
        parts.push(`- [${r.severity}] ${r.title}: ${r.summary}`);
      }
    }

    const howTo = retrieved.pack.howTo as
      Array<{ title: string; summary: string }> | undefined;
    if (howTo?.length) {
      parts.push(`**${howTo[0].title}** — ${howTo[0].summary}`);
    }

    const nearbyPlaces = retrieved.pack.nearbyPlaces as
      | Array<{ name: string; summary: string; distanceKm?: number }>
      | undefined;
    if (nearbyPlaces?.length) {
      parts.push('**Nearby places**');
      for (const p of nearbyPlaces.slice(0, 5)) {
        const dist =
          p.distanceKm != null ? ` (~${p.distanceKm} km)` : '';
        parts.push(`- ${p.name}${dist}: ${p.summary}`);
      }
    }

    const places = retrieved.pack.places as
      Array<{ name: string; summary: string }> | undefined;
    if (places?.length) {
      parts.push('**Related places**');
      for (const p of places.slice(0, 5)) {
        parts.push(`- ${p.name}: ${p.summary}`);
      }
    }

    if (parts.length === 0) {
      return (
        'I do not have enough verified LocalLife data to answer that yet for this city. ' +
        `Question received: “${question.slice(0, 120)}”. Try asking about arrival, taxis, pharmacies, or safety.`
      );
    }

    return parts.join('\n');
  }
}
