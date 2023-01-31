/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import Chance from 'chance';
import { within } from '@testing-library/dom';
import type { FtrProviderContext } from '../ftr_provider_context';

// eslint-disable-next-line import/no-default-export
export default function ({ getPageObjects, getService }: FtrProviderContext) {
  const retry = getService('retry');
  const pageObjects = getPageObjects(['common', 'cloudPostureDashboard']);
  const chance = new Chance();

  const data = [
    {
      resource: { id: chance.guid(), name: `kubelet`, sub_type: 'lower case sub type' },
      result: { evaluation: 'failed' },
      rule: {
        name: 'Upper case rule name',
        section: 'Upper case section',
        benchmark: {
          id: 'cis_k8s',
        },
      },
      cluster_id: 'Upper case cluster id',
    },
  ];

  describe('Cloud Posture Dashboard Page', () => {
    let cspDashboard: typeof pageObjects.cloudPostureDashboard;
    let dashboard: typeof pageObjects.cloudPostureDashboard.dashboard;

    before(async () => {
      cspDashboard = pageObjects.cloudPostureDashboard;
      dashboard = pageObjects.cloudPostureDashboard.dashboard;

      await cspDashboard.index.add(data);
      await cspDashboard.navigateToComplianceDashboardPage();
      await retry.waitFor(
        'Cloud posture dashboard to be displayed',
        async () => !!dashboard.getDashboardContainer()
      );
    });

    after(async () => {
      await cspDashboard.index.remove();
    });

    describe('Kubernetes Dashboard', () => {
      it('displays accurate summary compliance score', async () => {
        const scoreElement = await dashboard.getKubernetesComplianceScore2();

        expect((await scoreElement.getVisibleText()) === '0%').to.be(true);
        expect((await scoreElement.getVisibleText()) === '0%').to.be(true);
        const { getByText } = within(scoreElement);
        expect(getByText('0%')).toBeInTheDocument();
      });
    });
  });
}
