import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendTemplateInput {
  toE164: string;
  templateName?: string;
  languageCode?: string;
  bodyParameters?: string[];
}

export interface WhatsappSendResult {
  externalMessageId: string;
}

@Injectable()
export class WhatsappCloudService {
  private readonly logger = new Logger(WhatsappCloudService.name);

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return Boolean(
      this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID') &&
        this.config.get<string>('WHATSAPP_ACCESS_TOKEN') &&
        this.config.get<string>('WHATSAPP_TEMPLATE_NAME'),
    );
  }

  async sendTemplateMessage(input: SendTemplateInput): Promise<WhatsappSendResult> {
    const phoneNumberId = this.config.getOrThrow<string>(
      'WHATSAPP_PHONE_NUMBER_ID',
    );
    const accessToken = this.config.getOrThrow<string>(
      'WHATSAPP_ACCESS_TOKEN',
    );
    const graphVersion =
      this.config.get<string>('WHATSAPP_GRAPH_VERSION') ?? 'v21.0';
    const defaultTemplate = this.config.getOrThrow<string>(
      'WHATSAPP_TEMPLATE_NAME',
    );
    const defaultLanguage =
      this.config.get<string>('WHATSAPP_TEMPLATE_LANGUAGE') ?? 'en_US';

    const templateName = input.templateName ?? defaultTemplate;
    const languageCode = input.languageCode ?? defaultLanguage;
    const toDigits = input.toE164.replace(/^\+/, '');

    const components =
      input.bodyParameters && input.bodyParameters.length > 0
        ? [
            {
              type: 'body',
              parameters: input.bodyParameters.map((text) => ({
                type: 'text',
                text,
              })),
            },
          ]
        : undefined;

    const body = {
      messaging_product: 'whatsapp',
      to: toDigits,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(components ? { components } : {}),
      },
    };

    const url = `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      this.logger.error(
        `Network error calling WhatsApp Cloud API: ${(err as Error).message}`,
      );
      throw new HttpException(
        {
          code: 'WHATSAPP_NETWORK_ERROR',
          message: 'No se pudo contactar a Meta WhatsApp API',
        },
        502,
      );
    }

    const text = await res.text();
    if (!res.ok) {
      this.logger.error(
        `WhatsApp Cloud API ${res.status} for template '${templateName}': ${text.slice(0, 400)}`,
      );
      let parsed: { error?: { message?: string; code?: number; type?: string } } | null =
        null;
      try {
        parsed = JSON.parse(text);
      } catch {
        // not JSON; ignore
      }
      throw new HttpException(
        {
          code: 'WHATSAPP_API_ERROR',
          message:
            parsed?.error?.message ??
            `Meta API respondió ${res.status}`,
          metaCode: parsed?.error?.code,
          metaType: parsed?.error?.type,
        },
        502,
      );
    }

    const data = JSON.parse(text) as {
      messages: { id: string }[];
    };
    if (!data.messages?.[0]?.id) {
      throw new HttpException(
        {
          code: 'WHATSAPP_UNEXPECTED_RESPONSE',
          message: 'Meta no devolvió ID de mensaje',
        },
        502,
      );
    }
    return { externalMessageId: data.messages[0].id };
  }
}
