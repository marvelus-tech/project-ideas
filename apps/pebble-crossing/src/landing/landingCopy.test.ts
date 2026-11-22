import { describe, expect, it } from 'vitest'

import {
  APART_BULLETS,
  HERO_SUBHEAD,
  LANDING_CANONICAL,
  LANDING_META_DESCRIPTION,
  LANDING_TITLE,
  PLAY_CANONICAL,
  PRIMARY_CTA_LABEL,
  PRODUCT_LINE,
} from './landingCopy'

const USER_FACING = [
  LANDING_TITLE,
  HERO_SUBHEAD,
  PRODUCT_LINE,
  PRIMARY_CTA_LABEL,
  LANDING_META_DESCRIPTION,
  ...APART_BULLETS,
]

describe('landing copy v2', () => {
  it('uses RevEDU as the landing brand title', () => {
    expect(LANDING_TITLE).toBe('RevEDU')
  })

  it('has no em dashes in parent-facing strings', () => {
    for (const line of USER_FACING) {
      expect(line).not.toMatch(/\u2014/)
    }
  })

  it('keeps meta description within a typical SEO snippet length', () => {
    expect(LANDING_META_DESCRIPTION.length).toBeLessThanOrEqual(160)
  })

  it('points canonical URLs at the revedu Pages slug', () => {
    expect(LANDING_CANONICAL).toBe('https://marvelus-tech.github.io/project-ideas/revedu/')
    expect(PLAY_CANONICAL).toBe(
      'https://marvelus-tech.github.io/project-ideas/revedu/pebble-crossing/',
    )
  })
})