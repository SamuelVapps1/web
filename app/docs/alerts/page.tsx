import type { Metadata } from 'next';

const alertTypes = [
  {
    type: 'Error Anomaly',
    triggered:
      'Fires when your 5-minute error rate is more than 4 standard deviations above your 24-hour average and exceeds the minimum threshold.',
    grouping: 'Route, Http Group',
  },
  {
    type: 'Usage Anomaly',
    triggered:
      'Fires when your 5-minute usage is more than 4 standard deviations above your 24-hour average and exceeds the minimum threshold.',
    grouping: 'Metric',
  },
];

const usageMetrics = [
  'Function CPU duration',
  'Function duration',
  'Fast Data Transfer',
  'Edge requests',
  'Function invocations',
];

const ruleFields = [
  ['Name', 'A label for the rule, such as Production anomaly alerts.'],
  ['Projects', 'Apply the rule to all projects, specific projects, or exclude selected projects.'],
  ['Alert types', 'Apply the rule to all alert types or only specific ones.'],
  ['Severity level', 'Choose High, Medium, or Low based on impact.'],
  ['Notification options', 'Subscribe all team owners to the rule.'],
];

const errorReference = [
  ['Sparse (1 req/hour)', '2%', '51 errors', 'or 5 with 2 consecutive 5-min intervals'],
  ['Low (10 req/min)', '1%', '51 errors', 'or 6 with 2 consecutive 5-min intervals'],
  ['Medium (100 req/min)', '0.5%', '51 errors', 'or 18 with 2 consecutive 5-min intervals'],
  ['High (1k req/min)', '0.5%', '106 errors', ''],
  ['High (10k req/min)', '0.2%', '361 errors', ''],
  ['Zero Error Baseline (1000 req/min)', '0%', '51 errors', 'or 5 with 2 consecutive 5-min intervals'],
  ['High Error Rate (100 req/min)', '5%', '106 errors', ''],
];

export const metadata: Metadata = {
  title: 'Alerts',
  description:
    'Prehľad Vercel Alerts: typy alertov, konfigurácia pravidiel, Slack, webhooks a referenčné prahy pre error anomaly.',
  alternates: { canonical: '/docs/alerts' },
};

export default function AlertsDocPage() {
  return (
    <main>
      <header className="pagehead">
        <div className="pagehead__eyebrow">
          <span className="eyebrow">Vercel Docs</span>
        </div>
        <h1>Alerts</h1>
        <p className="lead">
          Alerts vás upozornia, keď je s projektom niečo zle. Najčastejšie ide o nárast chýb, anomáliu v používaní alebo
          prípad, ktorý chcete okamžite poslať do Slacku, emailu alebo webhooku.
        </p>
      </header>

      <section className="section section--alt">
        <div className="wrap wrap--narrow">
          <div className="docs-panel">
            <p className="docs-kicker">At a glance</p>
            <ul className="docs-list">
              <li>Alerts are available on Enterprise and Pro plans with Observability Plus.</li>
              <li>By default you get usage anomaly and error anomaly notifications.</li>
              <li>Rules are configured at the team level in Settings &gt; Alerts.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap wrap--narrow">
          <div className="prep__head">
            <div className="sec-head__eyebrow">
              <span className="eyebrow">Alert types</span>
            </div>
            <h2>Dva základné typy alertov</h2>
          </div>

          <div className="docs-table">
            <div className="docs-table__head">
              <span>Alert Type</span>
              <span>Triggered when</span>
              <span>Grouping</span>
            </div>
            {alertTypes.map((row) => (
              <div className="docs-table__row" key={row.type}>
                <strong>{row.type}</strong>
                <span>{row.triggered}</span>
                <span>{row.grouping}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="wrap wrap--narrow">
          <div className="prep__head">
            <div className="sec-head__eyebrow">
              <span className="eyebrow">Usage anomaly metrics</span>
            </div>
            <h2>Metiky, ktoré vie usage anomaly sledovať</h2>
          </div>
          <div className="docs-chips">
            {usageMetrics.map((metric) => (
              <span className="docs-chip" key={metric}>
                {metric}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap wrap--narrow">
          <div className="prep__head">
            <div className="sec-head__eyebrow">
              <span className="eyebrow">Configure rules</span>
            </div>
            <h2>Čo nastavuješ pri pravidle</h2>
          </div>

          <div className="docs-table docs-table--stacked">
            {ruleFields.map(([field, description]) => (
              <div className="docs-table__row" key={field}>
                <strong>{field}</strong>
                <span>{description}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="wrap wrap--narrow">
          <div className="prep__head">
            <div className="sec-head__eyebrow">
              <span className="eyebrow">Slack and webhooks</span>
            </div>
            <h2>Najpraktickejšie aktivačné kroky</h2>
          </div>

          <div className="docs-grid">
            <article className="docs-card">
              <h3>Slack</h3>
              <p>Pridaj Slack kanál cez Settings &gt; Alerts, potom v kanáli pozvi Vercel app a prihlás pravidlo.</p>
              <code>/invite @Vercel</code>
              <code>/vercel subscribe &lt;team-id&gt; alerts +rule:&lt;rule-id&gt;</code>
            </article>
            <article className="docs-card">
              <h3>Webhooks</h3>
              <p>Webhooks sa nastavujú na úrovni teamu cez Add Webhook a platia pre vybrané projekty.</p>
              <p>Payload nájdeš v Webhooks API Reference.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap wrap--narrow">
          <div className="prep__head">
            <div className="sec-head__eyebrow">
              <span className="eyebrow">Reference</span>
            </div>
            <h2>Error anomaly thresholds</h2>
          </div>

          <div className="docs-table docs-table--reference">
            <div className="docs-table__head">
              <span>Traffic volume</span>
              <span>Avg error rate</span>
              <span>Minimum errors</span>
              <span>Notes</span>
            </div>
            {errorReference.map((row) => (
              <div className="docs-table__row docs-table__row--four" key={row[0]}>
                <strong>{row[0]}</strong>
                <span>{row[1]}</span>
                <span>{row[2]}</span>
                <span>{row[3]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
