import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeLinkGraph, extractInternalRoutes, isIndexableHtml, normalizeRoute } from '../../scripts/seo/link-graph.ts';

test('C1 internal href normalization ignores external and query/hash duplication', () => {
  const html = `<a href="/a?x=1#y">A</a><a href="https://excelarsiv.com/b/">B</a><a href="https://example.com/c">X</a><a href="mailto:x@y.com">M</a>`;
  assert.deepEqual(extractInternalRoutes(html), ['/a', '/b']);
  assert.equal(normalizeRoute('/a/index.html'), '/a');
});

test('C1 indexability filter excludes 404 and noindex regardless of registry', () => {
  assert.equal(isIndexableHtml('/404', '<html></html>'), false);
  assert.equal(isIndexableHtml('/private', '<meta name="robots" content="noindex,follow">'), false);
  assert.equal(isIndexableHtml('/public', '<meta name="robots" content="index,follow">'), true);
});

test('C1 graph covers all built indexable pages, including registry-missing routes', () => {
  const pages = [
    { route: '/', html: '<meta name="robots" content="index,follow"><a href="/a">a</a><a href="/b">b</a><a href="/new">new</a>' },
    { route: '/a', html: '<meta name="robots" content="index,follow"><a href="/b">b</a><a href="/new">new</a><a href="/">home</a>' },
    { route: '/b', html: '<meta name="robots" content="index,follow"><a href="/a">a</a><a href="/new">new</a>' },
    { route: '/new', html: '<meta name="robots" content="index,follow"><a href="/a">a</a>' },
    { route: '/private', html: '<meta name="robots" content="noindex,follow"><a href="/a">a</a>' },
    { route: '/404', html: '<a href="/">home</a>' },
  ];
  const registry = { records: [
    { pageId:'home',route:'/',status:'live',type:'home' },
    { pageId:'a',route:'/a',status:'live',type:'product' },
    { pageId:'b',route:'/b',status:'live',type:'category' },
  ] };
  const result = analyzeLinkGraph(pages, registry, 2);
  assert.equal(result.rows.length, 4);
  assert.equal(result.rows.find((row) => row.route === '/new')?.registryRegistered, false);
  assert.equal(result.rows.find((row) => row.route === '/new')?.internalLinksIn, 3);
  assert.deepEqual(result.unregisteredRoutes, ['/new']);
  assert.equal(result.registeredPages, 3);
});

test('C1 graph counts unique source pages and identifies threshold orphans', () => {
  const pages = [
    { route: '/', html: '<a href="/a">a</a><a href="/b">b</a>' },
    { route: '/a', html: '<a href="/b">b</a><a href="/">home</a>' },
    { route: '/b', html: '<a href="/a">a</a>' },
  ];
  const registry = { records: [
    { pageId:'home',route:'/',status:'live',type:'home' },
    { pageId:'a',route:'/a',status:'live',type:'product' },
    { pageId:'b',route:'/b',status:'live',type:'category' },
  ] };
  const result = analyzeLinkGraph(pages, registry, 2);
  assert.equal(result.rows.find((row) => row.route === '/a')?.internalLinksIn, 2);
  assert.equal(result.rows.find((row) => row.route === '/b')?.internalLinksIn, 2);
  assert.equal(result.rows.find((row) => row.route === '/')?.internalLinksIn, 1);
  assert.deepEqual(result.orphans.map((row) => row.route), ['/']);
  assert.equal(result.suggestions[0]?.targetRoute, '/');
});
