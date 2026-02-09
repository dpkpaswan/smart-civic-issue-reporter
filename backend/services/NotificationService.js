/**
 * Notification Service (v2 — Professional HTML Emails)
 * 
 * Sends responsive HTML email notifications on:
 *   - Issue creation   → professional submission receipt with ETA
 *   - Issue resolution  → before/after images, resolution time, tracking link
 * 
 * Uses Gmail SMTP with App Password.
 * Calculates smart ETA from SLA + department workload + historical averages.
 */

const nodemailer = require('nodemailer');
const dns = require('dns');
const { supabase } = require('../config/database');
const { submissionEmailTemplate, resolutionEmailTemplate } = require('./EmailTemplates');

// Force IPv4 DNS resolution — fixes SMTP timeouts on Render/cloud platforms
// where IPv6 routes to external hosts silently fail
dns.setDefaultResultOrder('ipv4first');

class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.emailEnabled = false;
    this.initTransporter();

    // SLA hours per category (mirrors DepartmentService.routingRules)
    this.slaHours = {
      pothole: 48, garbage: 24, water: 12, streetlight: 24,
      traffic: 48, graffiti: 72, sidewalk: 48, other: 168
    };
  }

  // ─── Initialisation ─────────────────────────────────────────────

  async initTransporter() {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.log('📧 Email notifications DISABLED — EMAIL_USER / EMAIL_PASS not configured in .env');
      console.log('   To enable: set EMAIL_USER=your_gmail@gmail.com and EMAIL_PASS=your_app_password');
      return;
    }

    // Try port 465 (direct SSL) first, then fall back to port 587 (STARTTLS)
    const smtpConfigs = [
      {
        name: 'SSL (port 465)',
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: 465,
        secure: true,
      },
      {
        name: 'STARTTLS (port 587)',
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: 587,
        secure: false,
      }
    ];

    for (const config of smtpConfigs) {
      try {
        console.log(`📧 Trying ${config.name} → ${config.host}:${config.port} ...`);

        this.emailTransporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: { user: emailUser, pass: emailPass },
          connectionTimeout: 15000,
          greetingTimeout: 15000,
          socketTimeout: 20000,
          pool: true,
          maxConnections: 3,
          tls: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
          }
        });

        await this.emailTransporter.verify();
        this.emailEnabled = true;
        console.log(`📧 Email notifications ENABLED via ${config.name} — sending from ${emailUser}`);
        return; // success — stop trying other configs
      } catch (err) {
        console.warn(`📧 ${config.name} failed: ${err.message}`);
        this.emailTransporter = null;
      }
    }

    // All configs failed
    console.error('📧 Email setup FAILED — all SMTP connection methods timed out');
    console.log('   For Gmail: enable 2FA → create App Password at https://myaccount.google.com/apppasswords');
    console.log('   Set EMAIL_PASS to the 16-char app password (not your Gmail password)');
    console.log('   If on Render free tier: outbound SMTP may be blocked — upgrade to paid ($7/mo) or use an HTTP email API');
    this.emailTransporter = null;
    this.emailEnabled = false;
  }

  // ═══════════════════════════════════════════════════════════════
  // ETA CALCULATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Calculate an estimated resolution time for an issue.
   *
   * Algorithm:
   *   base  = SLA hours for the category
   *   load  = number of active (non-resolved) issues in the same department × 1 hr buffer
   *   historical = average resolution hours for the same department (from resolved issues)
   *   ETA  = now + weightedAverage(base + load, historical)
   *
   * Returns an ISO string.
   */
  async calculateETA(issueData) {
    try {
      const category     = (issueData.category || 'other').toLowerCase();
      const deptId       = issueData.assigned_department_id;
      const baseSLAHours = this.slaHours[category] || this.slaHours.other;

      // 1. Count active (open) issues in the same department
      let activeCount = 0;
      if (deptId) {
        const { count, error } = await supabase
          .from('issues')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_department_id', deptId)
          .not('status', 'in', '("resolved","closed","rejected")');
        if (!error && count !== null) activeCount = count;
      }

      // 2. Historical average resolution time for this department
      let historicalAvgHours = null;
      if (deptId) {
        const { data: resolved } = await supabase
          .from('issues')
          .select('submitted_at, resolved_at')
          .eq('assigned_department_id', deptId)
          .eq('status', 'resolved')
          .not('resolved_at', 'is', null)
          .order('resolved_at', { ascending: false })
          .limit(50);

        if (resolved && resolved.length > 0) {
          const durations = resolved
            .filter(r => r.submitted_at && r.resolved_at)
            .map(r => (new Date(r.resolved_at) - new Date(r.submitted_at)) / (1000 * 60 * 60));
          if (durations.length > 0) {
            historicalAvgHours = durations.reduce((a, b) => a + b, 0) / durations.length;
          }
        }
      }

      // 3. Combine: SLA + load buffer, weighted with historical average
      const loadBuffer     = activeCount * 1; // 1 hour per active issue
      const slaEstimate    = baseSLAHours + loadBuffer;
      let finalHours;

      if (historicalAvgHours !== null && historicalAvgHours > 0) {
        // 60 % historical + 40 % SLA-based estimate
        finalHours = Math.round(historicalAvgHours * 0.6 + slaEstimate * 0.4);
      } else {
        finalHours = slaEstimate;
      }

      // Clamp: at least 1 hour, at most 2 × SLA
      finalHours = Math.max(1, Math.min(finalHours, baseSLAHours * 2));

      const eta = new Date();
      eta.setHours(eta.getHours() + finalHours);

      console.log(`📧 ETA calculated: ${finalHours}h (SLA=${baseSLAHours}h, load=${activeCount}, histAvg=${historicalAvgHours?.toFixed(1) || 'N/A'}h)`);
      return eta.toISOString();
    } catch (err) {
      console.warn('📧 ETA calculation failed, using SLA fallback:', err.message);
      const fallback = new Date();
      const category = (issueData.category || 'other').toLowerCase();
      fallback.setHours(fallback.getHours() + (this.slaHours[category] || 168));
      return fallback.toISOString();
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // NOTIFICATION TRIGGERS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Send professional HTML email when a new issue is submitted
   */
  async notifyIssueCreated(issueData) {
    if (!this.emailEnabled) {
      console.log('📧 Skipping issue-created email (email not configured)');
      return { success: true, skipped: true };
    }

    try {
      const citizenEmail = issueData.citizen_email;
      if (!citizenEmail) {
        console.log('📧 No citizen email provided, skipping notification');
        return { success: true, skipped: true };
      }

      // Calculate ETA if not already set
      if (!issueData.estimated_resolution_time) {
        issueData.estimated_resolution_time = await this.calculateETA(issueData);
      }

      // Resolve department name
      if (!issueData.department_name && issueData.departments?.name) {
        issueData.department_name = issueData.departments.name;
      }

      const { subject, html, text } = submissionEmailTemplate(issueData);

      await this.sendHTMLEmail(citizenEmail, subject, html, text);

      await this.storeNotification({
        recipient_email: citizenEmail,
        type: 'issue_created',
        title: subject,
        message: text,
        issue_id: issueData.issue_id || issueData.id
      });

      return { success: true, estimated_resolution_time: issueData.estimated_resolution_time };
    } catch (error) {
      console.error('📧 Issue-created notification failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send professional HTML email when an issue is resolved
   */
  async notifyIssueResolved(issueData) {
    if (!this.emailEnabled) {
      console.log('📧 Skipping issue-resolved email (email not configured)');
      return { success: true, skipped: true };
    }

    try {
      const citizenEmail = issueData.citizen_email;
      if (!citizenEmail) {
        console.log('📧 No citizen email provided, skipping notification');
        return { success: true, skipped: true };
      }

      // Resolve department name
      if (!issueData.department_name && issueData.departments?.name) {
        issueData.department_name = issueData.departments.name;
      }

      const { subject, html, text } = resolutionEmailTemplate(issueData);

      await this.sendHTMLEmail(citizenEmail, subject, html, text);

      await this.storeNotification({
        recipient_email: citizenEmail,
        type: 'issue_resolved',
        title: subject,
        message: text,
        issue_id: issueData.issue_id || issueData.id
      });

      return { success: true };
    } catch (error) {
      console.error('📧 Issue-resolved notification failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Called on status update — sends resolution email when resolved
   */
  async notifyStatusUpdate(issueData, oldStatus, newStatus, updatedBy = null) {
    if (newStatus === 'resolved') {
      return await this.notifyIssueResolved(issueData);
    }
    console.log(`📧 Status changed to "${newStatus}" — no email sent (only resolved triggers email)`);
    return { success: true, skipped: true };
  }

  // ═══════════════════════════════════════════════════════════════
  // CORE EMAIL SENDING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Send an HTML email with plain-text fallback
   */
  async sendHTMLEmail(to, subject, html, text) {
    if (!this.emailTransporter) {
      throw new Error('Email transporter not initialized');
    }

    const result = await this.emailTransporter.sendMail({
      from: `"Smart Civic Reporter" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || '',
      html
    });

    console.log(`📧 Email sent to ${to} — ${result.messageId}`);
    return result;
  }

  /**
   * Legacy plain-text send (kept for retryFailedNotifications compatibility)
   */
  async sendEmail(to, subject, textBody) {
    if (!this.emailTransporter) {
      throw new Error('Email transporter not initialized');
    }

    const result = await this.emailTransporter.sendMail({
      from: `"Smart Civic Reporter" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      text: textBody
    });

    console.log(`📧 Email sent to ${to} — ${result.messageId}`);
    return result;
  }

  async storeNotification(notification) {
    try {
      await supabase.from('notifications').insert([{
        ...notification,
        is_sent: true,
        sent_at: new Date().toISOString()
      }]);
    } catch (err) {
      console.warn('📧 Failed to store notification record:', err.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ADMIN / MAINTENANCE UTILITIES (unchanged)
  // ═══════════════════════════════════════════════════════════════

  async retryFailedNotifications() {
    try {
      const { data: failedNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('status', 'failed')
        .lt('retry_count', 3)
        .order('created_at', { ascending: true })
        .limit(20);

      if (error || !failedNotifications) {
        return { retried: 0, succeeded: 0, failed: 0 };
      }

      let succeeded = 0;
      let failed = 0;

      for (const notification of failedNotifications) {
        try {
          if (notification.channel === 'email' && this.emailEnabled) {
            await this.sendEmail(notification.recipient, notification.subject || 'Notification', notification.message);
            await supabase.from('notifications').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', notification.id);
            succeeded++;
          } else {
            await supabase.from('notifications').update({ retry_count: (notification.retry_count || 0) + 1 }).eq('id', notification.id);
            failed++;
          }
        } catch (e) {
          await supabase.from('notifications').update({ retry_count: (notification.retry_count || 0) + 1 }).eq('id', notification.id);
          failed++;
        }
      }

      return { retried: failedNotifications.length, succeeded, failed };
    } catch (error) {
      console.error('Retry failed notifications error:', error);
      return { retried: 0, succeeded: 0, failed: 0 };
    }
  }

  async getSystemStatus() {
    return {
      email_enabled: this.emailEnabled,
      email_service: process.env.EMAIL_SERVICE || 'gmail',
      status: this.emailEnabled ? 'operational' : 'disabled',
      score: this.emailEnabled ? 100 : 50
    };
  }

  async getNotificationStats() {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('status, channel')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) return { total: 0, sent: 0, failed: 0, pending: 0 };

      return {
        total: data.length,
        sent: data.filter(n => n.status === 'sent').length,
        failed: data.filter(n => n.status === 'failed').length,
        pending: data.filter(n => n.status === 'pending').length
      };
    } catch (error) {
      return { total: 0, sent: 0, failed: 0, pending: 0 };
    }
  }

  async cleanupOldNotifications(daysToKeep = 90) {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysToKeep);

      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoff.toISOString());

      return data?.length || 0;
    } catch (error) {
      console.error('Cleanup notifications error:', error);
      return 0;
    }
  }
}

module.exports = new NotificationService();