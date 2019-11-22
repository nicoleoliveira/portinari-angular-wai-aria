import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { PoModule } from '@portinari/portinari-ui';

import { AppComponent } from './app.component';
// tslint:disable-next-line: max-line-length
import { SamplePoTreeViewFolderStructureComponent } from 'projects/ui/src/lib/components/po-tree-view/samples/sample-po-tree-view-folder-structure/sample-po-tree-view-folder-structure.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent,
    SamplePoTreeViewFolderStructureComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot([]),
    PoModule,
    BrowserAnimationsModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
