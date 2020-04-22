/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { Component } from 'react';
import {
  EuiButtonIcon,
  EuiPopover,
  EuiContextMenu,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { DRAW_TYPE, ES_GEO_FIELD_TYPE } from '../../../../common/constants';
import { FormattedMessage } from '@kbn/i18n/react';
import { GeometryFilterForm } from '../../../components/geometry_filter_form';
import { DistanceFilterForm } from '../../../components/distance_filter_form';

const DRAW_SHAPE_LABEL = i18n.translate('xpack.maps.toolbarOverlay.drawShapeLabel', {
  defaultMessage: 'Draw shape to filter data',
});

const DRAW_BOUNDS_LABEL = i18n.translate('xpack.maps.toolbarOverlay.drawBoundsLabel', {
  defaultMessage: 'Draw bounds to filter data',
});

const DRAW_DISTANCE_LABEL = i18n.translate('xpack.maps.toolbarOverlay.drawDistanceLabel', {
  defaultMessage: 'Draw distance to filter data',
});

const DRAW_SHAPE_LABEL_SHORT = i18n.translate('xpack.maps.toolbarOverlay.drawShapeLabelShort', {
  defaultMessage: 'Draw shape',
});

const DRAW_BOUNDS_LABEL_SHORT = i18n.translate('xpack.maps.toolbarOverlay.drawBoundsLabelShort', {
  defaultMessage: 'Draw bounds',
});

const DRAW_DISTANCE_LABEL_SHORT = i18n.translate(
  'xpack.maps.toolbarOverlay.drawDistanceLabelShort',
  {
    defaultMessage: 'Draw distance',
  }
);

export class ToolsControl extends Component {
  state = {
    isPopoverOpen: false,
  };

  _togglePopover = () => {
    this.setState(prevState => ({
      isPopoverOpen: !prevState.isPopoverOpen,
    }));
  };

  _closePopover = () => {
    this.setState({ isPopoverOpen: false });
  };

  _initiateShapeDraw = options => {
    this.props.initiateDraw({
      drawType: DRAW_TYPE.POLYGON,
      ...options,
    });
    this._closePopover();
  };

  _initiateBoundsDraw = options => {
    this.props.initiateDraw({
      drawType: DRAW_TYPE.BOUNDS,
      ...options,
    });
    this._closePopover();
  };

  _initiateDistanceDraw = options => {
    this.props.initiateDraw({
      drawType: DRAW_TYPE.DISTANCE,
      ...options,
    });
    this._closePopover();
  };

  _getDrawPanels() {
    const tools = [
      {
        name: DRAW_SHAPE_LABEL,
        panel: 1,
      },
      {
        name: DRAW_BOUNDS_LABEL,
        panel: 2,
      },
    ];

    const hasGeoPoints = this.props.geoFields.some(({ geoFieldType }) => {
      return geoFieldType === ES_GEO_FIELD_TYPE.GEO_POINT;
    });
    if (hasGeoPoints) {
      tools.push({
        name: DRAW_DISTANCE_LABEL,
        panel: 3,
      });
    }

    return [
      {
        id: 0,
        title: i18n.translate('xpack.maps.toolbarOverlay.tools.toolbarTitle', {
          defaultMessage: 'Tools',
        }),
        items: tools,
      },
      {
        id: 1,
        title: DRAW_SHAPE_LABEL_SHORT,
        content: (
          <GeometryFilterForm
            className="mapDrawControl__geometryFilterForm"
            buttonLabel={DRAW_SHAPE_LABEL_SHORT}
            geoFields={this.props.geoFields}
            intitialGeometryLabel={i18n.translate(
              'xpack.maps.toolbarOverlay.drawShape.initialGeometryLabel',
              {
                defaultMessage: 'shape',
              }
            )}
            onSubmit={this._initiateShapeDraw}
          />
        ),
      },
      {
        id: 2,
        title: DRAW_BOUNDS_LABEL_SHORT,
        content: (
          <GeometryFilterForm
            className="mapDrawControl__geometryFilterForm"
            buttonLabel={DRAW_BOUNDS_LABEL_SHORT}
            geoFields={this.props.geoFields}
            intitialGeometryLabel={i18n.translate(
              'xpack.maps.toolbarOverlay.drawBounds.initialGeometryLabel',
              {
                defaultMessage: 'bounds',
              }
            )}
            onSubmit={this._initiateBoundsDraw}
          />
        ),
      },
      {
        id: 3,
        title: DRAW_DISTANCE_LABEL_SHORT,
        content: (
          <DistanceFilterForm
            className="mapDrawControl__geometryFilterForm"
            buttonLabel={DRAW_DISTANCE_LABEL_SHORT}
            geoFields={this.props.geoFields.filter(({ geoFieldType }) => {
              return geoFieldType === ES_GEO_FIELD_TYPE.GEO_POINT;
            })}
            onSubmit={this._initiateDistanceDraw}
          />
        ),
      },
    ];
  }

  _renderToolsButton() {
    return (
      <EuiButtonIcon
        className="mapToolbarOverlay__button"
        color="text"
        iconType="wrench"
        onClick={this._togglePopover}
        aria-label={i18n.translate('xpack.maps.toolbarOverlay.toolsControlTitle', {
          defaultMessage: 'Tools',
        })}
        title={i18n.translate('xpack.maps.toolbarOverlay.toolsControlTitle', {
          defaultMessage: 'Tools',
        })}
      />
    );
  }

  render() {
    const toolsPopoverButton = (
      <EuiPopover
        id="contextMenu"
        button={this._renderToolsButton()}
        isOpen={this.state.isPopoverOpen}
        closePopover={this._closePopover}
        panelPaddingSize="none"
        withTitle
        anchorPosition="leftUp"
      >
        <EuiContextMenu initialPanelId={0} panels={this._getDrawPanels()} />
      </EuiPopover>
    );

    if (!this.props.isDrawingFilter) {
      return toolsPopoverButton;
    }

    return (
      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem>{toolsPopoverButton}</EuiFlexItem>
        <EuiFlexItem>
          <EuiButton size="s" fill onClick={this.props.cancelDraw}>
            <FormattedMessage
              id="xpack.maps.tooltip.toolsControl.cancelDrawButtonLabel"
              defaultMessage="Cancel"
            />
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
}