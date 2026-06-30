import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Wysyłka e-maili — ZAŚLEPKA gotowa pod podpięcie dostawcy (Resend / SMTP / SendGrid).
 *
 * Obecnie nie wysyła realnie nic: loguje treść i link do konsoli backendu,
 * dzięki czemu cały przepływ (reset hasła / weryfikacja) działa end-to-end w dev.
 *
 * Aby podłączyć realną wysyłkę: zaimplementuj `deliver()` (np. klient Resend/nodemailer)
 * i ustaw klucze w .env. Reszta kodu pozostaje bez zmian.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendPasswordReset(email: string, resetUrl: string): Promise<void> {
    this.logger.warn(`[MAIL:RESET_HASLA] -> ${email}\n  Link: ${resetUrl}`);
    await this.deliver(email, 'Reset hasła — ModaMarket', `Aby ustawić nowe hasło, kliknij: ${resetUrl}\nLink wygasa po 1 godzinie.`);
  }

  async sendEmailVerification(email: string, verifyUrl: string): Promise<void> {
    this.logger.warn(`[MAIL:WERYFIKACJA_EMAIL] -> ${email}\n  Link: ${verifyUrl}`);
    await this.deliver(email, 'Potwierdź adres e-mail — ModaMarket', `Potwierdź swój adres e-mail, klikając: ${verifyUrl}\nLink wygasa po 24 godzinach.`);
  }

  /**
   * Realna wysyłka — do podpięcia.
   * TODO(integracja): klient dostawcy, np.:
   *   await this.resend.emails.send({ from, to, subject, text });
   */
  private async deliver(_to: string, _subject: string, _body: string): Promise<void> {
    // No-op (zaślepka). Treść została już zalogowana powyżej.
    return;
  }
}
