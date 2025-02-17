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

import { inspect } from 'util';
import { SavedObjectMigrationContext } from 'opensearch-dashboards/server';
import { DashboardDoc730ToLatest } from '../../common';
import { isDashboardDoc } from './is_dashboard_doc';
import { moveFiltersToQuery } from './move_filters_to_query';
import { migratePanelsTo730, DashboardDoc700To720 } from '../../common';

export const migrations730 = (doc: DashboardDoc700To720, { log }: SavedObjectMigrationContext) => {
  if (!isDashboardDoc(doc)) {
    // NOTE: we should probably throw an error here... but for now following suit and in the
    // case of errors, just returning the same document.
    return doc;
  }

  try {
    const searchSource = JSON.parse(
      doc.attributes.opensearchDashboardsSavedObjectMeta.searchSourceJSON
    );
    doc.attributes.opensearchDashboardsSavedObjectMeta.searchSourceJSON = JSON.stringify(
      moveFiltersToQuery(searchSource)
    );
  } catch (e) {
    log.warning(
      `Exception @ migrations730 while trying to migrate dashboard query filters!\n` +
        `${e.stack}\n` +
        `dashboard: ${inspect(doc, false, null)}`
    );
    return doc;
  }

  let uiState = {};
  // Ignore errors, at some point uiStateJSON stopped being used, so it may not exist.
  if (doc.attributes.uiStateJSON && doc.attributes.uiStateJSON !== '') {
    uiState = JSON.parse(doc.attributes.uiStateJSON);
  }

  try {
    const panels = JSON.parse(doc.attributes.panelsJSON);
    doc.attributes.panelsJSON = JSON.stringify(
      migratePanelsTo730(
        panels,
        '7.3.0',
        doc.attributes.useMargins === undefined ? true : doc.attributes.useMargins,
        uiState
      )
    );

    delete doc.attributes.uiStateJSON;
  } catch (e) {
    log.warning(
      `Exception @ migrations730 while trying to migrate dashboard panels!\n` +
        `Error: ${e.stack}\n` +
        `dashboard: ${inspect(doc, false, null)}`
    );
    return doc;
  }

  return doc as DashboardDoc730ToLatest;
};
