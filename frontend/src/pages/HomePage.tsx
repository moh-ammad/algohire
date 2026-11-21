export function HomePage() {
  return (
    <section className="space-y-4 text-left">
      <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
        Pragati Skills Mission
      </p>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-[var(--text-h)] sm:text-5xl">
        CertiFlow
      </h1>
      <p className="max-w-xl text-base leading-relaxed text-[var(--text)]">
        Skilling certificate issuance — centres submit batches, officers approve,
        anyone can verify a certificate is genuine.
      </p>
      <ul className="mt-6 space-y-2 text-sm text-[var(--text)]">
        <li>Backend Task B1: API foundation + Redis rate limiting — live</li>
        <li>Next: role switcher (F2) after auth (B2)</li>
      </ul>
    </section>
  );
}
