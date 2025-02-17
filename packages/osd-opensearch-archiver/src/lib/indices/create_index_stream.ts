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

import { Transform, Readable } from 'stream';
import { inspect } from 'util';

import { Client } from 'elasticsearch';
import { ToolingLog } from '@osd/dev-utils';

import { Stats } from '../stats';
import { deleteOpenSearchDashboardsIndices } from './opensearch_dashboards_index';
import { deleteIndex } from './delete_index';

interface DocRecord {
  value: {
    index: string;
    type: string;
    settings: Record<string, any>;
    mappings: Record<string, any>;
    aliases: Record<string, any>;
  };
}

export function createCreateIndexStream({
  client,
  stats,
  skipExisting = false,
  log,
}: {
  client: Client;
  stats: Stats;
  skipExisting?: boolean;
  log: ToolingLog;
}) {
  const skipDocsFromIndices = new Set();

  // If we're trying to import OpenSearch Dashboards index docs, we need to ensure that
  // previous indices are removed so we're starting w/ a clean slate for
  // migrations. This only needs to be done once per archive load operation.
  let opensearchDashboardsIndexAlreadyDeleted = false;

  async function handleDoc(stream: Readable, record: DocRecord) {
    if (skipDocsFromIndices.has(record.value.index)) {
      return;
    }

    stream.push(record);
  }

  async function handleIndex(record: DocRecord) {
    const { index, settings, mappings, aliases } = record.value;

    // Determine if the mapping belongs to a pre-7.0 instance, for BWC tests, mainly
    const isPre7Mapping = !!mappings && Object.keys(mappings).length > 0 && !mappings.properties;
    const isOpenSearchDashboards = index.startsWith('.opensearch_dashboards');

    async function attemptToCreate(attemptNumber = 1) {
      try {
        if (isOpenSearchDashboards && !opensearchDashboardsIndexAlreadyDeleted) {
          await deleteOpenSearchDashboardsIndices({ client, stats, log });
          opensearchDashboardsIndexAlreadyDeleted = true;
        }

        await client.indices.create({
          method: 'PUT',
          index,
          include_type_name: isPre7Mapping,
          body: {
            settings,
            mappings,
            aliases,
          },
        } as any); // include_type_name is not properly defined

        stats.createdIndex(index, { settings });
      } catch (err) {
        if (
          err?.body?.error?.reason?.includes('index exists with the same name as the alias') &&
          attemptNumber < 3
        ) {
          opensearchDashboardsIndexAlreadyDeleted = false;
          const aliasStr = inspect(aliases);
          log.info(
            `failed to create aliases [${aliasStr}] because OpenSearch indicated an index/alias already exists, trying again`
          );
          await attemptToCreate(attemptNumber + 1);
          return;
        }

        if (err?.body?.error?.type !== 'resource_already_exists_exception' || attemptNumber >= 3) {
          throw err;
        }

        if (skipExisting) {
          skipDocsFromIndices.add(index);
          stats.skippedIndex(index);
          return;
        }

        await deleteIndex({ client, stats, index, log });
        await attemptToCreate(attemptNumber + 1);
        return;
      }
    }

    await attemptToCreate();
  }

  return new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    async transform(record, enc, callback) {
      try {
        switch (record && record.type) {
          case 'index':
            await handleIndex(record);
            break;

          case 'doc':
            await handleDoc(this, record);
            break;

          default:
            this.push(record);
            break;
        }

        callback();
      } catch (err) {
        callback(err);
      }
    },
  });
}
