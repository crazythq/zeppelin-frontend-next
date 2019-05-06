import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { NZ_I18N, en_US } from 'ng-zorro-antd';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { BaseUrlService, TicketService } from 'zeppelin-services';
import { AppInterceptor } from './app.interceptor';
import { AppInitializer } from './app.initializer';
import { ShareModule } from 'zeppelin-share/share.module';
import { AppRoutingModule } from './app-routing.module';

registerLocaleData(en);

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, FormsModule, HttpClientModule, BrowserAnimationsModule, ShareModule, AppRoutingModule],
  providers: [
    {
      provide: NZ_I18N,
      useValue: en_US
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AppInterceptor,
      multi: true,
      deps: [TicketService]
    },
    {
      provide: APP_INITIALIZER,
      useFactory: AppInitializer,
      deps: [HttpClient, BaseUrlService, TicketService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
