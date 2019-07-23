import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { OrderPipe } from 'ngx-order-pipe';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-search-payment',
  templateUrl: './search-payment.component.html',
  styles: [`
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

  .mat-radio-button ~ .mat-radio-button {
    margin-left: 16px;
  }
  .mat-success {
    background-color: #33a933;
    color: #fff;
  }
  .mat-alert {
    background-color: #e2be0c;
    color: #fff;
  }
  .mat-info {
    background-color: #34a3b5;
    color: #fff;
  }
  .mat-pdt {
    background-color: #72658c;
    color: #fff;
  }
  .mat-danger {
    background-color: #e00f0f;
    color: #fff;
  }

  mat-accordion{
    width: 100% !important;
    max-width: 780px
  }

  .acc-headers .mat-expansion-panel-header-description {
    justify-content: space-between;
    align-items: center;
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
.form-group {
  margin-bottom: -10px;
}
`]
})
export class SearchPaymentComponent implements OnInit {

  @Output() selected = new EventEmitter
  @Input() maxHeight:any = 900


  mail:any
  loading:Object = {
  }
  data:any = []
  noResults:boolean = false

  constructor(public _api: ApiService,
                private orderPipe: OrderPipe,
                public toastr: ToastrService) { 
                }

  ngOnInit() {
  }

  search(){
    
    this.selected.emit([null,false])
    this.loading['search'] = true;
    this.noResults = false


    this._api.restfulPut( {val: this.mail}, 'Rsv/searchPaymentsToLink' )
                .subscribe( res => {

                  this.loading['search'] = false;
                  let result = res['data']
                  result = this.orderPipe.transform(result, 'masterItemLocator')

                  this.data = result
                  if( this.data.length == 0 ){
                    this.noResults = true
                  }

                }, err => {
                  this.loading['search'] = false;

                  const error = err.error;
                  this.toastr.error( error.msg, err.status );
                  console.error(err.statusText, error.msg);

                });
  }

  select( i ){
    this.selected.emit( [i, true] )
    this.mail = ''
    this.data= []
  }


}
