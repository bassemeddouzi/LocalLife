import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenRouterClient } from './openrouter.client';
import { RetrievalToolsService, ToolCitation } from './retrieval.tools';

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
  };
};

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tools: RetrievalToolsService,
    private readonly openRouter: OpenRouterClient,
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
  }): Promise<OrchestratorResult> {
    const started = Date.now();
    const retrieved = await this.tools.retrieveForQuestion({
      cityId: input.cityId,
      content: input.content,
      lat: input.lat,
      lng: input.lng,
    });

    const modelConfig = await this.getActiveModelConfig();
    const reasons: string[] = [];
    if (retrieved.citations.length > 0) {
      reasons.push('Retrieved APPROVED local knowledge for this city');
    }
    if (retrieved.asksUnknownPlace) {
      reasons.push('No matching APPROVED place found — refusing to invent');
    }

    const cards = retrieved.citations.slice(0, 6).map((c) => ({
      type: 'citation',
      title: c.title,
      entityType: c.entityType,
      entityId: c.entityId,
    }));

    // Prefer OpenRouter when configured; always fall back to deterministic grounding
    if (this.openRouter.isConfigured() && modelConfig.enabled) {
      try {
        const system = [
          'You are LocalLife, a grounded local companion for Djerba/Tunisia.',
          'Use ONLY the provided JSON knowledge. Never invent places, prices, or phone numbers.',
          'If knowledge is empty or insufficient, say you do not have verified data yet.',
          'Do not present rules as formal legal advice.',
          `User locale hint: ${input.locale ?? 'en'}`,
          'Keep answers concise and practical. Mention entity names that appear in knowledge.',
        ].join('\n');

        const userPayload = [
          `Question: ${input.content}`,
          `Knowledge JSON: ${JSON.stringify(retrieved.pack).slice(0, 12000)}`,
        ].join('\n\n');

        const result = await this.openRouter.chat({
          modelId: modelConfig.modelId,
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

        return {
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
          },
        };
      } catch (err) {
        this.logger.warn(
          `OpenRouter failed, using mock grounding: ${String(err)}`,
        );
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
      },
    };
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
          pricingType: string;
          paymentMethods: string[];
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
      for (const t of transport.slice(0, 2)) {
        parts.push(
          `- ${t.name}: pricing ${t.pricingType}; payments ${t.paymentMethods.join(', ')}`,
        );
        const midoun = t.routes.find((r) =>
          r.to.toLowerCase().includes('midoun'),
        );
        if (midoun) {
          parts.push(
            `  · Route ${midoun.from} → ${midoun.to}: about ${String(midoun.priceMin)}-${String(midoun.priceMax)} ${midoun.currency}`,
          );
        }
      }
    }

    const pharmacies = retrieved.pack.pharmacies as
      Array<{ name: string; summary: string }> | undefined;
    if (pharmacies?.length) {
      parts.push('**Pharmacies**');
      for (const p of pharmacies.slice(0, 3)) {
        parts.push(`- ${p.name}: ${p.summary}`);
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
