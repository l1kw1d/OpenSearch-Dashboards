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

export default function ({ getService }) {
  const supertest = getService('supertest');
  const opensearch = getService('legacyOpenSearch');
  const opensearchArchiver = getService('opensearchArchiver');

  const BULK_REQUESTS = [
    {
      type: 'visualization',
      id: 'dd7caf20-9efd-11e7-acb3-3dab96693fab',
      attributes: {
        title: 'An existing visualization',
      },
    },
    {
      type: 'dashboard',
      id: 'a01b2f57-fcfd-4864-b735-09e28f0d815e',
      attributes: {
        title: 'A great new dashboard',
      },
    },
  ];

  describe('_bulk_create', () => {
    describe('with opensearch-dashboards index', () => {
      before(() => opensearchArchiver.load('saved_objects/basic'));
      after(() => opensearchArchiver.unload('saved_objects/basic'));

      it('should return 200 with individual responses', async () =>
        await supertest
          .post(`/api/saved_objects/_bulk_create`)
          .send(BULK_REQUESTS)
          .expect(200)
          .then((resp) => {
            expect(resp.body).to.eql({
              saved_objects: [
                {
                  type: 'visualization',
                  id: 'dd7caf20-9efd-11e7-acb3-3dab96693fab',
                  error: {
                    error: 'Conflict',
                    message:
                      'Saved object [visualization/dd7caf20-9efd-11e7-acb3-3dab96693fab] conflict',
                    statusCode: 409,
                  },
                },
                {
                  type: 'dashboard',
                  id: 'a01b2f57-fcfd-4864-b735-09e28f0d815e',
                  updated_at: resp.body.saved_objects[1].updated_at,
                  version: 'WzgsMV0=',
                  attributes: {
                    title: 'A great new dashboard',
                  },
                  migrationVersion: {
                    dashboard: resp.body.saved_objects[1].migrationVersion.dashboard,
                  },
                  references: [],
                  namespaces: ['default'],
                },
              ],
            });
          }));

      it('should not return raw id when object id is unspecified', async () =>
        await supertest
          .post(`/api/saved_objects/_bulk_create`)
          // eslint-disable-next-line no-unused-vars
          .send(BULK_REQUESTS.map(({ id, ...rest }) => rest))
          .expect(200)
          .then((resp) => {
            resp.body.saved_objects.map(({ id }) =>
              expect(id).not.match(/visualization|dashboard/)
            );
          }));
    });

    describe('without opensearch-dashboards index', () => {
      before(
        async () =>
          // just in case the opensearch-dashboards server has recreated it
          await opensearch.indices.delete({
            index: '.opensearch_dashboards',
            ignore: [404],
          })
      );

      it('should return 200 with individual responses', async () =>
        await supertest
          .post('/api/saved_objects/_bulk_create')
          .send(BULK_REQUESTS)
          .expect(200)
          .then((resp) => {
            expect(resp.body).to.eql({
              saved_objects: [
                {
                  type: 'visualization',
                  id: 'dd7caf20-9efd-11e7-acb3-3dab96693fab',
                  updated_at: resp.body.saved_objects[0].updated_at,
                  version: 'WzAsMV0=',
                  attributes: {
                    title: 'An existing visualization',
                  },
                  references: [],
                  namespaces: ['default'],
                  migrationVersion: {
                    visualization: resp.body.saved_objects[0].migrationVersion.visualization,
                  },
                },
                {
                  type: 'dashboard',
                  id: 'a01b2f57-fcfd-4864-b735-09e28f0d815e',
                  updated_at: resp.body.saved_objects[1].updated_at,
                  version: 'WzEsMV0=',
                  attributes: {
                    title: 'A great new dashboard',
                  },
                  references: [],
                  namespaces: ['default'],
                  migrationVersion: {
                    dashboard: resp.body.saved_objects[1].migrationVersion.dashboard,
                  },
                },
              ],
            });
          }));
    });
  });
}
