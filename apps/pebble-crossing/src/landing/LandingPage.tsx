import { Link } from 'react-router-dom'

import { usePageMeta } from '../lib/usePageMeta'
import {
  APART_BULLETS,
  APART_HEADING,
  FOOTER_LINE,
  HERO_SUBHEAD,
  LANDING_META_DESCRIPTION,
  LANDING_TITLE,
  MISSION_BODY,
  MISSION_HEADING,
  PRIMARY_CTA_LABEL,
  PRODUCT_LINE,
  PRODUCT_NAME,
  SECONDARY_NOTE,
} from './landingCopy'
import { OpenHeadHero } from './OpenHeadHero'
import './LandingPage.css'

export function LandingPage() {
  usePageMeta({ title: LANDING_TITLE, description: LANDING_META_DESCRIPTION })

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
          <h1 id="landing-title">{LANDING_TITLE}</h1>
          <p className="landing-hero__lede">{HERO_SUBHEAD}</p>

          <article className="landing-product" aria-labelledby="product-title">
            <p className="landing-product__eyebrow">Grade 1 playtest</p>
            <h2 id="product-title" className="landing-product__name">
              {PRODUCT_NAME}
            </h2>
            <p className="landing-product__line">{PRODUCT_LINE}</p>
            <div className="landing-hero__ctas">
              <Link className="landing-btn landing-btn--primary" to="/pebble-crossing">
                {PRIMARY_CTA_LABEL}
              </Link>
            </div>
            <p className="landing-product__note">{SECONDARY_NOTE}</p>
          </article>
        </div>

        <OpenHeadHero />
      </section>

      <section className="landing-section" aria-labelledby="mission-heading">
        <h2 id="mission-heading" className="landing-section__title">
          {MISSION_HEADING}
        </h2>
        <p className="landing-section__body">{MISSION_BODY}</p>
      </section>

      <section className="landing-section" aria-labelledby="apart-heading">
        <h2 id="apart-heading" className="landing-section__title">
          {APART_HEADING}
        </h2>
        <ol className="landing-bullets landing-bullets--numbered">
          {APART_BULLETS.map((item, index) => (
            <li key={item} value={index + 1}>
              {item}
            </li>
          ))}
        </ol>
      </section>

      <footer className="landing-foot">
        <p>{FOOTER_LINE}</p>
      </footer>
    </main>
  )
}