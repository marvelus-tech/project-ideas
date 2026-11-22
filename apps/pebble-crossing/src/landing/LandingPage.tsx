import { Link } from 'react-router-dom'

import { OpenHeadHero } from './OpenHeadHero'
import './LandingPage.css'

const README_HREF =
  'https://github.com/marvelus-tech/project-ideas/blob/main/apps/pebble-crossing/README.md'

export function LandingPage() {
  return (
    <main className="landing">
      <header className="landing-nav" aria-label="Site">
        <span className="landing-nav__mark" aria-hidden="true">
          ◫
        </span>
        <span className="landing-nav__brand">RevEDU</span>
        <Link className="landing-nav__link" to="/parent">
          Parent report
        </Link>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero__copy">
          <h1 id="landing-title">Pebble Crossing</h1>
          <p className="landing-hero__lede">
            About ten minutes of grade 1 practice where the right sound and sum{' '}
            <strong>build</strong> the bridge. One cozy layer, not worksheet then prize.
          </p>
          <div className="landing-hero__ctas">
            <Link className="landing-btn landing-btn--primary" to="/play">
              Try the Level 6 playtest
            </Link>
            <a className="landing-btn landing-btn--ghost" href={README_HREF} rel="noopener noreferrer">
              Scope and Pip story (README)
            </a>
          </div>
          <ul className="landing-bullets">
            <li>Each visit ends when today&apos;s span is built, not when the child quits.</li>
            <li>Parents get one honest sentence in school language after the session.</li>
            <li>Version 1 has no coins, shop, or streak to negotiate.</li>
          </ul>
        </div>

        <OpenHeadHero />
      </section>

      <footer className="landing-foot">
        <p>Free kitchen-table playtest. Reading and math actions change the creek scene.</p>
      </footer>
    </main>
  )
}