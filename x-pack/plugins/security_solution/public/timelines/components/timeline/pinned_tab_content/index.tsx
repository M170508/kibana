/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiFlexGroup, EuiFlexItem, EuiFlyoutBody, EuiFlyoutFooter } from '@elastic/eui';
import { isEmpty } from 'lodash/fp';
import React, { useMemo, useCallback } from 'react';
import styled from 'styled-components';
import type { Dispatch } from 'redux';
import type { ConnectedProps } from 'react-redux';
import { connect } from 'react-redux';
import deepEqual from 'fast-deep-equal';

import { DataLoadingState } from '@kbn/unified-data-table';
import type { ControlColumnProps } from '../../../../../common/types';
import { timelineActions, timelineSelectors } from '../../../store/timeline';
import type { CellValueElementProps } from '../cell_rendering';
import type { Direction } from '../../../../../common/search_strategy';
import { useTimelineEvents } from '../../../containers';
import { defaultHeaders } from '../body/column_headers/default_headers';
import { StatefulBody } from '../body';
import { Footer, footerHeight } from '../footer';
import { requiredFieldsForActions } from '../../../../detections/components/alerts_table/default_config';
import { EventDetailsWidthProvider } from '../../../../common/components/events_viewer/event_details_width_context';
import { SourcererScopeName } from '../../../../common/store/sourcerer/model';
import { timelineDefaults } from '../../../store/timeline/defaults';
import { useSourcererDataView } from '../../../../common/containers/sourcerer';
import { useTimelineFullScreen } from '../../../../common/containers/use_full_screen';
import type { TimelineModel } from '../../../store/timeline/model';
import type { State } from '../../../../common/store';
import { calculateTotalPages } from '../helpers';
import type { RowRenderer, ToggleDetailPanel } from '../../../../../common/types/timeline';
import { TimelineTabs } from '../../../../../common/types/timeline';
import { DetailsPanel } from '../../side_panel';
import { ExitFullScreen } from '../../../../common/components/exit_full_screen';
import { getDefaultControlColumn } from '../body/control_columns';
import { useLicense } from '../../../../common/hooks/use_license';
import { HeaderActions } from '../../../../common/components/header_actions/header_actions';

const StyledEuiFlyoutBody = styled(EuiFlyoutBody)`
  overflow-y: hidden;
  flex: 1;

  .euiFlyoutBody__overflow {
    overflow: hidden;
    mask-image: none;
  }

  .euiFlyoutBody__overflowContent {
    padding: 0;
    height: 100%;
    display: flex;
  }
`;

const StyledEuiFlyoutFooter = styled(EuiFlyoutFooter)`
  background: none;
  padding: 0;

  &.euiFlyoutFooter {
    ${({ theme }) => `padding: ${theme.eui.euiSizeS} 0 0 0;`}
  }
`;

const ExitFullScreenContainer = styled.div`
  width: 180px;
`;

const FullWidthFlexGroup = styled(EuiFlexGroup)`
  margin: 0;
  width: 100%;
  overflow: hidden;
`;

const ScrollableFlexItem = styled(EuiFlexItem)`
  overflow: hidden;
`;

const VerticalRule = styled.div`
  width: 2px;
  height: 100%;
  background: ${({ theme }) => theme.eui.euiColorLightShade};
`;

VerticalRule.displayName = 'VerticalRule';

interface OwnProps {
  renderCellValue: (props: CellValueElementProps) => React.ReactNode;
  rowRenderers: RowRenderer[];
  timelineId: string;
}

interface PinnedFilter {
  bool: {
    should: Array<{ match_phrase: { _id: string } }>;
    minimum_should_match: number;
  };
}

export type Props = OwnProps & PropsFromRedux;

const trailingControlColumns: ControlColumnProps[] = []; // stable reference

export const PinnedTabContentComponent: React.FC<Props> = ({
  columns,
  timelineId,
  itemsPerPage,
  itemsPerPageOptions,
  pinnedEventIds,
  onEventClosed,
  renderCellValue,
  rowRenderers,
  showExpandedDetails,
  sort,
}) => {
  const {
    browserFields,
    dataViewId,
    loading: loadingSourcerer,
    runtimeMappings,
    selectedPatterns,
  } = useSourcererDataView(SourcererScopeName.timeline);
  const { setTimelineFullScreen, timelineFullScreen } = useTimelineFullScreen();
  const isEnterprisePlus = useLicense().isEnterprise();
  const ACTION_BUTTON_COUNT = isEnterprisePlus ? 6 : 5;

  const filterQuery = useMemo(() => {
    if (isEmpty(pinnedEventIds)) {
      return '';
    }
    const filterObj = Object.entries(pinnedEventIds).reduce<PinnedFilter>(
      (acc, [pinnedId, isPinned]) => {
        if (isPinned) {
          return {
            ...acc,
            bool: {
              ...acc.bool,
              should: [
                ...acc.bool.should,
                {
                  match_phrase: {
                    _id: pinnedId,
                  },
                },
              ],
            },
          };
        }
        return acc;
      },
      {
        bool: {
          should: [],
          minimum_should_match: 1,
        },
      }
    );
    try {
      return JSON.stringify(filterObj);
    } catch {
      return '';
    }
  }, [pinnedEventIds]);

  const timelineQueryFields = useMemo(() => {
    const columnsHeader = isEmpty(columns) ? defaultHeaders : columns;
    const columnFields = columnsHeader.map((c) => c.id);

    return [...columnFields, ...requiredFieldsForActions];
  }, [columns]);

  const timelineQuerySortField = useMemo(
    () =>
      sort.map(({ columnId, columnType, esTypes, sortDirection }) => ({
        field: columnId,
        type: columnType,
        direction: sortDirection as Direction,
        esTypes: esTypes ?? [],
      })),
    [sort]
  );

  const [dataLoadingState, { events, totalCount, pageInfo, loadPage, refreshedAt, refetch }] =
    useTimelineEvents({
      endDate: '',
      id: `pinned-${timelineId}`,
      indexNames: selectedPatterns,
      dataViewId,
      fields: timelineQueryFields,
      limit: itemsPerPage,
      filterQuery,
      runtimeMappings,
      skip: filterQuery === '',
      startDate: '',
      sort: timelineQuerySortField,
      timerangeKind: undefined,
    });

  const isQueryLoading = useMemo(() => {
    return (
      dataLoadingState === DataLoadingState.loading ||
      dataLoadingState === DataLoadingState.loadingMore
    );
  }, [dataLoadingState]);

  const handleOnPanelClosed = useCallback(() => {
    onEventClosed({ tabType: TimelineTabs.pinned, id: timelineId });
  }, [timelineId, onEventClosed]);

  const leadingControlColumns = useMemo(
    () =>
      getDefaultControlColumn(ACTION_BUTTON_COUNT).map((x) => ({
        ...x,
        headerCellRender: HeaderActions,
      })),
    [ACTION_BUTTON_COUNT]
  );

  return (
    <>
      <FullWidthFlexGroup data-test-subj={`${TimelineTabs.pinned}-tab`}>
        <ScrollableFlexItem grow={2}>
          {timelineFullScreen && setTimelineFullScreen != null && (
            <ExitFullScreenContainer>
              <ExitFullScreen
                fullScreen={timelineFullScreen}
                setFullScreen={setTimelineFullScreen}
              />
            </ExitFullScreenContainer>
          )}
          <EventDetailsWidthProvider>
            <StyledEuiFlyoutBody
              data-test-subj={`${TimelineTabs.pinned}-tab-flyout-body`}
              className="timeline-flyout-body"
            >
              <StatefulBody
                activePage={pageInfo.activePage}
                browserFields={browserFields}
                data={events}
                id={timelineId}
                refetch={refetch}
                renderCellValue={renderCellValue}
                rowRenderers={rowRenderers}
                sort={sort}
                tabType={TimelineTabs.pinned}
                totalPages={calculateTotalPages({
                  itemsCount: totalCount,
                  itemsPerPage,
                })}
                leadingControlColumns={leadingControlColumns}
                trailingControlColumns={trailingControlColumns}
              />
            </StyledEuiFlyoutBody>
            <StyledEuiFlyoutFooter
              data-test-subj={`${TimelineTabs.pinned}-tab-flyout-footer`}
              className="timeline-flyout-footer"
            >
              <Footer
                activePage={pageInfo.activePage}
                data-test-subj="timeline-footer"
                updatedAt={refreshedAt}
                height={footerHeight}
                id={timelineId}
                isLive={false}
                isLoading={isQueryLoading || loadingSourcerer}
                itemsCount={events.length}
                itemsPerPage={itemsPerPage}
                itemsPerPageOptions={itemsPerPageOptions}
                onChangePage={loadPage}
                totalCount={totalCount}
              />
            </StyledEuiFlyoutFooter>
          </EventDetailsWidthProvider>
        </ScrollableFlexItem>
        {showExpandedDetails && (
          <>
            <VerticalRule />
            <ScrollableFlexItem grow={1}>
              <DetailsPanel
                browserFields={browserFields}
                handleOnPanelClosed={handleOnPanelClosed}
                runtimeMappings={runtimeMappings}
                tabType={TimelineTabs.pinned}
                scopeId={timelineId}
              />
            </ScrollableFlexItem>
          </>
        )}
      </FullWidthFlexGroup>
    </>
  );
};

const makeMapStateToProps = () => {
  const getTimeline = timelineSelectors.getTimelineByIdSelector();
  const mapStateToProps = (state: State, { timelineId }: OwnProps) => {
    const timeline: TimelineModel = getTimeline(state, timelineId) ?? timelineDefaults;
    const { columns, expandedDetail, itemsPerPage, itemsPerPageOptions, pinnedEventIds, sort } =
      timeline;

    return {
      columns,
      timelineId,
      itemsPerPage,
      itemsPerPageOptions,
      pinnedEventIds,
      showExpandedDetails:
        !!expandedDetail[TimelineTabs.pinned] && !!expandedDetail[TimelineTabs.pinned]?.panelView,
      sort,
    };
  };
  return mapStateToProps;
};

const mapDispatchToProps = (dispatch: Dispatch, { timelineId }: OwnProps) => ({
  onEventClosed: (args: ToggleDetailPanel) => {
    dispatch(timelineActions.toggleDetailPanel(args));
  },
});

const connector = connect(makeMapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

const PinnedTabContent = connector(
  React.memo(
    PinnedTabContentComponent,
    (prevProps, nextProps) =>
      prevProps.itemsPerPage === nextProps.itemsPerPage &&
      prevProps.onEventClosed === nextProps.onEventClosed &&
      prevProps.showExpandedDetails === nextProps.showExpandedDetails &&
      prevProps.timelineId === nextProps.timelineId &&
      deepEqual(prevProps.columns, nextProps.columns) &&
      deepEqual(prevProps.itemsPerPageOptions, nextProps.itemsPerPageOptions) &&
      deepEqual(prevProps.pinnedEventIds, nextProps.pinnedEventIds) &&
      deepEqual(prevProps.sort, nextProps.sort)
  )
);

// eslint-disable-next-line import/no-default-export
export { PinnedTabContent as default };
