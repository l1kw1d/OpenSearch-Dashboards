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

/*
 * The UI and related logic for the welcome screen that *should* show only
 * when it is enabled (the default) and there is no OpenSearch Dashboards-consumed data
 * in Elasticsearch.
 */

import React, { Fragment } from 'react';
import {
  EuiLink,
  EuiTextColor,
  EuiTitle,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPortal,
} from '@elastic/eui';
import { METRIC_TYPE } from '@osd/analytics';
import { FormattedMessage } from '@osd/i18n/react';
import { getServices } from '../opensearch_dashboards_services';
import { TelemetryPluginStart } from '../../../../telemetry/public';

import { SampleDataCard } from './sample_data';
interface Props {
  urlBasePath: string;
  onSkip: () => void;
  telemetry?: TelemetryPluginStart;
}

/**
 * Shows a full-screen welcome page that gives helpful quick links to beginners.
 */
export class Welcome extends React.Component<Props> {
  private services = getServices();

  private hideOnEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.props.onSkip();
    }
  };

  private redirecToAddData() {
    const path = this.services.addBasePath('#/tutorial_directory');
    window.location.href = path;
  }

  private onSampleDataDecline = () => {
    this.services.trackUiMetric(METRIC_TYPE.CLICK, 'sampleDataDecline');
    this.props.onSkip();
  };

  private onSampleDataConfirm = () => {
    this.services.trackUiMetric(METRIC_TYPE.CLICK, 'sampleDataConfirm');
    this.redirecToAddData();
  };

  componentDidMount() {
    const { telemetry } = this.props;
    this.services.trackUiMetric(METRIC_TYPE.LOADED, 'welcomeScreenMount');
    if (telemetry?.telemetryService.userCanChangeSettings) {
      telemetry.telemetryNotifications.setOptedInNoticeSeen();
    }
    document.addEventListener('keydown', this.hideOnEsc);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.hideOnEsc);
  }

  private renderTelemetryEnabledOrDisabledText = () => {
    const { telemetry } = this.props;
    if (!telemetry || !telemetry.telemetryService.userCanChangeSettings) {
      return null;
    }

    const isOptedIn = telemetry.telemetryService.getIsOptedIn();
    if (isOptedIn) {
      return (
        <Fragment>
          <FormattedMessage
            id="home.dataManagementDisableCollection"
            defaultMessage=" To stop collection, "
          />
          <EuiLink href={this.services.addBasePath('management/opensearch-dashboards/settings')}>
            <FormattedMessage
              id="home.dataManagementDisableCollectionLink"
              defaultMessage="disable usage data here."
            />
          </EuiLink>
        </Fragment>
      );
    } else {
      return (
        <Fragment>
          <FormattedMessage
            id="home.dataManagementEnableCollection"
            defaultMessage=" To start collection, "
          />
          <EuiLink href={this.services.addBasePath('management/opensearch-dashboards/settings')}>
            <FormattedMessage
              id="home.dataManagementEnableCollectionLink"
              defaultMessage="enable usage data here."
            />
          </EuiLink>
        </Fragment>
      );
    }
  };

  render() {
    const { urlBasePath, telemetry } = this.props;
    return (
      <EuiPortal>
        <div className="homWelcome">
          <header className="homWelcome__header">
            <div className="homWelcome__content eui-textCenter">
              <EuiSpacer size="xl" />
              <span className="homWelcome__logo">
                <EuiIcon type="heatmap" size="xxl" />
              </span>
              <EuiTitle size="l" className="homWelcome__title">
                <h1>
                  <FormattedMessage id="home.welcomeTitle" defaultMessage="Welcome to OpenSearch" />
                </h1>
              </EuiTitle>
              <EuiSpacer size="m" />
            </div>
          </header>
          <div className="homWelcome__content homWelcome-body">
            <EuiFlexGroup gutterSize="l">
              <EuiFlexItem>
                <SampleDataCard
                  urlBasePath={urlBasePath}
                  onConfirm={this.onSampleDataConfirm}
                  onDecline={this.onSampleDataDecline}
                />
                <EuiSpacer size="s" />
                {!!telemetry && (
                  <Fragment>
                    <EuiTextColor className="euiText--small" color="subdued">
                      <FormattedMessage
                        id="home.dataManagementDisclaimerPrivacy"
                        defaultMessage="To learn about how usage data helps us manage and improve our products and services, see our "
                      />
                      <EuiLink
                        href={telemetry.telemetryConstants.getPrivacyStatementUrl()}
                        target="_blank"
                        rel="noopener"
                      >
                        <FormattedMessage
                          id="home.dataManagementDisclaimerPrivacyLink"
                          defaultMessage="Privacy Statement."
                        />
                      </EuiLink>
                      {this.renderTelemetryEnabledOrDisabledText()}
                    </EuiTextColor>
                    <EuiSpacer size="xs" />
                  </Fragment>
                )}
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        </div>
      </EuiPortal>
    );
  }
}
