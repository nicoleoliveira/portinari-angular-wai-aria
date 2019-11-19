/**
 * @usedBy PoDatepickerComponent
 *
 * @description
 *
 * *Enum* para definição de padrão de formatação para a saída do model independentemente do formato de entrada.
 */
export enum PoDatepickerIsoFormat {

  /**  Saída no formato **E8601DAw** (*yyyy-mm-dd*). */
  Basic = 'basic',

  /** Saída no formato **E8601DZw** (*yyyy-mm-ddThh:mm:ss+|-hh:mm*). */
  Extended = 'extended'

}
