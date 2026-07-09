/* eslint-disable no-console */
/**
 * Stadium IQ - Full Accessibility Audit Script
 * Generates HTML report using Playwright + axe-core
 * Run: node scripts/a11y-audit.mjs
 */
import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const REPORT_DIR = './coverage/a11y-audit';
const PAGES = [
  { path: '/', label: 'Dashboard / Home' },
  { path: '/crowdmap', label: 'Crowd Map' },
  { path: '/volunteers', label: 'Volunteer Dispatch' },
  { path: '/transport', label: 'Transport Hub' },
  { path: '/sustainability', label: 'Sustainability' },
  { path: '/accessibility', label: 'Accessibility Hub' },
  { path: '/vendors', label: 'Concessions' },
  { path: '/assistant', label: 'AI Assistant' },
  { path: '/volunteer-mobile', label: 'Volunteer Mobile' },
];

async function runAudit() {
  mkdirSync(REPORT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    colorScheme: 'light',
  });

  const results = [];

  for (const page of PAGES) {
    const tab = await context.newPage();
    console.log(`Auditing: ${page.label} (${BASE_URL}${page.path})`);

    try {
      await tab.goto(`${BASE_URL}${page.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await tab.waitForTimeout(1000);

      const violations = await tab.evaluate(async () => {
        const { default: axe } = await import('axe-core');
        const result = await axe.run(document, {
          runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
          resultTypes: ['violations'],
        });
        return result.violations;
      });

      results.push({
        page: page.label,
        path: page.path,
        violations: violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          tags: v.tags,
          nodes: v.nodes.map((n) => ({
            html: n.html.slice(0, 200),
            target: n.target.join(', '),
            failureSummary: n.failureSummary?.slice(0, 300),
          })),
        })),
        violationCount: violations.length,
        criticalCount: violations.filter((v) => v.impact === 'critical').length,
        seriousCount: violations.filter((v) => v.impact === 'serious').length,
        moderateCount: violations.filter((v) => v.impact === 'moderate').length,
        minorCount: violations.filter((v) => v.impact === 'minor').length,
      });

      console.log(
        `  → ${violations.length} violations (${results[results.length - 1].criticalCount} critical, ${results[results.length - 1].seriousCount} serious, ${results[results.length - 1].moderateCount} moderate, ${results[results.length - 1].minorCount} minor)`,
      );
    } catch (err) {
      console.error(`  ✗ Failed to audit ${page.label}: ${err.message}`);
      results.push({
        page: page.label,
        path: page.path,
        violations: [],
        violationCount: -1,
        error: err.message,
      });
    } finally {
      await tab.close();
    }
  }

  await browser.close();

  const totalViolations = results.reduce((s, r) => s + Math.max(0, r.violationCount), 0);
  const totalCritical = results.reduce((s, r) => s + (r.criticalCount || 0), 0);
  const totalSerious = results.reduce((s, r) => s + (r.seriousCount || 0), 0);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stadium IQ - Accessibility Audit Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #1a1a1a; padding: 24px; }
    .container { max-width: 1200px; margin: 0 auto; }
    header { background: linear-gradient(135deg, #0B1E3D, #1B3A6B); color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
    header h1 { font-size: 1.5rem; margin-bottom: 8px; }
    header .summary { display: flex; gap: 16px; flex-wrap: wrap; }
    header .summary span { padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; }
    .pass { background: #22c55e; color: white; }
    .fail { background: #ef4444; color: white; }
    .warn { background: #f59e0b; color: white; }
    .page-card { background: white; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .page-card h2 { font-size: 1.1rem; margin-bottom: 8px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; margin-right: 4px; }
    .badge.critical { background: #fecaca; color: #991b1b; }
    .badge.serious { background: #fed7aa; color: #9a3412; }
    .badge.moderate { background: #fef08a; color: #854d0e; }
    .badge.minor { background: #dbeafe; color: #1e40af; }
    .violation { margin: 8px 0; padding: 8px; background: #fafafa; border-radius: 4px; border-left: 3px solid #ef4444; }
    .violation.serious { border-left-color: #f59e0b; }
    .violation.moderate { border-left-color: #eab308; }
    .violation.minor { border-left-color: #3b82f6; }
    .violation-detail { font-size: 0.85rem; color: #666; margin-top: 4px; }
    code { background: #f0f0f0; padding: 1px 4px; border-radius: 2px; font-size: 0.8rem; word-break: break-all; }
    .empty { color: #22c55e; font-weight: 600; }
    .error { color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>♿ Stadium IQ - Accessibility Audit Report</h1>
      <p style="margin-bottom: 12px; opacity: 0.8;">Automated axe-core audit — ${new Date().toISOString().split('T')[0]}</p>
      <div class="summary">
        <span class="${totalViolations === 0 ? 'pass' : 'fail'}">${totalViolations} violations total</span>
        <span class="${totalCritical === 0 ? 'pass' : 'fail'}">${totalCritical} critical</span>
        <span class="${totalSerious === 0 ? 'pass' : 'warn'}">${totalSerious} serious</span>
        <span class="badge" style="background: #e5e7eb; color: #374151;">${results.length} pages audited</span>
        <span class="${totalViolations === 0 ? 'pass' : 'fail'}">${totalViolations === 0 ? '✅ WCAG 2.1 AA PASS' : '⚠️ VIOLATIONS FOUND'}</span>
      </div>
    </header>

    ${results
      .map(
        (r) => `
      <div class="page-card">
        <h2>${r.page} <code>${r.path}</code></h2>
        ${r.error ? `<p class="error">✗ Error: ${r.error}</p>` : ''}
        ${
          r.violationCount === -1
            ? ''
            : r.violationCount === 0
              ? '<p class="empty">✅ No violations found</p>'
              : `
          <div style="margin-bottom: 8px;">
            <span class="badge critical">${r.criticalCount} critical</span>
            <span class="badge serious">${r.seriousCount} serious</span>
            <span class="badge moderate">${r.moderateCount} moderate</span>
            <span class="badge minor">${r.minorCount} minor</span>
          </div>
          ${r.violations
            .map(
              (v) => `
            <div class="violation ${v.impact}">
              <strong>${v.id}</strong> (${v.impact})
              <p style="font-size: 0.9rem; margin: 4px 0;">${v.description}</p>
              <div class="violation-detail">
                <p>${v.help} — <a href="${v.helpUrl}" target="_blank">Learn more</a></p>
                ${v.nodes
                  .slice(0, 3)
                  .map(
                    (n) => `
                  <div style="margin-top: 4px; padding: 4px; background: #f5f5f5; border-radius: 2px;">
                    <code>${n.html.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>
                    <br/><span style="font-size: 0.75rem;">Target: ${n.target}</span>
                    ${n.failureSummary ? `<br/><span style="font-size: 0.75rem; color: #ef4444;">${n.failureSummary}</span>` : ''}
                  </div>
                `,
                  )
                  .join('')}
                ${v.nodes.length > 3 ? `<p style="font-size: 0.75rem; color: #666; margin-top: 4px;">...and ${v.nodes.length - 3} more occurrences</p>` : ''}
              </div>
            </div>
          `,
            )
            .join('')}
        `
        }
      </div>
    `,
      )
      .join('')}

    <footer style="text-align: center; margin-top: 32px; padding: 16px; color: #666; font-size: 0.85rem;">
      Generated by Stadium IQ A11y Audit Script | axe-core | Playwright
    </footer>
  </div>
</body>
</html>`;

  const reportPath = `${REPORT_DIR}/report.html`;
  writeFileSync(reportPath, html, 'utf8');
  console.log(`\n✅ Audit complete! Report: ${reportPath}`);
  console.log(`Total violations across ${results.length} pages: ${totalViolations}`);
}

runAudit().catch(console.error);
