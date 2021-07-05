import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddWatermarkComponent } from './components/add-watermark/add-watermark.component';
import { HomeComponent } from './components/home/home.component';

const routes: Routes = [
  { path: 'image/:id', component: AddWatermarkComponent },
  { path: '**', component: HomeComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
