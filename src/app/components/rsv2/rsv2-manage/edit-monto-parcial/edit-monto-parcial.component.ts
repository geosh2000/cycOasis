import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';

import * as moment from 'moment-timezone';
import * as Globals from '../../../../globals';
import { ApiService } from 'src/app/services/service.index';
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

  editFlag = false
  loading:Object = {}
  hrIndex = Globals.HREF
  sfFlag = false

  constructor(public _api: ApiService,
              public toastr: ToastrService) { }

  ngOnInit() {
  }

  formatDate( d, f ){
    return moment(d).format(f)
  }

  editMonto( m ){

    if( this.i['isNR'] == '1' ){
      this.toastr.error('No es posible modificar el monto a prepagar de una reserva "No Reembolsable". El prepago debe hacerse al 100%', 'ERROR!')
      return false
    }

    if( this.i['itemType'] != '1' ){
      this.toastr.error('Este servicio no permite realizar un pago parcial. El prepago debe hacerse al 100%', 'ERROR!')
      return false
    }

    let params = {
      original: this.i,
      new: {
        montoParcial: m.value
      },
      itemId: this.i['itemId']
    }

    this.saveMontos( params )
  }

  saveMontos( e ){
    this.loading['editMonto'] = true

    this._api.restfulPut( e, 'Rsv/editMontoParcial' )
                .subscribe( res => {

                  this.loading['editMonto'] = false;
                  this.i['montoParcial'] = e['new']['montoParcial']
                  this.saveMonto.emit( res['data'] )
                  this.editFlag = false

                }, err => {
                  this.loading['editMonto'] = false;

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  setFree(i, v){
    this.loading['editMonto'] = true

    this._api.restfulPut( {item: i, relates: v.value}, 'Rsv/setFree' )
                .subscribe( res => {

                  this.loading['editMonto'] = false;
                  this.i['isFree'] = 1
                  this.i['isQuote'] = 0
                  this.i['montoPagado'] = this.i['monto']
                  this.saveMonto.emit( res['data'] )
                  this.editFlag = false
                  this.sfFlag = false

                }, err => {
                  this.loading['editMonto'] = false;

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }


}
