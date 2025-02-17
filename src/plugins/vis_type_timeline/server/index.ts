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

import { PluginConfigDescriptor, PluginInitializerContext } from '../../../core/server';
import { configSchema, ConfigSchema } from '../config';
import { Plugin } from './plugin';

export { PluginSetupContract } from './plugin';

export const config: PluginConfigDescriptor<ConfigSchema> = {
  schema: configSchema,
  exposeToBrowser: {
    ui: true,
  },
  deprecations: ({ renameFromRoot }) => [
    renameFromRoot('timeline_vis.enabled', 'vis_type_timeline.enabled'),
    renameFromRoot('timeline.enabled', 'vis_type_timeline.enabled'),
    renameFromRoot('timeline.graphiteUrls', 'vis_type_timeline.graphiteUrls'),
    renameFromRoot('timeline.ui.enabled', 'vis_type_timeline.ui.enabled', true),
  ],
};
export const plugin = (initializerContext: PluginInitializerContext) =>
  new Plugin(initializerContext);
