import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { MessageService } from 'zeppelin-services';
import { NzModalRef } from 'ng-zorro-antd';

@Component({
  selector: 'zeppelin-note-rename',
  templateUrl: './note-rename.component.html',
  styleUrls: ['./note-rename.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NoteRenameComponent implements OnInit {
  @Input() newName: string;
  @Input() id: string;

  rename() {
    this.messageService.noteRename(this.id, this.newName);
    this.nzModalRef.destroy();
  }

  constructor(private messageService: MessageService, private nzModalRef: NzModalRef) {}

  ngOnInit() {}
}