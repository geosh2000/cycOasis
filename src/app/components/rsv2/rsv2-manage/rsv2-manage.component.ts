import { Component, OnInit, AfterViewInit, ViewChild, ViewContainerRef, Input, SimpleChanges, HostListener, ElementRef, OnDestroy, ViewChildren } from '@angular/core';
import { ApiService, InitService, TokenCheckService } from '../../../services/service.index';
import { ToastrService } from 'ngx-toastr';
import { Title } from '@angular/platform-browser';
import { CompleterService, CompleterData } from 'ng2-completer';

import { Router, ActivatedRoute } from '@angular/router';


declare var jQuery: any;
import * as moment from 'moment-timezone';
import * as Globals from '../../../globals';
import { OrderPipe } from 'ngx-order-pipe';
import { DoPaymentComponent } from '../do-payment/do-payment.component';
import { UploadImageComponent } from 'src/app/components/formularios/upload-image.component';
import { ZonaHorariaService } from '../../../services/zona-horaria.service';

@Component({
  selector: 'app-rsv2-manage',
  templateUrl: './rsv2-manage.component.html',
  styleUrls: ['./rsv2-manage.component.css']
})
export class Rsv2ManageComponent implements OnInit {

  @ViewChild(DoPaymentComponent, {static:false}) _payment:DoPaymentComponent
  @ViewChild(UploadImageComponent, {static: false}) _upl:UploadImageComponent

  currentUser: any;
  showContents = false;
  flag = false;
  listFlag = false;
  large = true;
  mainCredential = 'rsv_manage';
  loading:Object = {}
  viewLoc:any
  history:any = []
  mlTicket:any

  data:Object = {
    master: {},
    items: []
  }

  cancelItemData:any = {}
  confirmItemData:any = {}
  comment:any = ''
  confirm:Object = {
    confirm: '',
    notas: ''
  }

  rsvType = 'Cotizacion'

  constructor(public _api: ApiService,
              public _init: InitService,
              private titleService: Title,
              private _tokenCheck: TokenCheckService,
              private route: Router,
              private orderPipe: OrderPipe,
              private _zh:ZonaHorariaService,
              private activatedRoute: ActivatedRoute,
              public toastr: ToastrService) {

      this.currentUser = this._init.getUserInfo();
      this.showContents = this._init.checkCredential( this.mainCredential, true );

      this._tokenCheck.getTokenStatus()
          .subscribe( res => {

            if ( res['status'] ){
              this.showContents = this._init.checkCredential( this.mainCredential, true );
            }else{
              this.showContents = false;
              jQuery('#loginModal').modal('show');
            }
          });

      this.activatedRoute.params.subscribe( params => {
        if( this.showContents ){
          if ( params.loc ){
            this.viewLoc = params.loc;
            this.getLoc( params.loc )
            let title = 'CyC - Rsv Manager'
            if( this.viewLoc ){
              title += ` Loc: ${this.viewLoc}`
            }
            this.titleService.setTitle(title);
            jQuery('div.modal').modal('hide');
          }
        }
      });
  }

  ngOnInit() {
    this.titleService.setTitle('CyC - Rsv Manager');
  }

  getLoc( l ){
    this.loading['loc'] = true

    this._api.restfulGet( l, 'Rsv/manage2Loc' )
                .subscribe( res => {

                  this.loading['loc'] = false;

                  if( res['data']['master'] ){
                    let data = {
                      master: res['data']['master'],
                      items: res['data']['items']
                    }

                    data['master']['tickets'] = data['master']['tickets'] != null ? data['master']['tickets'].split(',') : []

                    this.data = data
                    this.mlTicket = data['master']['mlTicket']
                    this.getHistory(data['master']['mlTicket'])
                    this.rsvTypeCheck()
                  }else{
                    this.data = {
                      master: {},
                      items: []
                    }
                  }




                }, err => {
                  this.loading['loc'] = false;

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  rsvTypeCheck(){
    let x = 0
    let c = 0
    for( let i of this.data['items'] ){
      x++
      if( i['isQuote'] == 0 && i['isCancel'] == 0 ){
        this.rsvType = 'Reserva'
      }
      if( i['isCancel'] == '1' ){
        c++
      }
    }

    if( c == x ){
      this.rsvType = 'Cancelada'
    }
  }

  saveMonto( e ){
    for( let i of this.data['items'] ){
      if( e['itemId'] == i['itemId'] ){
        i['isParcial'] = e['isParcial']
        i['isPagoHotel'] = e['isPagoHotel']
        i['montoParcial'] = e['montoParcial']
        i['tipoPago'] = e['tipoPago']
        i['confirm'] = e['confirm']
        i['isQuote'] = e['isQuote']
        return true
      }
    }
    this.rsvTypeCheck()
    this.getHistory(this.mlTicket)
  }

  selectLoc( e ){
    this.route.navigateByUrl(`/rsv2/${e['masterlocatorid']}`);
  }

  formatDate( d, f, z = false ){
    if( z ){
      return moment.tz(d,this._zh.defaultZone).tz(this._zh.zone).format(f)
    }else{
      return moment(d).format(f)
    }
  }

  isVigente( d ){
    if( moment.tz(d,this._zh.defaultZone).tz(this._zh.zone) > moment() ){
      return true
    }

    return false
  }

  colorConfirm( i, v = true, q = false ){
    if( !v && q){
      return 'text-danger'
    }

    switch( i ){
      case 'Cancelada':
        return 'text-danger'
      case 'Cotización':
      case 'Cotizacion':
        return 'text-warning'
      case 'Pendiente':
        return 'text-info'
      default:
        return 'text-success'
    }
  }

  getDiff( a, b ){
    return parseFloat(a)-parseFloat(b)
  }

  paid( f ){
    if( f ){
      this.getLoc( this.viewLoc )
    }
  }

  getHistory( tkt = this.mlTicket ){
    this.loading['history'] = true

    this._api.restfulGet( tkt, 'Rsv/getHistory' )
                .subscribe( res => {

                  this.loading['history'] = false;

                  this.history = this.orderPipe.transform(res['data'], 'Fecha', true)

                }, err => {
                  this.loading['history'] = false;

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  cancelItem(i){
    this.cancelItemData = i
    jQuery('#cancelConfirm').modal('show')
  }

  confirmItem(i){
    this.confirmItemData = i
    jQuery('#regConfirm').modal('show')
  }

  confirmCancel(){
    if( this.cancelItemData['isQuote'] == 1 ){
      this.sendCancellation()
    }else{
      if(this._init.currentUser.credentials['rsv_cancelAll'] == 1){
        this.sendCancellation( true )
      }else{
        this.toastr.error( 'La reserva ya cuenta con pagos, solicita a tu gerente realizar la cancelación', 'No es podible cancelar' )
      }
    }
  }

  saveConfirm(){
    this.loading['confirm'] = true

    this.confirm['item'] = this.confirmItemData

    this._api.restfulPut( this.confirm, 'Rsv/saveConfirm' )
                .subscribe( res => {

                  this.loading['confirm'] = false;
                  jQuery('#regConfirm').modal('hide')
                  this.getLoc(this.viewLoc)
                  this.confirm = {
                    confirm: '',
                    notas: ''
                  }

                }, err => {
                  this.loading['confirm'] = false;

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  sendCancellation( flag = false ){
    this.loading['cancel'] = true

    this._api.restfulPut( {data: this.cancelItemData, flag}, 'Rsv/cancelItem' )
                .subscribe( res => {

                  this.loading['cancel'] = false;
                  jQuery('#cancelConfirm').modal('hide')
                  this.getLoc(this.viewLoc)

                }, err => {
                  this.loading['cancel'] = false;

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  sendComment(){
    this.loading['comment'] = true

    this._api.restfulPut( {ticket: this.mlTicket, comment: this.comment}, 'Rsv/sendComment' )
                .subscribe( res => {

                  this.loading['comment'] = false;
                  this.comment = ''
                  this.getHistory(this.mlTicket)

                }, err => {
                  this.loading['comment'] = false;

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  uplImg(i){
    this._upl.build('Voucher '+ i['itemLocatorId'], i['itemLocatorId'], 'voucher_'+i['itemLocatorId'], true, 'voucher')
  }

  imgLoaded( e ){
    if( !e.ERR ){
      this.toastr.success(e.msg, 'Cargado')
      this.getHistory()
    }else{
      this.toastr.error(e.msg, 'ERROR!')
    }
  }

}
