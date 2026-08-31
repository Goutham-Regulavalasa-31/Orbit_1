/**
 * PageHeader — standard title/description/action row used at the top of
 * every list-style page (Clubs, Events, etc). Keeps heading typography and
 * spacing consistent instead of each page hand-rolling its own.
 */
const PageHeader = ({ title, description, action }) => (
  <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default PageHeader;
