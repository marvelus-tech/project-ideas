import assert from "node:assert/strict";
import test from "node:test";
import {
  CALLBACK_DESCRIPTION,
  CALLBACK_TITLE,
  DASHBOARD_DESCRIPTION,
  DASHBOARD_TITLE,
  HOME_DESCRIPTION,
  HOME_TITLE,
  NOT_FOUND_DESCRIPTION,
  NOT_FOUND_TITLE,
  OPPORTUNITIES_DESCRIPTION,
  OPPORTUNITIES_TITLE,
  TRIAGE_DESCRIPTION,
  TRIAGE_TITLE,
  businessDescription,
  businessTitle,
  fitDescription,
  fitTitle,
} from "./seo";

const titles = [HOME_TITLE, TRIAGE_TITLE, OPPORTUNITIES_TITLE, DASHBOARD_TITLE, CALLBACK_TITLE, NOT_FOUND_TITLE];
const descriptions = [
  HOME_DESCRIPTION,
  TRIAGE_DESCRIPTION,
  OPPORTUNITIES_DESCRIPTION,
  DASHBOARD_DESCRIPTION,
  CALLBACK_DESCRIPTION,
  NOT_FOUND_DESCRIPTION,
];

test("static titles and descriptions are unique and in range", () => {
  for (const title of titles) {
    assert.ok(title.length >= 50 && title.length <= 60, `${title.length} ${title}`);
    assert.equal(title.includes("—") || title.includes("–"), false);
  }
  for (const description of descriptions) {
    assert.ok(description.length >= 150 && description.length <= 160, `${description.length} ${description}`);
    assert.equal(description.includes("—") || description.includes("–"), false);
  }
  assert.equal(new Set(titles).size, titles.length);
  assert.equal(new Set(descriptions).size, descriptions.length);
});

test("business metadata stays in range", () => {
  for (const [name, city] of [
    ["Austin Tradie Desk", "Austin"],
    ["Harbor Tradie Desk", "Harbor"],
    ["A very long neighborhood services desk name", "San Francisco"],
  ] as const) {
    const title = businessTitle(name, city);
    const description = fitDescription(businessDescription(name, city));
    assert.ok(title.length >= 50 && title.length <= 60, title);
    assert.ok(description.length >= 150 && description.length <= 160, `${description.length} ${description}`);
  }
  const fitted = fitTitle("Short");
  assert.ok(fitted.length >= 50 && fitted.length <= 60);
});
