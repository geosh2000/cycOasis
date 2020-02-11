import { Component, OnInit } from '@angular/core';
import { ApiService, InitService, TokenCheckService, ZonaHorariaService } from 'src/app/services/service.index';
import { Title } from '@angular/platform-browser';
import { OrderPipe } from 'ngx-order-pipe';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

declare var jQuery: any;
import * as moment from 'moment-timezone';
import * as Globals from '../../globals';

@Component({
  selector: 'app-tarifario',
  templateUrl: './tarifario.component.html',
  styleUrls: ['./tarifario.component.css']
})
export class TarifarioComponent implements OnInit {

  currentUser: any;
  showContents = false;
  mainCredential = 'rsv_rateManager';

  loading:Object = {}

  constructor(public _api: ApiService,
              public _init: InitService,
              private titleService: Title,
              private _tokenCheck: TokenCheckService,
              private orderPipe: OrderPipe,
              private _zh:ZonaHorariaService,
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

  }

  ngOnInit() {
    this.titleService.setTitle('CyC - Rates Manager');
  }

}
