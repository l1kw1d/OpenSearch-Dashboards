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

import { PluginConfigDescriptor, PluginInitializerContext } from 'opensearch_dashboards/server';

import { configSchema, ConfigSchema } from '../config';
import { VisTypeVegaPlugin } from './plugin';

export const config: PluginConfigDescriptor<ConfigSchema> = {
  exposeToBrowser: {
    enableExternalUrls: true,
  },
  schema: configSchema,
  deprecations: ({ renameFromRoot }) => [
    renameFromRoot('vega.enableExternalUrls', 'vis_type_vega.enableExternalUrls'),
    renameFromRoot('vega.enabled', 'vis_type_vega.enabled'),
  ],
};

export function plugin(initializerContext: PluginInitializerContext) {
  return new VisTypeVegaPlugin(initializerContext);
}

export { VisTypeVegaPluginStart, VisTypeVegaPluginSetup } from './types';
