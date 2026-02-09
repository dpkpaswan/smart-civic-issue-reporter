/**
 * Email Templates Service
 * Professional responsive HTML email templates for Smart Civic Issue Reporter
 * 
 * Templates:
 *   - submissionEmailTemplate(issueData)  — sent when a citizen submits an issue
 *   - resolutionEmailTemplate(issueData)  — sent when an issue is resolved
 */

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
const BACKEND_URL  = (process.env.BACKEND_URL  || process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, '');

// ─── Helpers ──────────────────────────────────────────────────────

function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

function formatLocation(location) {
  if (!location) return 'Not specified';
  if (typeof location === 'string') return location;
  return location.address || location.street || `${location.lat || ''}, ${location.lng || ''}` || 'Not specified';
}

function formatDate(dateStr) {
  if (!dateStr) return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatETA(etaDate) {
  if (!etaDate) return 'Within SLA period';
  const d = new Date(etaDate);
  if (isNaN(d.getTime())) return 'Within SLA period';
  return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

function humanDuration(startDate, endDate) {
  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A';
  const diffMs = Math.abs(end - start);
  const hours  = Math.floor(diffMs / (1000 * 60 * 60));
  const mins   = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours < 1) return `${mins} minute${mins !== 1 ? 's' : ''}`;
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ${mins > 0 ? mins + ' min' : ''}`.trim();
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days} day${days > 1 ? 's' : ''} ${remHours > 0 ? remHours + ' hr' + (remHours > 1 ? 's' : '') : ''}`.trim();
}

function capitalise(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

function priorityColor(priority) {
  const map = { critical: '#dc2626', high: '#ea580c', medium: '#ca8a04', low: '#16a34a' };
  return map[(priority || '').toLowerCase()] || '#6b7280';
}

function statusColor(status) {
  const map = { submitted: '#6366f1', assigned: '#3b82f6', in_progress: '#f59e0b', resolved: '#10b981', closed: '#6b7280', rejected: '#ef4444' };
  return map[(status || '').toLowerCase()] || '#6b7280';
}

// ─── Shared layout wrapper ────────────────────────────────────────

function wrapLayout(title, bodyHTML) {
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f3f4f6; }
    /* Layout */
    .email-wrapper { width: 100%; background: #f3f4f6; padding: 24px 0; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    /* Header */
    .email-header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px 24px; text-align: center; }
    .email-header h1 { color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; font-size: 22px; margin: 0 0 4px; font-weight: 700; }
    .email-header p { color: rgba(255,255,255,0.85); font-family: Arial, sans-serif; font-size: 13px; margin: 0; }
    /* Body */
    .email-body { padding: 32px 28px; font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; line-height: 1.6; font-size: 15px; }
    .greeting { font-size: 18px; font-weight: 600; margin: 0 0 16px; color: #111827; }
    .intro { margin: 0 0 24px; color: #4b5563; }
    /* Info card */
    .info-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 0; margin: 0 0 24px; overflow: hidden; }
    .info-card-header { background: #eef2ff; padding: 12px 20px; border-bottom: 1px solid #e5e7eb; }
    .info-card-header h3 { margin: 0; font-size: 14px; color: #4338ca; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-row { display: flex; padding: 12px 20px; border-bottom: 1px solid #f3f4f6; }
    .info-label { width: 180px; min-width: 180px; font-weight: 600; color: #6b7280; font-size: 13px; }
    .info-value { flex: 1; color: #111827; font-size: 14px; font-weight: 500; }
    /* Badges */
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; color: #fff; }
    /* CTA buttons */
    .cta-section { text-align: center; margin: 28px 0; }
    .cta-btn { display: inline-block; padding: 14px 32px; border-radius: 8px; font-family: Arial, sans-serif; font-size: 15px; font-weight: 700; text-decoration: none; color: #ffffff !important; }
    .cta-primary { background: linear-gradient(135deg, #2563eb, #1d4ed8); }
    .cta-secondary { background: #059669; margin-left: 12px; }
    /* Images */
    .img-compare { display: flex; gap: 12px; margin: 16px 0; }
    .img-compare-col { flex: 1; text-align: center; }
    .img-compare-col img { width: 100%; max-width: 260px; border-radius: 8px; border: 2px solid #e5e7eb; }
    .img-compare-col .img-label { display: inline-block; margin-top: 6px; padding: 2px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; color: #fff; }
    /* Timeline */
    .timeline-item { padding: 8px 0 8px 24px; border-left: 3px solid #e5e7eb; position: relative; }
    .timeline-item::before { content: ''; position: absolute; left: -6px; top: 12px; width: 10px; height: 10px; border-radius: 50%; background: #2563eb; border: 2px solid #fff; }
    .timeline-label { font-weight: 600; font-size: 13px; color: #111827; }
    .timeline-date  { font-size: 12px; color: #6b7280; }
    /* Footer */
    .email-footer { background: #1f2937; padding: 24px; text-align: center; }
    .email-footer p { margin: 0 0 4px; font-family: Arial, sans-serif; font-size: 12px; color: #9ca3af; }
    .email-footer a { color: #60a5fa; text-decoration: none; }
    /* Resolution banner */
    .resolution-banner { background: linear-gradient(135deg, #059669, #047857); padding: 24px; text-align: center; border-radius: 10px; margin: 0 0 24px; }
    .resolution-banner h2 { color: #fff; font-size: 20px; margin: 0 0 4px; }
    .resolution-banner p { color: rgba(255,255,255,0.85); font-size: 14px; margin: 0; }
    /* Responsive */
    @media only screen and (max-width: 620px) {
      .email-body { padding: 20px 16px !important; }
      .info-row { flex-direction: column; padding: 10px 16px; }
      .info-label { width: 100%; min-width: 100%; margin-bottom: 2px; }
      .img-compare { flex-direction: column; }
      .cta-btn { display: block; margin: 8px 0 !important; }
      .cta-secondary { margin-left: 0 !important; }
    }
  </style>
</head>
<body>
<div class="email-wrapper">
  <div class="email-container">
    <!-- Header -->
    <div class="email-header">
      <h1>🏛️ Smart Civic Issue Reporter</h1>
      <p>Empowering citizens, improving communities</p>
    </div>
    <!-- Body -->
    <div class="email-body">
      ${bodyHTML}
    </div>
    <!-- Footer -->
    <div class="email-footer">
      <p>This is an automated message from <strong>Smart Civic Issue Reporter</strong></p>
      <p><a href="${FRONTEND_URL}/public-transparency">View Public Dashboard</a> · <a href="${FRONTEND_URL}">Visit Homepage</a></p>
      <p style="margin-top:12px;">© ${new Date().getFullYear()} Smart Civic Team · All rights reserved</p>
    </div>
  </div>
</div>
</body>
</html>`.trim();
}

// ═════════════════════════════════════════════════════════════════
// 1. SUBMISSION EMAIL TEMPLATE
// ═════════════════════════════════════════════════════════════════

function submissionEmailTemplate(issueData) {
  const issueId      = issueData.issue_id || issueData.id || 'N/A';
  const citizenName  = issueData.citizen_name || 'Citizen';
  const category     = capitalise(issueData.category);
  const location     = formatLocation(issueData.location);
  const priority     = capitalise(issueData.priority || 'medium');
  const submittedAt  = formatDate(issueData.submitted_at || issueData.created_at);
  const eta          = formatETA(issueData.estimated_resolution_time);
  const description  = issueData.description || 'No description provided';
  const department   = issueData.departments?.name || issueData.department_name || 'Assigned Department';
  const slaDeadline  = formatDate(issueData.sla_deadline);
  const trackingLink = `${FRONTEND_URL}/issue-confirmation?issueId=${encodeURIComponent(issueId)}`;
  const dashboardLink = `${FRONTEND_URL}/public-transparency`;

  const imageUrl = (issueData.images && issueData.images.length > 0) ? resolveImageUrl(issueData.images[0]) : null;

  const subject = `✅ Issue Reported Successfully — #${issueId}`;

  const bodyHTML = `
    <p class="greeting">Hello ${citizenName},</p>
    <p class="intro">Thank you for reporting a civic issue. Your report has been <strong>successfully submitted</strong> and auto-assigned to the responsible department. Here are the details:</p>

    <!-- Issue Details Card -->
    <div class="info-card">
      <div class="info-card-header"><h3>📋 Issue Details</h3></div>
      <div class="info-row">
        <div class="info-label">Issue ID</div>
        <div class="info-value"><strong style="color:#2563eb; font-size:15px;">#${issueId}</strong></div>
      </div>
      <div class="info-row">
        <div class="info-label">Category</div>
        <div class="info-value">${category}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Description</div>
        <div class="info-value">${description.length > 200 ? description.substring(0, 200) + '…' : description}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Location</div>
        <div class="info-value">📍 ${location}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Priority</div>
        <div class="info-value"><span class="badge" style="background:${priorityColor(issueData.priority)}">${priority}</span></div>
      </div>
      <div class="info-row">
        <div class="info-label">Submitted On</div>
        <div class="info-value">🕐 ${submittedAt}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Department</div>
        <div class="info-value">🏢 ${department}</div>
      </div>
      <div class="info-row">
        <div class="info-label">SLA Deadline</div>
        <div class="info-value">⏰ ${slaDeadline}</div>
      </div>
      <div class="info-row" style="border-bottom:none;">
        <div class="info-label">Estimated Resolution</div>
        <div class="info-value" style="color:#059669; font-weight:700;">🗓️ ${eta}</div>
      </div>
    </div>

    ${imageUrl ? `
    <div style="margin:0 0 24px; text-align:center;">
      <p style="font-size:13px; color:#6b7280; margin:0 0 8px;">📸 Reported Issue Image</p>
      <img src="${imageUrl}" alt="Issue photo" style="max-width:100%; max-height:300px; border-radius:8px; border:2px solid #e5e7eb;" />
    </div>` : ''}

    <!-- CTA Buttons -->
    <div class="cta-section">
      <a href="${trackingLink}" class="cta-btn cta-primary">🔍 Track Your Issue</a>
      <a href="${dashboardLink}" class="cta-btn cta-secondary" style="margin-top:8px;">📊 Public Dashboard</a>
    </div>

    <p style="color:#6b7280; font-size:13px; text-align:center; margin:24px 0 0;">
      You will receive another email when your issue is resolved.<br>
      Thank you for helping make our city better! 🌟
    </p>
  `;

  const html = wrapLayout(subject, bodyHTML);

  // Plain-text fallback
  const text = `
Hello ${citizenName},

Thank you for reporting a civic issue. Your report has been successfully submitted.

Issue ID: #${issueId}
Category: ${category}
Description: ${description}
Location: ${location}
Priority: ${priority}
Submitted: ${submittedAt}
Department: ${department}
SLA Deadline: ${slaDeadline}
Estimated Resolution: ${eta}

Track your issue: ${trackingLink}
Public Dashboard: ${dashboardLink}

You will receive another email when your issue is resolved.
Thank you for helping make our city better!

— Smart Civic Issue Reporter Team
  `.trim();

  return { subject, html, text };
}

// ═════════════════════════════════════════════════════════════════
// 2. RESOLUTION EMAIL TEMPLATE
// ═════════════════════════════════════════════════════════════════

function resolutionEmailTemplate(issueData) {
  const issueId       = issueData.issue_id || issueData.id || 'N/A';
  const citizenName   = issueData.citizen_name || 'Citizen';
  const category      = capitalise(issueData.category);
  const location      = formatLocation(issueData.location);
  const description   = issueData.description || 'No description provided';
  const department    = issueData.departments?.name || issueData.department_name || 'Municipal Department';
  const resolvedAt    = formatDate(issueData.resolved_at);
  const submittedAt   = formatDate(issueData.submitted_at || issueData.created_at);
  const notes         = issueData.resolution_notes || 'Issue has been addressed by the department.';
  const publicLink    = `${FRONTEND_URL}/public-transparency`;
  const trackingLink  = `${FRONTEND_URL}/issue-confirmation?issueId=${encodeURIComponent(issueId)}`;

  // Resolution time
  const resolutionTime = issueData.submitted_at && issueData.resolved_at
    ? humanDuration(issueData.submitted_at, issueData.resolved_at)
    : 'N/A';

  // Before / After images
  const beforeImg = (issueData.images && issueData.images.length > 0) ? resolveImageUrl(issueData.images[0]) : null;
  const afterImg  = (issueData.resolution_images && issueData.resolution_images.length > 0) ? resolveImageUrl(issueData.resolution_images[0]) : null;

  const subject = `🎉 Your Issue Has Been Resolved — #${issueId}`;

  const bodyHTML = `
    <!-- Resolution Banner -->
    <div class="resolution-banner">
      <h2>✅ Issue Resolved!</h2>
      <p>Your civic issue <strong>#${issueId}</strong> has been successfully resolved</p>
    </div>

    <p class="greeting">Hello ${citizenName},</p>
    <p class="intro">Great news! The civic issue you reported has been <strong>resolved</strong> by <strong>${department}</strong>. Here are the resolution details:</p>

    <!-- Resolution Details Card -->
    <div class="info-card">
      <div class="info-card-header"><h3>📋 Resolution Summary</h3></div>
      <div class="info-row">
        <div class="info-label">Issue ID</div>
        <div class="info-value"><strong style="color:#2563eb;">#${issueId}</strong></div>
      </div>
      <div class="info-row">
        <div class="info-label">Category</div>
        <div class="info-value">${category}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Location</div>
        <div class="info-value">📍 ${location}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Department</div>
        <div class="info-value">🏢 ${department}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Reported On</div>
        <div class="info-value">${submittedAt}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Resolved On</div>
        <div class="info-value" style="color:#059669; font-weight:700;">✅ ${resolvedAt}</div>
      </div>
      <div class="info-row" style="border-bottom:none;">
        <div class="info-label">Resolution Time</div>
        <div class="info-value" style="color:#2563eb; font-weight:700;">⚡ ${resolutionTime}</div>
      </div>
    </div>

    <!-- Resolution Notes -->
    <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:16px 20px; margin:0 0 24px;">
      <p style="margin:0 0 6px; font-weight:700; font-size:13px; color:#166534;">📝 Resolution Notes</p>
      <p style="margin:0; color:#15803d; font-size:14px;">${notes}</p>
    </div>

    ${(beforeImg || afterImg) ? `
    <!-- Before / After Comparison -->
    <div style="margin:0 0 24px;">
      <p style="font-weight:700; font-size:14px; color:#111827; margin:0 0 12px;">📸 Before &amp; After Comparison</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${beforeImg ? `
          <td width="48%" style="vertical-align:top; text-align:center; padding-right:8px;">
            <img src="${beforeImg}" alt="Before" style="width:100%; max-width:260px; border-radius:8px; border:2px solid #fecaca;" />
            <div style="margin-top:6px;"><span style="display:inline-block; padding:2px 12px; border-radius:12px; font-size:11px; font-weight:700; color:#fff; background:#ef4444;">BEFORE</span></div>
          </td>` : ''}
          ${afterImg ? `
          <td width="${beforeImg ? '4%' : '0'}" style="vertical-align:middle; text-align:center;">
            ${beforeImg ? '<span style="font-size:20px;">→</span>' : ''}
          </td>
          <td width="48%" style="vertical-align:top; text-align:center; padding-left:8px;">
            <img src="${afterImg}" alt="After resolution" style="width:100%; max-width:260px; border-radius:8px; border:2px solid #bbf7d0;" />
            <div style="margin-top:6px;"><span style="display:inline-block; padding:2px 12px; border-radius:12px; font-size:11px; font-weight:700; color:#fff; background:#10b981;">AFTER</span></div>
          </td>` : ''}
        </tr>
      </table>
    </div>` : ''}

    <!-- CTA Buttons -->
    <div class="cta-section">
      <a href="${trackingLink}" class="cta-btn cta-primary">🔍 View Full Details</a>
      <a href="${publicLink}" class="cta-btn cta-secondary" style="margin-top:8px;">📊 Public Dashboard</a>
    </div>

    <p style="color:#6b7280; font-size:13px; text-align:center; margin:24px 0 0;">
      We value your feedback! Please rate the resolution quality on the tracking page.<br>
      Thank you for helping improve our city! 🌟
    </p>
  `;

  const html = wrapLayout(subject, bodyHTML);

  const text = `
Hello ${citizenName},

Great news! Your civic issue #${issueId} has been resolved.

Category: ${category}
Location: ${location}
Department: ${department}
Reported On: ${submittedAt}
Resolved On: ${resolvedAt}
Resolution Time: ${resolutionTime}

Resolution Notes: ${notes}

View full details: ${trackingLink}
Public Dashboard: ${publicLink}

We value your feedback!
Thank you for helping improve our city!

— Smart Civic Issue Reporter Team
  `.trim();

  return { subject, html, text };
}

module.exports = {
  submissionEmailTemplate,
  resolutionEmailTemplate,
  resolveImageUrl,
  formatLocation,
  formatDate,
  formatETA,
  humanDuration,
  FRONTEND_URL,
  BACKEND_URL
};
