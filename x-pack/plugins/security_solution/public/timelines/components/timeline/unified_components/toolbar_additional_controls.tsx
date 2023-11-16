/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { EuiToolTip, EuiButtonIcon } from '@elastic/eui';
import React, { useMemo, useCallback } from 'react';

import { EXIT_FULL_SCREEN_CLASS_NAME } from '../../../../common/components/exit_full_screen';
import { isActiveTimeline } from '../../../../helpers';
import { TimelineId } from '../../../../../common/types/timeline';
import {
  useGlobalFullScreen,
  useTimelineFullScreen,
} from '../../../../common/containers/use_full_screen';
import { StatefulRowRenderersBrowser } from '../../row_renderers_browser';
import { FixedWidthLastUpdatedContainer } from './last_updated';
import * as i18n from './translations';

export const isFullScreen = ({
  globalFullScreen,
  isActiveTimelines,
  timelineFullScreen,
}: {
  globalFullScreen: boolean;
  isActiveTimelines: boolean;
  timelineFullScreen: boolean;
}) =>
  (isActiveTimelines && timelineFullScreen) || (isActiveTimelines === false && globalFullScreen);

interface Props {
  timelineId: string;
  updatedAt: number;
}

export const ToolbarAdditionalControlsComponent: React.FC<Props> = ({ timelineId, updatedAt }) => {
  const { timelineFullScreen, setTimelineFullScreen } = useTimelineFullScreen();
  const { globalFullScreen, setGlobalFullScreen } = useGlobalFullScreen();

  const toggleFullScreen = useCallback(() => {
    if (timelineId === TimelineId.active) {
      setTimelineFullScreen(!timelineFullScreen);
    } else {
      setGlobalFullScreen(!globalFullScreen);
    }
  }, [
    timelineId,
    setTimelineFullScreen,
    timelineFullScreen,
    setGlobalFullScreen,
    globalFullScreen,
  ]);
  const fullScreen = useMemo(
    () =>
      isFullScreen({
        globalFullScreen,
        isActiveTimelines: isActiveTimeline(timelineId),
        timelineFullScreen,
      }),
    [globalFullScreen, timelineFullScreen, timelineId]
  );

  return (
    <>
      {' '}
      <StatefulRowRenderersBrowser data-test-subj="row-renderers-browser" timelineId={timelineId} />
      <FixedWidthLastUpdatedContainer updatedAt={updatedAt} />
      <span className="rightPosition">
        <EuiToolTip content={fullScreen ? i18n.EXIT_FULL_SCREEN : i18n.FULL_SCREEN}>
          <EuiButtonIcon
            aria-label={
              isFullScreen({
                globalFullScreen,
                isActiveTimelines: isActiveTimeline(timelineId),
                timelineFullScreen,
              })
                ? i18n.EXIT_FULL_SCREEN
                : i18n.FULL_SCREEN
            }
            className={`${fullScreen ? EXIT_FULL_SCREEN_CLASS_NAME : ''}`}
            color={fullScreen ? 'ghost' : 'primary'}
            data-test-subj={
              // a full screen button gets created for timeline and for the host page
              // this sets the data-test-subj for each case so that tests can differentiate between them
              isActiveTimeline(timelineId) ? 'full-screen-active' : 'full-screen'
            }
            iconType="fullScreen"
            onClick={toggleFullScreen}
          />
        </EuiToolTip>
      </span>
    </>
  );
};

export const ToolbarAdditionalControls = React.memo(ToolbarAdditionalControlsComponent);
// eslint-disable-next-line import/no-default-export
export { ToolbarAdditionalControls as default };
