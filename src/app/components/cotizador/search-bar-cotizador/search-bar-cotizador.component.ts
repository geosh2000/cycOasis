import { Component, OnInit, Injectable, Output, EventEmitter, Input } from '@angular/core';
import { NgbDateAdapter, NgbDateStruct, NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';

import * as moment from 'moment-timezone';

const equals = ({ one, two }: { one: NgbDateStruct; two: NgbDateStruct; }) => {
  return one && two && two.year == one.year && two.month == one.month && two.day == one.day;
};
const before = (one: NgbDateStruct, two: NgbDateStruct) => {
// tslint:disable-next-line: max-line-length
  return !one || !two ? false : one.year == two.year ? one.month == two.month ? one.day == two.day ? false : one.day < two.day : one.month < two.month : one.year < two.year;
};
const after = (one: NgbDateStruct, two: NgbDateStruct) => {
// tslint:disable-next-line: max-line-length
  return !one || !two ? false : one.year == two.year ? one.month == two.month ? one.day == two.day ? false : one.day > two.day : one.month > two.month : one.year > two.year;
};

@Injectable()
export class NgbDateNativeAdapter extends NgbDateAdapter<any> {

  fromModel(date: string): NgbDateStruct {

    const tmp = new Date(parseInt(moment(date).format('YYYY')), parseInt(moment(date).format('MM')), parseInt(moment(date).format('DD')));

    return (date && tmp.getFullYear) ? {year: tmp.getFullYear(), month: tmp.getMonth(), day: tmp.getDate()} : null;
  }

  toModel(date: NgbDateStruct): string {
    // return date ? new Date(date) : null;
    return date ? moment({year: date.year, month: date.month - 1, day: date.day}).format('YYYY-MM-DD') : null;
  }
}

@Component({
  selector: 'app-search-bar-cotizador',
  templateUrl: './search-bar-cotizador.component.html',
  providers: [NgbDatepickerConfig],
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
    .acc-headers .mat-expansion-panel-header-title,
    .acc-headers .mat-expansion-panel-header-description {
      flex-basis: 0;
    }

    mat-accordion{
      width: 100% !important;
      max-width: 780px
    }

    .mat-radio-button ~ .mat-radio-button {
      margin-left: 16px;
    }

    .acc-headers .mat-expansion-panel-header-description {
      justify-content: space-between;
      align-items: center;
    }

    .mat-l3 {
      background-color: #bb9e11;
      color: white;
    }
    .mat-l4 {
      background-color: #b360bd;
      color: white;
    }

    mat-form-field {
      margin-right: 12px;
    }
    .lineNd {
      border-bottom: 1px solid red;
      -webkit-transform:
          translateY(20px)
          translateX(5px)
          rotate(-26deg);
      position: absolute;
      top: -33px;
      left: -13px;
  }

  ul.uib-datepicker-popup.dropdown-menu.ng-scope { z-index: 1090 !important; }

  .ngb-dp-month {
    pointer-events: none;
    background: aliceblue!important;
  }
  `]
})
export class SearchBarCotizadorComponent implements OnInit {

  @Output() search = new EventEmitter<any>()
  @Input() loading = false
  @Input() local = false
  @Input() group = false
  @Input() isCode = false
  @Input() groupsTfa = []
  @Input() pax = true
  @Input() minDate:NgbDateStruct = {
    day: parseInt(moment().add(1, 'days').format('DD')),
    month: parseInt(moment().add(1, 'days').format('MM')),
    year: parseInt(moment().add(1, 'days').format('YYYY'))
  }

  pickNum:any = []
  adults:any = 1
  min:any = 0
  moneda = true
  minA = []
  selectedCode:any = 'ccenter'

  

  isLocal = false
  isGroup = false

  e3=0
  e2=0
  e1=0

  hoveredDate: NgbDateStruct;
  fromDate: NgbDateStruct;
  toDate: NgbDateStruct;
  inicio: any;
  fin: any;

  constructor() {
    for(let i=0; i<=50; i++){
      this.pickNum.push(i)
    }
  }

  ngOnInit() {
  }

  isToday( date ) {
    if ( moment(date).format('YYYY-MM-DD') == moment().format('YYYY-MM-DD') ) {
      return 'bg-success text-light';
    }
  }

  onDateSelection(date: NgbDateStruct, el ) {
    this.inicio = moment({year: date.year, month: date.month - 1, day: date.day}).format('YYYY-MM-DD');
    jQuery('#picker').val(`${moment({year: date.year, month: date.month - 1, day: date.day}).format('DD/MM/YYYY')}`);
    el.close();
  }

  isHovered = date => this.fromDate && !this.toDate && this.hoveredDate && after(date, this.fromDate) && before(date, this.hoveredDate);
  isInside = date => after(date, this.fromDate) && before(date, this.toDate);
  isFrom = date => equals({ one: date, two: this.fromDate });
  isTo = date => equals({ one: date, two: this.toDate });

  save(){
    let ageSum = []

    for( let i=0; i < this.adults; i++ ){
      ageSum.push({type: 'adult', age: '+18'})
    }

    for( let i=0; i < this.min; i++ ){
      let age = i == 0 ? this.e1 : (i == 1 ? this.e2 : this.e3)
      ageSum.push({type: 'minor', age})
    }

    this.search.emit({
      inicio: this.inicio,
      adults: this.adults,
      min: parseInt(this.min),
      moneda: this.moneda,
      ages: ageSum,
      isLocal: this.isLocal,
      isGroup: this.isGroup,
      selectedCode: this.selectedCode
    })
  }

  reset(){
    this.adults = 1
    this.min = 0
    this.inicio = null
    jQuery('#picker').val('');
    this.e3=0
    this.e2=0
    this.e1=0
  }

  resetAges(){
    this.e3=0
    this.e2=0
    this.e1=0
  }


}