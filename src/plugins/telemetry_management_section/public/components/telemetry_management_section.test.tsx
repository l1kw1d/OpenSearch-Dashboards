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
import React from 'react';
import { mountWithIntl, shallowWithIntl } from 'test_utils/enzyme_helpers';
import TelemetryManagementSection from './telemetry_management_section';
import { TelemetryService } from '../../../telemetry/public/services';
import { coreMock } from '../../../../core/public/mocks';
import { render } from '@testing-library/react';

describe.skip('TelemetryManagementSectionComponent', () => {
  const coreStart = coreMock.createStart();
  const coreSetup = coreMock.createSetup();

  it('renders as expected', () => {
    const onQueryMatchChange = jest.fn();
    const isSecurityExampleEnabled = jest.fn().mockReturnValue(true);
    const telemetryService = new TelemetryService({
      config: {
        enabled: true,
        url: '',
        banner: true,
        allowChangingOptInStatus: true,
        optIn: true,
        optInStatusUrl: '',
        sendUsageFrom: 'browser',
      },
      reportOptInStatusChange: false,
      notifications: coreStart.notifications,
      http: coreSetup.http,
    });

    expect(
      shallowWithIntl(
        <TelemetryManagementSection
          telemetryService={telemetryService}
          onQueryMatchChange={onQueryMatchChange}
          showAppliesSettingMessage={true}
          enableSaving={true}
          isSecurityExampleEnabled={isSecurityExampleEnabled}
          toasts={coreStart.notifications.toasts}
        />
      )
    ).toMatchSnapshot();
  });

  it('renders null because query does not match the SEARCH_TERMS', () => {
    const onQueryMatchChange = jest.fn();
    const isSecurityExampleEnabled = jest.fn().mockReturnValue(true);
    const telemetryService = new TelemetryService({
      config: {
        enabled: true,
        url: '',
        banner: true,
        allowChangingOptInStatus: true,
        optIn: false,
        optInStatusUrl: '',
        sendUsageFrom: 'browser',
      },
      reportOptInStatusChange: false,
      notifications: coreStart.notifications,
      http: coreSetup.http,
    });

    const component = render(
      <React.Suspense fallback={<span>Fallback</span>}>
        <TelemetryManagementSection
          telemetryService={telemetryService}
          onQueryMatchChange={onQueryMatchChange}
          showAppliesSettingMessage={false}
          enableSaving={true}
          isSecurityExampleEnabled={isSecurityExampleEnabled}
          toasts={coreStart.notifications.toasts}
        />
      </React.Suspense>
    );

    try {
      component.rerender(
        <React.Suspense fallback={<span>Fallback</span>}>
          <TelemetryManagementSection
            query={{ text: 'asdasdasd' }}
            telemetryService={telemetryService}
            onQueryMatchChange={onQueryMatchChange}
            showAppliesSettingMessage={false}
            enableSaving={true}
            toasts={coreStart.notifications.toasts}
            isSecurityExampleEnabled={isSecurityExampleEnabled}
          />
        </React.Suspense>
      );
      expect(onQueryMatchChange).toHaveBeenCalledWith(false);
      expect(onQueryMatchChange).toHaveBeenCalledTimes(1);
    } finally {
      component.unmount();
    }
  });

  it('renders because query matches the SEARCH_TERMS', () => {
    const onQueryMatchChange = jest.fn();
    const isSecurityExampleEnabled = jest.fn().mockReturnValue(true);
    const telemetryService = new TelemetryService({
      config: {
        enabled: true,
        url: '',
        banner: true,
        allowChangingOptInStatus: true,
        optIn: false,
        optInStatusUrl: '',
        sendUsageFrom: 'browser',
      },
      reportOptInStatusChange: false,
      notifications: coreStart.notifications,
      http: coreSetup.http,
    });

    const component = mountWithIntl(
      <TelemetryManagementSection
        telemetryService={telemetryService}
        onQueryMatchChange={onQueryMatchChange}
        showAppliesSettingMessage={false}
        isSecurityExampleEnabled={isSecurityExampleEnabled}
        enableSaving={true}
        toasts={coreStart.notifications.toasts}
      />
    );
    try {
      expect(
        component.setProps({ ...component.props(), query: { text: 'TeLEMetry' } }).html()
      ).not.toBe(''); // Renders something.
      // I can't check against snapshot because of https://github.com/facebook/jest/issues/8618
      // expect(component).toMatchSnapshot();

      // It should also render if there is no query at all.
      expect(component.setProps({ ...component.props(), query: {} }).html()).not.toBe('');
      expect(onQueryMatchChange).toHaveBeenCalledWith(true);

      // Should only be called once because the second time does not change the result
      expect(onQueryMatchChange).toHaveBeenCalledTimes(1);
    } finally {
      component.unmount();
    }
  });

  it('renders null because allowChangingOptInStatus is false', () => {
    const onQueryMatchChange = jest.fn();
    const isSecurityExampleEnabled = jest.fn().mockReturnValue(true);
    const telemetryService = new TelemetryService({
      config: {
        enabled: true,
        url: '',
        banner: true,
        allowChangingOptInStatus: false,
        optIn: true,
        optInStatusUrl: '',
        sendUsageFrom: 'browser',
      },
      reportOptInStatusChange: false,
      notifications: coreStart.notifications,
      http: coreSetup.http,
    });

    const component = mountWithIntl(
      <TelemetryManagementSection
        telemetryService={telemetryService}
        onQueryMatchChange={onQueryMatchChange}
        showAppliesSettingMessage={true}
        enableSaving={true}
        isSecurityExampleEnabled={isSecurityExampleEnabled}
        toasts={coreStart.notifications.toasts}
      />
    );
    try {
      expect(component).toMatchSnapshot();
      component.setProps({ ...component.props(), query: { text: 'TeLEMetry' } });
      expect(onQueryMatchChange).toHaveBeenCalledWith(false);
    } finally {
      component.unmount();
    }
  });

  it('shows the OptInExampleFlyout', () => {
    const onQueryMatchChange = jest.fn();
    const isSecurityExampleEnabled = jest.fn().mockReturnValue(true);
    const telemetryService = new TelemetryService({
      config: {
        enabled: true,
        url: '',
        banner: true,
        allowChangingOptInStatus: true,
        optIn: false,
        optInStatusUrl: '',
        sendUsageFrom: 'browser',
      },
      reportOptInStatusChange: false,
      notifications: coreStart.notifications,
      http: coreSetup.http,
    });

    const component = mountWithIntl(
      <TelemetryManagementSection
        telemetryService={telemetryService}
        onQueryMatchChange={onQueryMatchChange}
        showAppliesSettingMessage={false}
        enableSaving={true}
        isSecurityExampleEnabled={isSecurityExampleEnabled}
        toasts={coreStart.notifications.toasts}
      />
    );
    try {
      const toggleExampleComponent = component.find('FormattedMessage > EuiLink[onClick]').at(0);
      const updatedView = toggleExampleComponent.simulate('click');
      updatedView.find('OptInExampleFlyout');
      updatedView.simulate('close');
    } finally {
      component.unmount();
    }
  });

  it('shows the OptInSecurityExampleFlyout', () => {
    const onQueryMatchChange = jest.fn();
    const isSecurityExampleEnabled = jest.fn().mockReturnValue(true);
    const telemetryService = new TelemetryService({
      config: {
        enabled: true,
        url: '',
        banner: true,
        allowChangingOptInStatus: true,
        optIn: false,
        optInStatusUrl: '',
        sendUsageFrom: 'browser',
      },
      reportOptInStatusChange: false,
      notifications: coreStart.notifications,
      http: coreSetup.http,
    });

    const component = mountWithIntl(
      <TelemetryManagementSection
        telemetryService={telemetryService}
        onQueryMatchChange={onQueryMatchChange}
        showAppliesSettingMessage={false}
        isSecurityExampleEnabled={isSecurityExampleEnabled}
        enableSaving={true}
        toasts={coreStart.notifications.toasts}
      />
    );
    try {
      const toggleExampleComponent = component.find('FormattedMessage > EuiLink[onClick]').at(1);
      const updatedView = toggleExampleComponent.simulate('click');
      updatedView.find('OptInSecurityExampleFlyout');
      updatedView.simulate('close');
    } finally {
      component.unmount();
    }
  });

  it('does not show the endpoint link when isSecurityExampleEnabled returns false', () => {
    const onQueryMatchChange = jest.fn();
    const isSecurityExampleEnabled = jest.fn().mockReturnValue(false);
    const telemetryService = new TelemetryService({
      config: {
        enabled: true,
        url: '',
        banner: true,
        allowChangingOptInStatus: true,
        optIn: false,
        optInStatusUrl: '',
        sendUsageFrom: 'browser',
      },
      reportOptInStatusChange: false,
      notifications: coreStart.notifications,
      http: coreSetup.http,
    });

    const component = mountWithIntl(
      <TelemetryManagementSection
        telemetryService={telemetryService}
        onQueryMatchChange={onQueryMatchChange}
        showAppliesSettingMessage={false}
        isSecurityExampleEnabled={isSecurityExampleEnabled}
        enableSaving={true}
        toasts={coreStart.notifications.toasts}
      />
    );

    try {
      const description = (component.instance() as TelemetryManagementSection).renderDescription();
      expect(isSecurityExampleEnabled).toBeCalled();
      expect(description).toMatchSnapshot();
    } finally {
      component.unmount();
    }
  });

  it('toggles the OptIn button', async () => {
    const onQueryMatchChange = jest.fn();
    const isSecurityExampleEnabled = jest.fn().mockReturnValue(true);
    const telemetryService = new TelemetryService({
      config: {
        enabled: true,
        url: '',
        banner: true,
        allowChangingOptInStatus: true,
        optIn: false,
        optInStatusUrl: '',
        sendUsageFrom: 'browser',
      },
      reportOptInStatusChange: false,
      notifications: coreStart.notifications,
      http: coreSetup.http,
    });

    const component = mountWithIntl(
      <TelemetryManagementSection
        telemetryService={telemetryService}
        onQueryMatchChange={onQueryMatchChange}
        showAppliesSettingMessage={false}
        enableSaving={true}
        isSecurityExampleEnabled={isSecurityExampleEnabled}
        toasts={coreStart.notifications.toasts}
      />
    );
    try {
      const toggleOptInComponent = component.find('Field');
      await expect(
        toggleOptInComponent.prop<TelemetryManagementSection['toggleOptIn']>('handleChange')()
      ).resolves.toBe(true);
      expect((component.state() as any).enabled).toBe(true);
      await expect(
        toggleOptInComponent.prop<TelemetryManagementSection['toggleOptIn']>('handleChange')()
      ).resolves.toBe(true);
      expect((component.state() as any).enabled).toBe(false);
      telemetryService.setOptIn = jest.fn().mockRejectedValue(Error('test-error'));
      await expect(
        toggleOptInComponent.prop<TelemetryManagementSection['toggleOptIn']>('handleChange')()
      ).rejects.toStrictEqual(Error('test-error'));
    } finally {
      component.unmount();
    }
  });

  it('test the wrapper (for coverage purposes)', () => {
    const onQueryMatchChange = jest.fn();
    const isSecurityExampleEnabled = jest.fn().mockReturnValue(true);
    const telemetryService = new TelemetryService({
      config: {
        enabled: true,
        url: '',
        banner: true,
        allowChangingOptInStatus: false,
        optIn: false,
        optInStatusUrl: '',
        sendUsageFrom: 'browser',
      },
      reportOptInStatusChange: false,
      notifications: coreStart.notifications,
      http: coreSetup.http,
    });

    expect(
      shallowWithIntl(
        <TelemetryManagementSection
          showAppliesSettingMessage={true}
          telemetryService={telemetryService}
          onQueryMatchChange={onQueryMatchChange}
          enableSaving={true}
          toasts={coreStart.notifications.toasts}
          isSecurityExampleEnabled={isSecurityExampleEnabled}
        />
      ).html()
    ).toMatchSnapshot();
  });
});
