import dns from 'node:dns';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, {
  type Transporter,
  type TransportOptions,
} from 'nodemailer';
import { formatTime12Hour } from '../common/date-time.util.js';

dns.setDefaultResultOrder('ipv4first');

export interface AssignmentEmailData {
  to: string;
  actorName: string;
  productionTitle: string;
  rehearsalTitle: string;
  roleName: string;
  rehearsalDate: string;
  startTime: string;
  endTime: string;
  location: string | null;
  notes: string | null;
}

export interface RehearsalUpdateEmailData {
  to: string;
  actorName: string;
  rehearsalTitle: string;
  rehearsalDate: string;
  startTime: string;
  endTime: string;
  location: string | null;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('MAIL_HOST', '');
    const port = Number(this.config.get<string>('MAIL_PORT', '465'));
    const user = this.config.get<string>('MAIL_USER', '');
    const pass = this.config.get<string>('MAIL_PASS', '');

    this.fromAddress = user;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
        family: 4,
      } as TransportOptions);
    } else {
      this.transporter = null;
    }
  }

  async sendAssignmentNotification(data: AssignmentEmailData): Promise<void> {
    if (!this.transporter) {
      return;
    }

    const start = formatTime12Hour(data.startTime);
    const end = formatTime12Hour(data.endTime);

    const lines = [
      `Hi ${data.actorName},`,
      '',
      'You have been assigned to a rehearsal in RoleCall.',
      '',
      `Production: ${data.productionTitle}`,
      `Rehearsal: ${data.rehearsalTitle}`,
      `Role: ${data.roleName}`,
      `Date: ${data.rehearsalDate}`,
      `Time: ${start} - ${end}`,
      `Location: ${data.location ?? 'TBA'}`,
    ];

    if (data.notes) {
      lines.push(`Notes: ${data.notes}`);
    }

    lines.push('', 'Please check RoleCall to view your full schedule.');

    await this.sendMail(
      data.to,
      `RoleCall: New Rehearsal Assignment - ${data.rehearsalTitle}`,
      lines.join('\n'),
    );
  }

  async sendRehearsalUpdateNotification(
    data: RehearsalUpdateEmailData,
  ): Promise<void> {
    if (!this.transporter) {
      return;
    }

    const start = formatTime12Hour(data.startTime);
    const end = formatTime12Hour(data.endTime);

    const text = [
      `Hi ${data.actorName},`,
      '',
      'A rehearsal you are assigned to has been updated.',
      '',
      `Rehearsal: ${data.rehearsalTitle}`,
      `Date: ${data.rehearsalDate}`,
      `Time: ${start} - ${end}`,
      `Location: ${data.location ?? 'TBA'}`,
      '',
      'Please check RoleCall for the latest details.',
    ].join('\n');

    await this.sendMail(
      data.to,
      `RoleCall: Rehearsal Schedule Updated - ${data.rehearsalTitle}`,
      text,
    );
  }

  private async sendMail(
    to: string,
    subject: string,
    text: string,
  ): Promise<void> {
    if (!this.transporter) {
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `RoleCall <${this.fromAddress}>`,
        to,
        subject,
        text,
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to send email to ${to}: ${msg}`);
    }
  }
}
