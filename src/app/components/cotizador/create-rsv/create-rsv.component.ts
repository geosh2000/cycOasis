import { Component, OnInit, ViewChild, Output, EventEmitter, Input } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiService, InitService, TokenCheckService } from '../../../services/service.index';
import { ToastrService } from 'ngx-toastr';
import { SearchZdUserComponent } from '../../../shared/search-zd-user/search-zd-user.component';
import { NgbDateAdapter, NgbDateStruct, NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';

declare var jQuery: any;
import * as moment from 'moment-timezone';

@Component({
  selector: 'app-create-rsv',
  templateUrl: './create-rsv.component.html',
  styles: [`
  .exp-height {
    height: auto !important;
    padding: 6px !important;
  }
  .custom-day {
    text-align: center;
    padding: 0.185rem 0.25rem;
    display: inline-block;
    height: 2rem;
    width: 2rem;
  }
  .custom-day.focused {
    background-color: #e6e6e6;
  }
  .custom-day.range, .custom-day:hover {
    background-color: rgb(2, 117, 216);
    color: white;
  }
  .custom-day.faded {
    background-color: rgba(2, 117, 216, 0.5);
  }
  `]
})
export class CreateRsvComponent implements OnInit {

  @ViewChild(SearchZdUserComponent) private zdSearch: SearchZdUserComponent
  // tslint:disable-next-line: no-output-native
  @Output() error = new EventEmitter<any>()
  @Output() save = new EventEmitter<any>()

  moneda = true
  tipo = 'hotel'
  data:Object = {}
  loading:Object = {}
  isNew = true
  searchUserFlag = true
  newRsvForm:FormGroup
  masterLoc:any
  total = 0
  all:any

  fechaSalida:any

  minDate:NgbDateStruct = {
    day: parseInt(moment().add(1, 'days').format('DD')),
    month: parseInt(moment().add(1, 'days').format('MM')),
    year: parseInt(moment().add(1, 'days').format('YYYY'))
  }

  constructor(public _api: ApiService,
              public _init: InitService,
              private _tokenCheck: TokenCheckService,
              public toastr: ToastrService) {

    this.newRsvForm =  new FormGroup({
      ['nombreCliente']:    new FormControl('', [ Validators.required, Validators.pattern('^[A-ZÁÉÍÓÚ]{1}[a-záéíóúA-ZÁÉÍÓÚ\\s]*$')]),
      ['correoCliente']:   new FormControl('', [ Validators.required, Validators.pattern('^(.)+@(.)+\\.(.)+$')]),
      ['telCliente']:   new FormControl('', []),
      ['zdUserId']:   new FormControl('', [ Validators.required, Validators.pattern('^\\d+$')]),
      ['userCreated']:   new FormControl(this._init.currentUser['hcInfo']['id'], [ Validators.required, Validators.pattern('^\\d+$')])
    })

   }

  ngOnInit() {
  }

  selectedUser( e ){
    this.newRsvForm.reset()
    this.masterLoc = null
    this.newRsvForm.controls['userCreated'].setValue(this._init.currentUser['hcInfo']['id'])


    if( !this.isNew ){
      this.masterLoc = e['masterlocatorid']
      this.newRsvForm.controls['nombreCliente'].setValue(e['nombreCliente'])
      this.newRsvForm.controls['correoCliente'].setValue(e['correoCliente'])
      this.newRsvForm.controls['telCliente'].setValue(e['telCliente'])
      this.newRsvForm.controls['zdUserId'].setValue(e['zdUserId'])
    }else{
      this.newRsvForm.controls['nombreCliente'].setValue(e['name'])
      this.newRsvForm.controls['correoCliente'].setValue(e['email'])
      this.newRsvForm.controls['telCliente'].setValue(e['phone'])
      this.newRsvForm.controls['zdUserId'].setValue(e['id'])
    }
    this.searchUserFlag = false

  }

  chgUser(){
    this.newRsvForm.reset()
    this.searchUserFlag = true
  }

  saveRsv(){
    let arr = {
      master: this.newRsvForm.value,
      item: this.data,
      habs: [],
      type: this.tipo,
      moneda: this.moneda
    }

    if( !this.isNew ){
      arr['masterLoc'] = this.masterLoc
    }

    if( this.tipo == 'hotel' ){
      for( let h of arr['item']['habs'] ){
        if( !h['fdp'] ){
          this.error.emit('Debes elegir una forma de pago para cada habitación')
          return
        }

        let hab = {
            hotel: {
              hotel: h['hotel'],
              categoria: h['cat'],
              mdo: h['mayorista'],
              agencia: this.moneda ? h['agenciaMX'] : h['agenciaUS'],
              gpoTfa: this.moneda ? h['cieloMXN'] : h['cieloUSD'],
              gpoCC: h['grupoCielo'],
              titular: this.newRsvForm.controls['nombreCliente'].value,
              adultos: h['rateAdults'],
              juniors: parseInt(h['rateMinors']) > 2 ? 1 : 0,
              menores: parseInt(h['rateMinors']) > 2 ? 2 : h['rateMinors'],
              inicio: h['@inicio'],
              fin: h['@fin'],
              noches: h['noches'],
              isNR: h['isNR'],
              isLocal: h['grupo'] == 'CCQROO' ? 1 : 0,
            },
            monto: {
              montoOriginal: this.moneda ? h['MXN'] : h['USD'],
              lv: this.data['lSelected'],
              monto: Math.round((this.moneda ? h['l' + this.data['lSelected'] + 'MXN_total'] : h['l' + this.data['lSelected'] + 'USD_total']) * 100) / 100,
              moneda: this.moneda ? 'MXN' : 'USD',
              isPagoHotel: h['fdp']
            },
            item: {
              itemType: 1,
              isQuote: h['fdp'] == 1 ? 0 : 1,
              userCreated: this._init.currentUser.hcInfo.id
            }
        }

        arr['habs'].push(hab)
      }
    }

    // console.log(arr)
    this.saveRsvPut( arr )
  }

  saveRsvPut( a ){
    this.loading['save'] = true;

    this._api.restfulPut( a, 'Rsv/saveRsv' )
                .subscribe( res => {

                  this.loading['save'] = false;
                  // this.toastr.success( 'Reserva creada', res['data']['masterlocator'] )
                  this.save.emit(res['data'])
                  this.chgUser()

                  jQuery('#rsvPop').modal('hide')
                  this.save.emit(res['data'])

                }, err => {
                  this.loading['save'] = false;

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  popReserve( h ){
    let minDate:NgbDateStruct = {
      day: parseInt(moment(h['fecha']).format('DD')),
      month: parseInt(moment(h['fecha']).format('MM')),
      year: parseInt(moment(h['fecha']).format('YYYY'))
    }
    this.minDate = minDate
    console.log(h)

    if( h['tipo'] == 'tour' ){
      h['data']['menores'] = 0
      h['data']['adultos'] = 1
      h['data']['totalMXN'] = Math.round(parseFloat(h['data']['adultUSD'])* parseFloat(h['data']['tc']) * 100) / 100
      h['data']['totalUSD'] = parseFloat(h['data']['adultUSD'])
    }

    if( h['tipo'] == 'concert' ){
      h['data']['menores'] = 0
      h['data']['adultos'] = 1
      h['data']['totalMXN'] = parseFloat(h['data']['adultMXN'])
      h['data']['totalUSD'] = parseFloat(h['data']['adultUSD'])
    }

    this.all = h
    this.data = h['data']
    this.moneda = h['moneda']
    this.tipo = h['tipo']
    jQuery('#rsvPop').modal('show')
  }

  printDate(d,f){
    return moment(d).format(f)
  }

  isToday( date ) {
    if ( moment(date).format('YYYY-MM-DD') == moment().format('YYYY-MM-DD') ) {
      return 'bg-success text-light';
    }
  }

  onDateSelection(date: NgbDateStruct, el ) {
    this.data['fechaSalida'] = moment({year: date.year, month: date.month - 1, day: date.day}).format('YYYY-MM-DD');
    jQuery('#picker').val(`${moment({year: date.year, month: date.month - 1, day: date.day}).format('DD/MM/YYYY')}`);
    el.close();
  }

  calcTotal( e, f ){
    let a = f == 'adult' ? parseInt(e.target.value) : this.data['adultos']
    let m = f == 'menor' ? parseInt(e.target.value) : this.data['menores']

    if( this.data['menorUSD'] == null){
      this.data['totalUSD'] = Math.round(((parseFloat(this.data['adultUSD']) * a)) * 100) / 100
    }else{
      this.data['totalUSD'] = Math.round(((parseFloat(this.data['adultUSD']) * a) + (parseFloat(this.data['menorUSD']) * m)) * 100) / 100
    }

    if( this.tipo == 'concert' ){
      if( this.data['menorMXN'] == null){
        this.data['totalMXN'] = Math.round(((parseFloat(this.data['adultMXN']) * a)) * 100) / 100
      }else{
        this.data['totalMXN'] = Math.round(((parseFloat(this.data['adultMXN']) * a) + (parseFloat(this.data['menorMXN']) * m)) * 100) / 100
      }
    }else{
      this.data['totalMXN'] = Math.round(this.data['totalUSD'] * this.data['tc'] * 100) / 100
    }

  }

  validateRsv(){
    if( this.tipo == 'xfer' ){
      if( !this.data['hotel'] || (this.data['hotel'] && this.data['hotel'] == '') ){
        return false
      }
      if( !this.data['horaLlegada'] || (this.data['horaLlegada'] && this.data['horaLlegada'] == '') ){
        return false
      }
      if( !this.data['vueloLlegada'] || (this.data['vueloLlegada'] && this.data['vueloLlegada'] == '') ){
        return false
      }
      if( !this.data['alLlegada'] || (this.data['alLlegada'] && this.data['alLlegada'] == '') ){
        return false
      }

      if( this.data['xferType'] == 'round' ){
        if( !this.data['horaSalida'] || (this.data['horaSalida'] && this.data['horaSalida'] == '') ){
          return false
        }
        if( !this.data['vueloSalida'] || (this.data['vueloSalida'] && this.data['vueloSalida'] == '') ){
          return false
        }
        if( !this.data['alSalida'] || (this.data['alSalida'] && this.data['alSalida'] == '') ){
          return false
        }
        if( !this.data['fechaSalida'] || (this.data['fechaSalida'] && this.data['fechaSalida'] == '') ){
          return false
        }
      }
    }

    if( this.tipo == 'tour' || this.tipo == 'auto' ){
      if( !this.data['pickup'] || (this.data['pickup'] && this.data['pickup'] == '') ){
        return false
      }
    }
    return true
  }

  formatSalida( t ){
    let h = Math.floor(t)
    let m = Math.round(t % h * 100)

    // return moment(`${h}:${m}:00`).format('HH:mm')
    return `${h}:${m < 10 ? '0' + m : m}`
  }

}
