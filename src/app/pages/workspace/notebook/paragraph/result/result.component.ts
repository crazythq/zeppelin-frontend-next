import { CdkPortalOutlet } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';
import * as hljs from 'highlight.js';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { utils, WorkSheet, writeFile, WritingOptions } from 'xlsx';
import * as Convert from 'ansi-to-html';
import {
  DatasetType,
  GraphConfig,
  ParagraphConfigResult,
  ParagraphIResultsMsgItem,
  VisualizationLineChart,
  VisualizationMode,
  VisualizationMultiBarChart,
  VisualizationScatterChart,
  VisualizationStackedAreaChart
} from 'zeppelin-sdk';
import { ResizeResult } from 'zeppelin-share/rect-resize/rect-resize.directive';
import { NgZService } from '../../../../../services/ng-z.service';
import { DynamicTemplate, RuntimeCompilerService } from '../../../../../services/runtime-compiler.service';
import { AreaChartVisualization } from '../../../../../visualization/area-chart/area-chart-visualization';
import { BarChartVisualization } from '../../../../../visualization/bar-chart/bar-chart-visualization';
import { TableData } from '../../../../../visualization/dataset/table-data';
import { LineChartVisualization } from '../../../../../visualization/line-chart/line-chart-visualization';
import { PieChartVisualization } from '../../../../../visualization/pie-chart/pie-chart-visualization';
import { ScatterChartVisualization } from '../../../../../visualization/scatter-chart/scatter-chart-visualization';
import { TableVisualization } from '../../../../../visualization/table/table-visualization';
import { Visualization } from '../../../../../visualization/visualization';

@Component({
  selector: 'zeppelin-notebook-paragraph-result',
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotebookParagraphResultComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() result: ParagraphIResultsMsgItem;
  @Input() config: ParagraphConfigResult;
  @Input() id: string;
  @Input() currentCol = 12;
  @Output() configChange = new EventEmitter<ParagraphConfigResult>();
  @Output() sizeChange = new EventEmitter<ResizeResult>();
  @ViewChild('graphEle', { static: false }) graphEle: ElementRef<HTMLDivElement>;
  @ViewChild(CdkPortalOutlet, { static: false }) portalOutlet: CdkPortalOutlet;

  private destroy$ = new Subject();
  datasetType = DatasetType;
  angularComponent: DynamicTemplate;
  innerHTML: string | SafeHtml = '';
  plainText: string | SafeHtml = '';
  imgData: string | SafeUrl = '';
  tableData = new TableData();
  visualizations = [
    {
      id: 'table',
      name: 'Table',
      icon: 'table',
      Class: TableVisualization,
      changeSubscription: null,
      instance: undefined
    },
    {
      id: 'multiBarChart',
      name: 'Bar Chart',
      icon: 'bar-chart',
      Class: BarChartVisualization,
      changeSubscription: null,
      instance: undefined
    },
    {
      id: 'pieChart',
      name: 'Pie Chart',
      icon: 'pie-chart',
      Class: PieChartVisualization,
      changeSubscription: null,
      instance: undefined
    },
    {
      id: 'lineChart',
      name: 'Line Chart',
      icon: 'line-chart',
      Class: LineChartVisualization,
      changeSubscription: null,
      instance: undefined
    },
    {
      id: 'stackedAreaChart',
      name: 'Area Chart',
      icon: 'area-chart',
      Class: AreaChartVisualization,
      changeSubscription: null,
      instance: undefined
    },
    {
      id: 'scatterChart',
      name: 'Scatter Chart',
      icon: 'dot-chart',
      Class: ScatterChartVisualization,
      changeSubscription: null,
      instance: undefined
    }
  ];

  constructor(
    private viewContainerRef: ViewContainerRef,
    private cdr: ChangeDetectorRef,
    private runtimeCompilerService: RuntimeCompilerService,
    private sanitizer: DomSanitizer,
    private injector: Injector,
    private ngZService: NgZService
  ) {}

  ngOnInit() {
    this.ngZService
      .contextChanged()
      .pipe(takeUntil(this.destroy$))
      .subscribe(change => {
        if (change.paragraphId === this.id) {
          this.cdr.markForCheck();
        }
      });
  }

  exportFile(type: 'csv' | 'tsv'): void {
    if (this.tableData && this.tableData.rows) {
      const wb = utils.book_new();
      let ws: WorkSheet;
      ws = utils.json_to_sheet(this.tableData.rows);
      utils.book_append_sheet(wb, ws, 'Sheet1');
      writeFile(wb, `export.${type}`, {
        bookType: 'csv',
        FS: type === 'tsv' ? '\t' : ','
      } as WritingOptions);
    }
  }

  switchMode(mode: VisualizationMode) {
    this.config.graph.mode = mode;
    this.renderGraph();
    this.configChange.emit(this.config);
  }

  switchSetting() {
    this.config.graph.optionOpen = !this.config.graph.optionOpen;
    this.renderGraph();
    this.configChange.emit(this.config);
  }

  updateResult(config: ParagraphConfigResult, result: ParagraphIResultsMsgItem) {
    this.config = config;
    this.result = result;
    this.renderDefaultDisplay();
  }

  renderDefaultDisplay() {
    switch (this.result.type) {
      case DatasetType.TABLE:
        this.renderGraph();
        break;
      case DatasetType.TEXT:
        this.renderText();
        break;
      case DatasetType.HTML:
        this.renderHTML();
        break;
      case DatasetType.IMG:
        this.renderImg();
        break;
      case DatasetType.ANGULAR:
        this.renderAngular();
        break;
    }
    this.cdr.markForCheck();
  }

  renderHTML(): void {
    const div = document.createElement('div');
    div.innerHTML = this.result.data;
    const codeEle: HTMLElement = div.querySelector('pre code');
    if (codeEle) {
      hljs.highlightBlock(codeEle);
    }
    this.innerHTML = this.sanitizer.bypassSecurityTrustHtml(div.innerHTML);
  }

  renderAngular(): void {
    this.runtimeCompilerService.createAndCompileTemplate(this.id, this.result.data).then(data => {
      this.angularComponent = data;
      // this.angularComponent.moduleFactory
      this.cdr.markForCheck();
    });
  }

  renderText(): void {
    // tslint:disable-next-line:no-any
    const convert: any = new Convert();
    this.plainText = this.sanitizer.bypassSecurityTrustHtml(convert.toHtml(this.result.data));
  }

  renderImg(): void {
    this.imgData = this.sanitizer.bypassSecurityTrustUrl(`data:image/png;base64,${this.result.data}`);
  }

  setGraphConfig() {
    const visualizationItem = this.visualizations.find(v => v.id === this.config.graph.mode);
    if (!visualizationItem || !visualizationItem.instance) {
      return;
    }
    visualizationItem.instance.setConfig(this.config.graph);
  }

  renderGraph() {
    this.setDefaultConfig();
    let instance: Visualization;
    const visualizationItem = this.visualizations.find(v => v.id === this.config.graph.mode);
    if (!visualizationItem) {
      return;
    }
    this.destroyVisualizations(this.config.graph.mode);
    if (!visualizationItem.instance) {
      instance = new visualizationItem.Class(this.config.graph, this.portalOutlet, this.viewContainerRef);
      visualizationItem.instance = instance;
      visualizationItem.changeSubscription = instance.configChanged().subscribe(config => {
        this.config.graph = config;
        this.renderGraph();
        this.configChange.emit({
          graph: config
        });
      });
    } else {
      instance = visualizationItem.instance;
      instance.setConfig(this.config.graph);
    }
    this.tableData.loadParagraphResult(this.result);
    const transformation = instance.getTransformation();
    transformation.setConfig(this.config.graph);
    transformation.setTableData(this.tableData);
    const transformed = transformation.transform(this.tableData);
    instance.render(transformed);
  }

  destroyVisualizations(omit?: string) {
    this.visualizations.forEach(v => {
      if (v.id !== omit && v.instance) {
        if (v.changeSubscription instanceof Subscription) {
          v.changeSubscription.unsubscribe();
          v.changeSubscription = null;
        }
        if (typeof v.instance.destroy === 'function') {
          v.instance.destroy();
        }
        v.instance = undefined;
      }
    });
  }

  setDefaultConfig() {
    if (!this.config || !this.config.graph) {
      this.config = { graph: new GraphConfig() };
    }
    if (!this.config.graph.setting) {
      this.config.graph.setting = {};
    }
    if (!this.config.graph.setting[this.config.graph.mode]) {
      switch (this.config.graph.mode) {
        case 'multiBarChart':
          this.config.graph.setting[this.config.graph.mode] = new VisualizationMultiBarChart();
          break;
        case 'stackedAreaChart':
          this.config.graph.setting[this.config.graph.mode] = new VisualizationStackedAreaChart();
          break;
        case 'lineChart':
          this.config.graph.setting[this.config.graph.mode] = new VisualizationLineChart();
          break;
        case 'scatterChart':
          this.config.graph.setting[this.config.graph.mode] = new VisualizationScatterChart();
          break;
        default:
          break;
      }
    }
  }

  onResize($event: ResizeResult) {
    if (this.result.type === DatasetType.TABLE) {
      this.config.graph.height = $event.height;
      this.setGraphConfig();
    }
    this.sizeChange.emit($event);
  }

  ngAfterViewInit(): void {
    this.renderDefaultDisplay();
  }

  ngOnDestroy(): void {
    this.destroyVisualizations();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
