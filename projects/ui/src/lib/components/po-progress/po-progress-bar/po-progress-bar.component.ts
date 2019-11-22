import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'po-progress-bar',
  templateUrl: './po-progress-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    '[attr.aria-valuenow]': 'value',
  }
})
export class PoProgressBarComponent {

  @Input('p-indeterminate') indeterminate: boolean;

  @Input('p-value') value: number;

  get valueScale() {
    return `${this.value / 100}`;
  }

}
