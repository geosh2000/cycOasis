import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';

import * as moment from 'moment-timezone';
import * as Globals from '../../../../globals';
import { ApiService, InitService } from 'src/app/services/service.index';
import { ToastrService } from 'ngx-toastr';
import { UploadImageComponent } from 'src/app/components/formularios/upload-image.component';

@Component({
  selector: 'app-edit-monto-parcial',
  templateUrl: './edit-monto-parcial.component.html',
  styleUrls: ['./edit-monto-parcial.component.css']
})
export class EditMontoParcialComponent implements OnInit {

  @Input() i:Object = {}
  @Output() saveMonto = new EventEmitter()
  @Output() uplImg = new EventEmitter()
  @Output() reload = new EventEmitter()

  loading:Object = {}
  hrIndex = Globals.HREF

  constructor(public _api: ApiService,
              public _init: InitService,
              public toastr: ToastrService) { }

  ngOnInit() {
  }

  formatDate( d, f ){
    return moment(d).format(f)
  }

  saveMontoFnc( e ){
    this.saveMonto.emit(e)
  }

}
