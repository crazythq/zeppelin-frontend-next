import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MessageService, TicketService } from 'zeppelin-services';
import { MessageListener, MessageListenersManager } from 'zeppelin-core';
import { MessageReceiveDataTypeMap, OP } from 'zeppelin-sdk';

@Component({
  selector: 'zeppelin-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent extends MessageListenersManager implements OnInit {
  loading = true;

  reloadNoteList() {
    this.messageService.reloadAllNotesFromRepo();
    this.loading = true;
  }

  @MessageListener(OP.NOTES_INFO)
  getNotes(data: MessageReceiveDataTypeMap[OP.NOTES_INFO]) {
    this.loading = false;
    this.cdr.markForCheck();
  }

  constructor(
    public ticketService: TicketService,
    public messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    super(messageService);
  }

  ngOnInit() {
    this.messageService.listNodes();
  }
}
