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

export default function ({ getService, getPageObjects }) {
  const browser = getService('browser');
  const log = getService('log');
  const retry = getService('retry');
  const opensearchArchiver = getService('opensearchArchiver');
  const opensearchDashboardsServer = getService('opensearchDashboardsServer');
  const queryBar = getService('queryBar');
  const inspector = getService('inspector');
  const PageObjects = getPageObjects(['common', 'discover', 'header', 'timePicker']);
  const defaultSettings = {
    defaultIndex: 'logstash-*',
  };

  describe('discover app', function describeIndexTests() {
    before(async function () {
      // delete .opensearch_dashboards index and update configDoc
      await opensearchDashboardsServer.uiSettings.replace(defaultSettings);

      log.debug('load opensearch-dashboards index with default index pattern');
      await opensearchArchiver.load('discover');

      // and load a set of makelogs data
      await opensearchArchiver.loadIfNeeded('logstash_functional');
      log.debug('discover');
      await PageObjects.common.navigateToApp('discover');
      await PageObjects.timePicker.setDefaultAbsoluteRange();
    });

    describe('query', function () {
      const queryName1 = 'Query # 1';

      it('should show correct time range string by timepicker', async function () {
        const time = await PageObjects.timePicker.getTimeConfig();
        expect(time.start).to.be(PageObjects.timePicker.defaultStartTime);
        expect(time.end).to.be(PageObjects.timePicker.defaultEndTime);
      });

      it('save query should show toast message and display query name', async function () {
        await PageObjects.discover.saveSearch(queryName1);
        const actualQueryNameString = await PageObjects.discover.getCurrentQueryName();
        expect(actualQueryNameString).to.be(queryName1);
      });

      it('load query should show query name', async function () {
        await PageObjects.discover.loadSavedSearch(queryName1);

        await retry.try(async function () {
          expect(await PageObjects.discover.getCurrentQueryName()).to.be(queryName1);
        });
      });

      it('renaming a saved query should modify name in breadcrumb', async function () {
        const queryName2 = 'Modified Query # 1';
        await PageObjects.discover.loadSavedSearch(queryName1);
        await PageObjects.discover.saveSearch(queryName2);

        await retry.try(async function () {
          expect(await PageObjects.discover.getCurrentQueryName()).to.be(queryName2);
        });
      });

      it('should show the correct hit count', async function () {
        const expectedHitCount = '14,004';
        await retry.try(async function () {
          expect(await PageObjects.discover.getHitCount()).to.be(expectedHitCount);
        });
      });

      it('should show correct time range string in chart', async function () {
        const actualTimeString = await PageObjects.discover.getChartTimespan();
        const expectedTimeString = `${PageObjects.timePicker.defaultStartTime} - ${PageObjects.timePicker.defaultEndTime}`;
        expect(actualTimeString).to.be(expectedTimeString);
      });

      it('should modify the time range when a bar is clicked', async function () {
        await PageObjects.timePicker.setDefaultAbsoluteRange();
        await PageObjects.discover.clickHistogramBar();
        await PageObjects.discover.waitUntilSearchingHasFinished();
        const time = await PageObjects.timePicker.getTimeConfig();
        expect(time.start).to.be('Sep 21, 2015 @ 09:00:00.000');
        expect(time.end).to.be('Sep 21, 2015 @ 12:00:00.000');
        await retry.waitFor('doc table to contain the right search result', async () => {
          const rowData = await PageObjects.discover.getDocTableField(1);
          log.debug(`The first timestamp value in doc table: ${rowData}`);
          return rowData.includes('Sep 21, 2015 @ 11:59:22.316');
        });
      });

      it('should modify the time range when the histogram is brushed', async function () {
        await PageObjects.timePicker.setDefaultAbsoluteRange();
        await PageObjects.discover.brushHistogram();
        await PageObjects.discover.waitUntilSearchingHasFinished();

        const newDurationHours = await PageObjects.timePicker.getTimeDurationInHours();
        expect(Math.round(newDurationHours)).to.be(24);

        await retry.waitFor('doc table to contain the right search result', async () => {
          const rowData = await PageObjects.discover.getDocTableField(1);
          log.debug(`The first timestamp value in doc table: ${rowData}`);
          const dateParsed = Date.parse(rowData);
          //compare against the parsed date of Sep 20, 2015 @ 17:30:00.000 and Sep 20, 2015 @ 23:30:00.000
          return dateParsed >= 1442770200000 && dateParsed <= 1442791800000;
        });
      });

      it('should show correct initial chart interval of Auto', async function () {
        await PageObjects.timePicker.setDefaultAbsoluteRange();
        await PageObjects.discover.waitUntilSearchingHasFinished();
        const actualInterval = await PageObjects.discover.getChartInterval();

        const expectedInterval = 'Auto';
        expect(actualInterval).to.be(expectedInterval);
      });

      it('should show Auto chart interval', async function () {
        const expectedChartInterval = 'Auto';

        const actualInterval = await PageObjects.discover.getChartInterval();
        expect(actualInterval).to.be(expectedChartInterval);
      });

      it('should not show "no results"', async () => {
        const isVisible = await PageObjects.discover.hasNoResults();
        expect(isVisible).to.be(false);
      });

      it('should reload the saved search with persisted query to show the initial hit count', async function () {
        // apply query some changes
        await queryBar.setQuery('test');
        await queryBar.submitQuery();
        await retry.try(async function () {
          expect(await PageObjects.discover.getHitCount()).to.be('22');
        });

        // reset to persisted state
        await PageObjects.discover.clickResetSavedSearchButton();
        const expectedHitCount = '14,004';
        await retry.try(async function () {
          expect(await queryBar.getQueryString()).to.be('');
          expect(await PageObjects.discover.getHitCount()).to.be(expectedHitCount);
        });
      });
    });

    describe('query #2, which has an empty time range', () => {
      const fromTime = 'Jun 11, 1999 @ 09:22:11.000';
      const toTime = 'Jun 12, 1999 @ 11:21:04.000';

      before(async () => {
        log.debug('setAbsoluteRangeForAnotherQuery');
        await PageObjects.timePicker.setAbsoluteRange(fromTime, toTime);
        await PageObjects.discover.waitUntilSearchingHasFinished();
      });

      it('should show "no results"', async () => {
        const isVisible = await PageObjects.discover.hasNoResults();
        expect(isVisible).to.be(true);
      });

      it('should suggest a new time range is picked', async () => {
        const isVisible = await PageObjects.discover.hasNoResultsTimepicker();
        expect(isVisible).to.be(true);
      });
    });

    describe('nested query', () => {
      before(async () => {
        log.debug('setAbsoluteRangeForAnotherQuery');
        await PageObjects.timePicker.setDefaultAbsoluteRange();
        await PageObjects.discover.waitUntilSearchingHasFinished();
      });

      it('should support querying on nested fields', async function () {
        await queryBar.setQuery('nestedField:{ child: nestedValue }');
        await queryBar.submitQuery();
        await retry.try(async function () {
          expect(await PageObjects.discover.getHitCount()).to.be('1');
        });
      });
    });

    describe('data-shared-item', function () {
      it('should have correct data-shared-item title and description', async () => {
        const expected = {
          title: 'A Saved Search',
          description: 'A Saved Search Description',
        };

        await retry.try(async () => {
          await PageObjects.discover.loadSavedSearch(expected.title);
          const {
            title,
            description,
          } = await PageObjects.common.getSharedItemTitleAndDescription();
          expect(title).to.eql(expected.title);
          expect(description).to.eql(expected.description);
        });
      });
    });

    describe('time zone switch', () => {
      // skipping this until we get an elastic-chart alternative to check the ticks value
      it.skip('should show ticks in the correct time zone after switching', async function () {
        await opensearchDashboardsServer.uiSettings.replace({ 'dateFormat:tz': 'America/Phoenix' });
        await PageObjects.common.navigateToApp('discover');
        await PageObjects.header.awaitOpenSearchDashboardsChrome();
        await PageObjects.timePicker.setDefaultAbsoluteRange();

        const maxTicks = [
          '2015-09-20 00:00',
          '2015-09-20 12:00',
          '2015-09-21 00:00',
          '2015-09-21 12:00',
          '2015-09-22 00:00',
          '2015-09-22 12:00',
          '2015-09-23 00:00',
          '2015-09-23 12:00',
        ];

        await retry.try(async function () {
          for (const tick of await PageObjects.discover.getBarChartXTicks()) {
            if (!maxTicks.includes(tick)) {
              throw new Error(`unexpected x-axis tick "${tick}"`);
            }
          }
        });
      });
      it('should show bars in the correct time zone after switching', async function () {
        await opensearchDashboardsServer.uiSettings.replace({ 'dateFormat:tz': 'America/Phoenix' });
        await PageObjects.common.navigateToApp('discover');
        await PageObjects.header.awaitOpenSearchDashboardsChrome();
        await queryBar.clearQuery();
        await PageObjects.timePicker.setDefaultAbsoluteRange();

        log.debug(
          'check that the newest doc timestamp is now -7 hours from the UTC time in the first test'
        );
        const rowData = await PageObjects.discover.getDocTableIndex(1);
        expect(rowData.startsWith('Sep 22, 2015 @ 16:50:13.253')).to.be.ok();
      });
    });
    describe('usage of discover:searchOnPageLoad', () => {
      it('should fetch data from OpenSearch initially when discover:searchOnPageLoad is false', async function () {
        await opensearchDashboardsServer.uiSettings.replace({ 'discover:searchOnPageLoad': false });
        await PageObjects.common.navigateToApp('discover');
        await PageObjects.header.awaitOpenSearchDashboardsChrome();

        expect(await PageObjects.discover.getNrOfFetches()).to.be(0);
      });

      it('should not fetch data from OpenSearch initially when discover:searchOnPageLoad is true', async function () {
        await opensearchDashboardsServer.uiSettings.replace({ 'discover:searchOnPageLoad': true });
        await PageObjects.common.navigateToApp('discover');
        await PageObjects.header.awaitOpenSearchDashboardsChrome();

        expect(await PageObjects.discover.getNrOfFetches()).to.be(1);
      });
    });

    describe('invalid time range in URL', function () {
      it('should get the default timerange', async function () {
        const prevTime = await PageObjects.timePicker.getTimeConfig();
        await PageObjects.common.navigateToUrl('discover', '#/?_g=(time:(from:now-15m,to:null))', {
          useActualUrl: true,
        });
        await PageObjects.header.awaitOpenSearchDashboardsChrome();
        const time = await PageObjects.timePicker.getTimeConfig();
        expect(time.start).to.be(prevTime.start);
        expect(time.end).to.be(prevTime.end);
      });
    });

    describe('empty query', function () {
      it('should update the histogram timerange when the query is resubmitted', async function () {
        await opensearchDashboardsServer.uiSettings.update({
          'timepicker:timeDefaults': '{  "from": "2015-09-18T19:37:13.000Z",  "to": "now"}',
        });
        await PageObjects.common.navigateToApp('discover');
        await PageObjects.header.awaitOpenSearchDashboardsChrome();
        const initialTimeString = await PageObjects.discover.getChartTimespan();
        await queryBar.submitQuery();
        const refreshedTimeString = await PageObjects.discover.getChartTimespan();
        expect(refreshedTimeString).not.to.be(initialTimeString);
      });
    });

    describe('managing fields', function () {
      it('should add a field, sort by it, remove it and also sorting by it', async function () {
        await PageObjects.timePicker.setDefaultAbsoluteRangeViaUiSettings();
        await PageObjects.common.navigateToApp('discover');
        await PageObjects.discover.clickFieldListItemAdd('_score');
        await PageObjects.discover.clickFieldSort('_score');
        const currentUrlWithScore = await browser.getCurrentUrl();
        expect(currentUrlWithScore).to.contain('_score');
        await PageObjects.discover.clickFieldListItemAdd('_score');
        const currentUrlWithoutScore = await browser.getCurrentUrl();
        expect(currentUrlWithoutScore).not.to.contain('_score');
      });
    });

    describe('refresh interval', function () {
      it('should refetch when autofresh is enabled', async () => {
        const intervalS = 5;
        await PageObjects.timePicker.startAutoRefresh(intervalS);

        // check inspector panel request stats for timestamp
        await inspector.open();

        const getRequestTimestamp = async () => {
          const requestStats = await inspector.getTableData();
          const requestTimestamp = requestStats.filter((r) =>
            r[0].includes('Request timestamp')
          )[0][1];
          return requestTimestamp;
        };

        const requestTimestampBefore = await getRequestTimestamp();
        await retry.waitFor('refetch because of refresh interval', async () => {
          const requestTimestampAfter = await getRequestTimestamp();
          log.debug(
            `Timestamp before: ${requestTimestampBefore}, Timestamp after: ${requestTimestampAfter}`
          );
          return requestTimestampBefore !== requestTimestampAfter;
        });
      });

      after(async () => {
        await inspector.close();
        await PageObjects.timePicker.pauseAutoRefresh();
      });
    });
  });
}
