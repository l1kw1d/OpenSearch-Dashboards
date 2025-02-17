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

import expect from '@osd/expect';
import { sortBy } from 'lodash';

export default function ({ getService }) {
  const opensearchArchiver = getService('opensearchArchiver');
  const supertest = getService('supertest');

  const ensureFieldsAreSorted = (resp) => {
    expect(resp.body.fields).to.eql(sortBy(resp.body.fields, 'name'));
  };

  describe('fields_for_wildcard_route response', () => {
    before(() => opensearchArchiver.load('index_patterns/basic_index'));
    after(() => opensearchArchiver.unload('index_patterns/basic_index'));

    it('returns a flattened version of the fields in opensearch', async () => {
      await supertest
        .get('/api/index_patterns/_fields_for_wildcard')
        .query({ pattern: 'basic_index' })
        .expect(200, {
          fields: [
            {
              type: 'boolean',
              opensearchTypes: ['boolean'],
              searchable: true,
              aggregatable: true,
              name: 'bar',
              readFromDocValues: true,
            },
            {
              type: 'string',
              opensearchTypes: ['text'],
              searchable: true,
              aggregatable: false,
              name: 'baz',
              readFromDocValues: false,
            },
            {
              type: 'string',
              opensearchTypes: ['keyword'],
              searchable: true,
              aggregatable: true,
              name: 'baz.keyword',
              readFromDocValues: true,
              subType: { multi: { parent: 'baz' } },
            },
            {
              type: 'number',
              opensearchTypes: ['long'],
              searchable: true,
              aggregatable: true,
              name: 'foo',
              readFromDocValues: true,
            },
            {
              aggregatable: true,
              opensearchTypes: ['keyword'],
              name: 'nestedField.child',
              readFromDocValues: true,
              searchable: true,
              subType: {
                nested: {
                  path: 'nestedField',
                },
              },
              type: 'string',
            },
          ],
        })
        .then(ensureFieldsAreSorted);
    });

    // https://github.com/elastic/kibana/issues/79813
    it.skip('always returns a field for all passed meta fields', async () => {
      await supertest
        .get('/api/index_patterns/_fields_for_wildcard')
        .query({
          pattern: 'basic_index',
          meta_fields: JSON.stringify(['_id', '_source', 'crazy_meta_field']),
        })
        .expect(200, {
          fields: [
            {
              aggregatable: true,
              name: '_id',
              opensearchTypes: ['_id'],
              readFromDocValues: false,
              searchable: true,
              type: 'string',
            },
            {
              aggregatable: false,
              name: '_source',
              opensearchTypes: ['_source'],
              readFromDocValues: false,
              searchable: false,
              type: '_source',
            },
            {
              type: 'boolean',
              opensearchTypes: ['boolean'],
              searchable: true,
              aggregatable: true,
              name: 'bar',
              readFromDocValues: true,
            },
            {
              aggregatable: false,
              name: 'baz',
              opensearchTypes: ['text'],
              readFromDocValues: false,
              searchable: true,
              type: 'string',
            },
            {
              type: 'string',
              opensearchTypes: ['keyword'],
              searchable: true,
              aggregatable: true,
              name: 'baz.keyword',
              readFromDocValues: true,
              subType: { multi: { parent: 'baz' } },
            },
            {
              aggregatable: false,
              name: 'crazy_meta_field',
              readFromDocValues: false,
              searchable: false,
              type: 'string',
            },
            {
              type: 'number',
              opensearchTypes: ['long'],
              searchable: true,
              aggregatable: true,
              name: 'foo',
              readFromDocValues: true,
            },
            {
              aggregatable: true,
              opensearchTypes: ['keyword'],
              name: 'nestedField.child',
              readFromDocValues: true,
              searchable: true,
              subType: {
                nested: {
                  path: 'nestedField',
                },
              },
              type: 'string',
            },
          ],
        })
        .then(ensureFieldsAreSorted);
    });

    it('returns 404 when the pattern does not exist', async () => {
      await supertest
        .get('/api/index_patterns/_fields_for_wildcard')
        .query({
          pattern: '[non-existing-pattern]its-invalid-*',
        })
        .expect(404);
    });
  });
}
