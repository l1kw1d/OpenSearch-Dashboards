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

import { i18n } from '@osd/i18n';
import { TutorialsCategory } from '../../services/tutorials';
import { onPremInstructions } from '../instructions/filebeat_instructions';
import {
  TutorialContext,
  TutorialSchema,
} from '../../services/tutorials/lib/tutorials_registry_types';

export function opensearchLogsSpecProvider(context: TutorialContext): TutorialSchema {
  const moduleName = 'opensearch';
  const platforms = ['OSX', 'DEB', 'RPM', 'WINDOWS'] as const;
  return {
    id: 'opensearchLogs',
    name: i18n.translate('home.tutorials.opensearchLogs.nameTitle', {
      defaultMessage: 'OpenSearch logs',
    }),
    moduleName,
    category: TutorialsCategory.LOGGING,
    isBeta: true,
    shortDescription: i18n.translate('home.tutorials.opensearchLogs.shortDescription', {
      defaultMessage: 'Collect and parse logs created by OpenSearch.',
    }),
    longDescription: i18n.translate('home.tutorials.opensearchLogs.longDescription', {
      defaultMessage:
        'The `OpenSearch` Filebeat module parses logs created by OpenSearch. \
[Learn more]({learnMoreLink}).',
      values: {
        learnMoreLink: '{config.docs.beats.filebeat}/filebeat-module-opensearch.html',
      },
    }),
    euiIconType: 'heatmap',
    artifacts: {
      application: {
        label: i18n.translate('home.tutorials.opensearchLogs.artifacts.application.label', {
          defaultMessage: 'Discover',
        }),
        path: '/app/discover#/',
      },
      dashboards: [],
      exportedFields: {
        documentationUrl: '{config.docs.beats.filebeat}/exported-fields-opensearch.html',
      },
    },
    completionTimeMinutes: 10,
    onPrem: onPremInstructions(moduleName, platforms, context),
  };
}
