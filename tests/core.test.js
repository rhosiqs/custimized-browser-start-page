"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Core = require("../core.js");

test("normalizes safe destinations and rejects unsafe schemes", () => {
  assert.equal(Core.normalizeHttpUrl("example.com"), "https://example.com/");
  assert.equal(Core.normalizeHttpUrl("http://localhost:8400/path"), "http://localhost:8400/path");
  assert.equal(Core.normalizeHttpUrl("https://192.168.1.5/a"), "https://192.168.1.5/a");
  assert.equal(Core.normalizeHttpUrl("plain words"), null);
  assert.equal(Core.normalizeHttpUrl("javascript:alert(1)"), null);
  assert.equal(Core.normalizeHttpUrl("data:text/html,hello"), null);
  assert.equal(Core.hasBlockedScheme("file:///tmp/a"), true);
});

test("routes web and AI text while prioritizing direct URLs", () => {
  assert.deepEqual(Core.routeInput("web", "", "google"), { type: "empty" });
  assert.equal(
    Core.routeInput("web", "browser start page", "google").url,
    "https://www.google.com/search?q=browser%20start%20page"
  );
  assert.equal(
    Core.routeInput("ai", "summarize this", "chatgpt").url,
    "https://chatgpt.com/?q=summarize%20this"
  );
  assert.equal(Core.routeInput("ai", "example.org/docs", "claude").url, "https://example.org/docs");
  assert.equal(Core.routeInput("web", "javascript:alert(1)", "bing").type, "error");
});

test("normalizes DOI forms without mistaking raw identifiers for domains", () => {
  assert.equal(Core.normalizeDoi("10.1000/xyz123"), "10.1000/xyz123");
  assert.equal(Core.normalizeDoi("doi: 10.5555/ABC.Def"), "10.5555/ABC.Def");
  assert.equal(Core.normalizeDoi("https://doi.org/10.1000/xyz123"), "10.1000/xyz123");
  assert.equal(Core.normalizeDoi("not a doi"), null);
  assert.equal(Core.routeInput("doi", "10.1000/xyz123").url, "https://doi.org/10.1000/xyz123");
  assert.equal(Core.routeInput("doi", "example.com").url, "https://example.com/");
  assert.equal(Core.routeInput("doi", "not a doi").type, "error");
});

test("deduplicates and bounds local query history", () => {
  let history = Core.normalizeHistory({});
  history = Core.recordHistory(history, "web", "Alpha");
  history = Core.recordHistory(history, "web", "Beta");
  history = Core.recordHistory(history, "web", "alpha");
  assert.deepEqual(history.web, ["alpha", "Beta"]);
  assert.deepEqual(Core.historySuggestions(history, "web", "bet"), ["Beta"]);
  for (let index = 0; index < 40; index += 1) history = Core.recordHistory(history, "ai", `query-${index}`);
  assert.equal(history.ai.length, Core.HISTORY_LIMIT);
});

test("normalizes shortcut and launcher data while preserving an intentional empty dock", () => {
  const settings = Core.normalizeSettings({
    shortcutColumns: 99,
    shortcutSlots: 1,
    categories: ["Work", "Research"],
    shortcuts: [
      { name: "Paper", url: "example.com/paper", category: "Research", color: "#abc" },
      { name: "Unsafe", url: "javascript:alert(1)", category: "Work" }
    ],
    launchers: [{ name: "Custom", icon: "C", color: "#123456", links: [{ name: "Site", url: "site.test" }] }]
  });
  assert.equal(settings.shortcutColumns, 10);
  assert.equal(settings.shortcutSlots, 4);
  assert.equal(settings.shortcuts.length, 1);
  assert.equal(settings.shortcuts[0].url, "https://example.com/paper");
  assert.equal(settings.shortcuts[0].color, "#aabbcc");
  assert.equal(settings.launchers.length, 1);
  assert.equal(settings.launchers[0].links[0].url, "https://site.test/");
  assert.equal(Core.normalizeSettings({ launchers: [] }).launchers.length, 0);
  assert.equal(Core.normalizeSettings({}).launchers.length, 4);
});

test("reorders and moves user-managed collections predictably", () => {
  const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.deepEqual(Core.reorderById(items, "c", "a").map((item) => item.id), ["c", "a", "b"]);
  assert.deepEqual(Core.moveById(items, "a", 1).map((item) => item.id), ["b", "a", "c"]);
  assert.deepEqual(Core.moveById(items, "a", -1).map((item) => item.id), ["a", "b", "c"]);
});

test("round-trips every supported export format", () => {
  const settings = Core.normalizeSettings({
    theme: "light",
    categories: ["Work", "Research"],
    shortcuts: [{ id: "s1", title: "Docs", url: "https://docs.example.com", group: "Research", color: "#123456" }],
    launchers: [{ id: "l1", name: "Lab", icon: "L", color: "#654321", links: [{ id: "x1", label: "Portal", url: "https://portal.example.com" }] }]
  });
  for (const format of Object.keys(Core.FORMAT_META)) {
    const encoded = Core.serializeSettings(settings, format);
    const decoded = Core.deserializeSettings(encoded, format);
    assert.equal(decoded.theme, "light", format);
    assert.equal(decoded.shortcuts[0].title, "Docs", format);
    assert.equal(decoded.launchers[0].links[0].label, "Portal", format);
  }
});

test("migrates V1 JSON, YAML, TOML, and plain text structures", () => {
  const oldObject = {
    defaultSearch: "google",
    defaultAi: "chatgpt",
    defaultFocusOnLoad: "addressInput",
    shortcutGroups: ["Work", "Research"],
    defaultView: "Research",
    shortcuts: [{ title: "Example", url: "example.com", group: "Research", color: "#123456" }],
    elementPositions: { clock: { x: 10, y: 20 } }
  };
  const json = Core.deserializeSettings(JSON.stringify(oldObject), "json");
  assert.equal(json.defaultWebEngine, "google");
  assert.equal(json.defaultAiEngine, "chatgpt");
  assert.equal(json.defaultFocus, "doi");
  assert.equal(json.defaultCategory, "Research");
  assert.deepEqual(json.layout.clock, { x: 10, y: 20 });
  assert.equal(json.launchers.length, 4);

  const yaml = Core.deserializeSettings([
    "defaultSearch: google",
    "shortcutGroups:",
    "  - Work",
    "  - Research",
    "shortcuts:",
    "  - title: Example",
    "    url: example.com",
    "    group: Research",
    "    color: \"#123456\""
  ].join("\n"), "yaml");
  assert.equal(yaml.shortcuts[0].group, "Research");

  const toml = Core.deserializeSettings([
    "defaultSearch = \"duckduckgo\"",
    "shortcutGroups = [\"Work\", \"Research\"]",
    "[[shortcuts]]",
    "title = \"Example\"",
    "url = \"example.com\"",
    "group = \"Research\"",
    "color = \"#123456\""
  ].join("\n"), "toml");
  assert.equal(toml.defaultWebEngine, "duckduckgo");
  assert.equal(toml.shortcuts.length, 1);

  const text = Core.deserializeSettings([
    "defaultSearch = bing",
    "shortcutGroups = Work, Research",
    "shortcuts[0].title = Example",
    "shortcuts[0].url = example.com",
    "shortcuts[0].group = Research",
    "shortcuts[0].color = #123456"
  ].join("\n"), "text");
  assert.equal(text.defaultWebEngine, "bing");
  assert.equal(text.shortcuts[0].title, "Example");
});
