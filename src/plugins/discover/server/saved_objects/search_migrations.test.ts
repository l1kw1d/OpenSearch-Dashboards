/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { SavedObjectMigrationContext } from 'opensearch-dashboards/server';
import { searchMigrations } from './search_migrations';

const savedObjectMigrationContext = (null as unknown) as SavedObjectMigrationContext;

const testMigrateMatchAllQuery = (migrationFn: Function) => {
  it('should migrate obsolete match_all query', () => {
    const migratedDoc = migrationFn(
      {
        type: 'search',
        attributes: {
          opensearchDashboardsSavedObjectMeta: {
            searchSourceJSON: JSON.stringify({
              query: {
                match_all: {},
              },
            }),
          },
        },
      },
      savedObjectMigrationContext
    );
    const migratedSearchSource = JSON.parse(
      migratedDoc.attributes.opensearchDashboardsSavedObjectMeta.searchSourceJSON
    );

    expect(migratedSearchSource).toEqual({
      query: {
        query: '',
        language: 'kuery',
      },
    });
  });

  it('should return original doc if searchSourceJSON cannot be parsed', () => {
    const migratedDoc = migrationFn(
      {
        type: 'search',
        attributes: {
          opensearchDashboardsSavedObjectMeta: 'opensearchDashboardsSavedObjectMeta',
        },
      },
      savedObjectMigrationContext
    );

    expect(migratedDoc).toEqual({
      type: 'search',
      attributes: {
        opensearchDashboardsSavedObjectMeta: 'opensearchDashboardsSavedObjectMeta',
      },
    });
  });
};

describe('migration search', () => {
  describe('6.7.2', () => {
    const migrationFn = searchMigrations['6.7.2'];

    describe('migrateMatchAllQuery', () => {
      testMigrateMatchAllQuery(migrationFn);
    });
  });

  describe('7.0.0', () => {
    const migrationFn = searchMigrations['7.0.0'];

    test('skips errors when searchSourceJSON is null', () => {
      const doc = {
        id: '123',
        type: 'search',
        attributes: {
          foo: true,
          opensearchDashboardsSavedObjectMeta: {
            searchSourceJSON: null,
          },
        },
      };
      const migratedDoc = migrationFn(doc, savedObjectMigrationContext);

      expect(migratedDoc).toMatchInlineSnapshot(`
Object {
  "attributes": Object {
    "foo": true,
    "opensearchDashboardsSavedObjectMeta": Object {
      "searchSourceJSON": null,
    },
  },
  "id": "123",
  "references": Array [],
  "type": "search",
}
`);
    });

    test('skips errors when searchSourceJSON is undefined', () => {
      const doc = {
        id: '123',
        type: 'search',
        attributes: {
          foo: true,
          opensearchDashboardsSavedObjectMeta: {
            searchSourceJSON: undefined,
          },
        },
      };
      const migratedDoc = migrationFn(doc, savedObjectMigrationContext);

      expect(migratedDoc).toMatchInlineSnapshot(`
Object {
  "attributes": Object {
    "foo": true,
    "opensearchDashboardsSavedObjectMeta": Object {
      "searchSourceJSON": undefined,
    },
  },
  "id": "123",
  "references": Array [],
  "type": "search",
}
`);
    });

    test('skips error when searchSourceJSON is not a string', () => {
      const doc = {
        id: '123',
        type: 'search',
        attributes: {
          foo: true,
          opensearchDashboardsSavedObjectMeta: {
            searchSourceJSON: 123,
          },
        },
      };
      const migratedDoc = migrationFn(doc, savedObjectMigrationContext);

      expect(migratedDoc).toMatchInlineSnapshot(`
Object {
  "attributes": Object {
    "foo": true,
    "opensearchDashboardsSavedObjectMeta": Object {
      "searchSourceJSON": 123,
    },
  },
  "id": "123",
  "references": Array [],
  "type": "search",
}
`);
    });

    test('skips error when searchSourceJSON is invalid json', () => {
      const doc = {
        id: '123',
        type: 'search',
        attributes: {
          foo: true,
          opensearchDashboardsSavedObjectMeta: {
            searchSourceJSON: '{abc123}',
          },
        },
      };
      const migratedDoc = migrationFn(doc, savedObjectMigrationContext);

      expect(migratedDoc).toMatchInlineSnapshot(`
Object {
  "attributes": Object {
    "foo": true,
    "opensearchDashboardsSavedObjectMeta": Object {
      "searchSourceJSON": "{abc123}",
    },
  },
  "id": "123",
  "references": Array [],
  "type": "search",
}
`);
    });

    test('skips error when "index" and "filter" is missing from searchSourceJSON', () => {
      const doc = {
        id: '123',
        type: 'search',
        attributes: {
          foo: true,
          opensearchDashboardsSavedObjectMeta: {
            searchSourceJSON: JSON.stringify({ bar: true }),
          },
        },
      };
      const migratedDoc = migrationFn(doc, savedObjectMigrationContext);

      expect(migratedDoc).toMatchInlineSnapshot(`
Object {
  "attributes": Object {
    "foo": true,
    "opensearchDashboardsSavedObjectMeta": Object {
      "searchSourceJSON": "{\\"bar\\":true}",
    },
  },
  "id": "123",
  "references": Array [],
  "type": "search",
}
`);
    });

    test('extracts "index" attribute from doc', () => {
      const doc = {
        id: '123',
        type: 'search',
        attributes: {
          foo: true,
          opensearchDashboardsSavedObjectMeta: {
            searchSourceJSON: JSON.stringify({ bar: true, index: 'pattern*' }),
          },
        },
      };
      const migratedDoc = migrationFn(doc, savedObjectMigrationContext);

      expect(migratedDoc).toMatchInlineSnapshot(`
Object {
  "attributes": Object {
    "foo": true,
    "opensearchDashboardsSavedObjectMeta": Object {
      "searchSourceJSON": "{\\"bar\\":true,\\"indexRefName\\":\\"opensearchDashboardsSavedObjectMeta.searchSourceJSON.index\\"}",
    },
  },
  "id": "123",
  "references": Array [
    Object {
      "id": "pattern*",
      "name": "opensearchDashboardsSavedObjectMeta.searchSourceJSON.index",
      "type": "index-pattern",
    },
  ],
  "type": "search",
}
`);
    });

    test('extracts index patterns from filter', () => {
      const doc = {
        id: '123',
        type: 'search',
        attributes: {
          foo: true,
          opensearchDashboardsSavedObjectMeta: {
            searchSourceJSON: JSON.stringify({
              bar: true,
              filter: [
                {
                  meta: {
                    foo: true,
                    index: 'my-index',
                  },
                },
              ],
            }),
          },
        },
      };
      const migratedDoc = migrationFn(doc, savedObjectMigrationContext);

      expect(migratedDoc).toMatchInlineSnapshot(`
Object {
  "attributes": Object {
    "foo": true,
    "opensearchDashboardsSavedObjectMeta": Object {
      "searchSourceJSON": "{\\"bar\\":true,\\"filter\\":[{\\"meta\\":{\\"foo\\":true,\\"indexRefName\\":\\"opensearchDashboardsSavedObjectMeta.searchSourceJSON.filter[0].meta.index\\"}}]}",
    },
  },
  "id": "123",
  "references": Array [
    Object {
      "id": "my-index",
      "name": "opensearchDashboardsSavedObjectMeta.searchSourceJSON.filter[0].meta.index",
      "type": "index-pattern",
    },
  ],
  "type": "search",
}
`);
    });
  });

  describe('7.4.0', function () {
    const migrationFn = searchMigrations['7.4.0'];

    test('transforms one dimensional sort arrays into two dimensional arrays', () => {
      const doc = {
        id: '123',
        type: 'search',
        attributes: {
          sort: ['bytes', 'desc'],
        },
      };

      const expected = {
        id: '123',
        type: 'search',
        attributes: {
          sort: [['bytes', 'desc']],
        },
      };

      const migratedDoc = migrationFn(doc, savedObjectMigrationContext);

      expect(migratedDoc).toEqual(expected);
    });

    test("doesn't modify search docs that already have two dimensional sort arrays", () => {
      const doc = {
        id: '123',
        type: 'search',
        attributes: {
          sort: [['bytes', 'desc']],
        },
      };

      const migratedDoc = migrationFn(doc, savedObjectMigrationContext);

      expect(migratedDoc).toEqual(doc);
    });

    test("doesn't modify search docs that have no sort array", () => {
      const doc = {
        id: '123',
        type: 'search',
        attributes: {},
      };

      const migratedDoc = migrationFn(doc, savedObjectMigrationContext);

      expect(migratedDoc).toEqual(doc);
    });
  });

  describe('7.9.3', () => {
    const migrationFn = searchMigrations['7.9.3'];

    describe('migrateMatchAllQuery', () => {
      testMigrateMatchAllQuery(migrationFn);
    });
  });
});
