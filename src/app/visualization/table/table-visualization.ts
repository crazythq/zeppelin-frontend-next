import { ViewContainerRef } from '@angular/core';
import { GraphConfig } from 'zeppelin-sdk';
import { TableTransformation } from '../table-transformation';
import { Setting, Transformation } from '../transformation';
import { Visualization } from '../visualization';
import { CdkPortalOutlet } from '@angular/cdk/portal';
import { VisualizationComponentPortal } from '../visualization-component-portal';
import { TableVisualizationComponent } from './table-visualization.component';

export class TableVisualization extends Visualization {
  tableTransformation = new TableTransformation(this.getConfig());
  componentPortal = new VisualizationComponentPortal<TableVisualization, TableVisualizationComponent>(
    this,
    TableVisualizationComponent,
    this.portalOutlet,
    this.viewContainerRef
  );
  constructor(config: GraphConfig, private portalOutlet: CdkPortalOutlet, private viewContainerRef: ViewContainerRef) {
    super(config);
  }

  destroy(): void {}

  getSetting(): Setting {
    return undefined;
  }

  getTransformation(): Transformation {
    return this.tableTransformation;
  }

  refresh(): void {}

  render(data): void {
    this.tableData = data;
    this.componentPortal.attachComponentPortal();
  }
}
