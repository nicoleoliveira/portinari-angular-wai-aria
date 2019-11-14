import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';

import { isFirefox, isIE, isIEOrEdge, openExternalLink } from './../../../../utils/util';
import { PoKeyCodeEnum } from './../../../../enums/po-key-code.enum';

const poRichTextBodyCommands = [
  'bold', 'italic', 'underline', 'justifyleft', 'justifycenter', 'justifyright', 'justifyfull', 'insertUnorderedList', 'Createlink'
];

@Component({
  selector: 'po-rich-text-body',
  templateUrl: './po-rich-text-body.component.html'
})
export class PoRichTextBodyComponent implements OnInit {

  private linkElement: any;
  private timeoutChange: any;
  private valueBeforeChange: any;

  @ViewChild('bodyElement', { static: true }) bodyElement: ElementRef;

  @Input('p-height') height?: string;

  @Input('p-model-value') modelValue?: string;

  @Input('p-placeholder') placeholder?: string;

  @Input('p-readonly') readonly?: string;

  @Output('p-change') change = new EventEmitter<any>();

  @Output('p-commands') commands = new EventEmitter<any>();

  @Output('p-shortcut-command') shortcutCommand = new EventEmitter<any>();

  @Output('p-selected-link') selectedLink = new EventEmitter<any>();

  @Output('p-value') value = new EventEmitter<any>();

  ngOnInit() {
    this.bodyElement.nativeElement.designMode = 'on';

    // timeout necessário para setar o valor vindo do writeValue do componente principal.
    setTimeout(() => this.updateValueWithModelValue());
  }

  executeCommand(command: (string | { command: any, value: string | any })) {
    this.bodyElement.nativeElement.focus();

    if (typeof (command) === 'object') {

      if (command.command === 'InsertHTML') {
        const { command: linkCommand, value : { urlLink }, value : { urlLinkText} } = command;

        this.handleCommandLink(linkCommand, urlLink, urlLinkText);
      } else {
        document.execCommand(command.command, false, command.value);
      }
    } else {
      document.execCommand(command, false, null);
    }

    this.updateModel();
    this.value.emit(this.modelValue);
  }

  onBlur() {
    if (this.modelValue !== this.valueBeforeChange) {
      clearTimeout(this.timeoutChange);
      this.timeoutChange = setTimeout(() => {
        this.change.emit(this.modelValue);
      }, 200);
    }
  }

  focus(): void {
    this.bodyElement.nativeElement.focus();
  }

  onClick() {
    this.emitSelectionCommands();
  }

  onFocus() {
    this.valueBeforeChange = this.modelValue;
  }

  onKeyDown(event) {
    const keyL = event.keyCode === PoKeyCodeEnum.keyL;
    const isLinkShortcut = keyL && event.ctrlKey || keyL && event.metaKey;

    if (isLinkShortcut) {
      event.preventDefault();
      this.shortcutCommand.emit();
    }

    this.toggleCursorOnLink(event, 'add');
  }

  onKeyUp(event: any) {
    this.toggleCursorOnLink(event, 'remove');

    this.removeBrElement();
    this.updateModel();
    this.emitSelectionCommands();
  }

  onPaste() {
    this.addClickListenerOnAnchorElements();
    this.update();
  }

  update() {
    setTimeout(() => this.updateModel());

    setTimeout(() => {
      this.removeBrElement();
      this.updateModel();
      this.emitSelectionCommands();
    });
  }

  private addClickListenerOnAnchorElements() {
    this.bodyElement.nativeElement.querySelectorAll('a').forEach(element => {

      element.addEventListener('click', this.onAnchorClick);
    });
  }

  private emitSelectionCommands() {
    const commands = poRichTextBodyCommands.filter(command => document.queryCommandState(command));
    const rgbColor = document.queryCommandValue('ForeColor');

    let hexColor;
    if (!isIE()) {
      hexColor = this.rgbToHex(rgbColor);
    }

    if (this.isCursorPositionedInALink()) {
      commands.push('Createlink');
    }
    this.selectedLink.emit(this.linkElement); // importante ficar fora do if para emitir mesmo undefined.

    this.commands.emit({commands, hexColor});
  }

  private handleCommandLink(linkCommand: string, urlLink: string, urlLinkText: string) {
    if (isIE()) {
      this.insertHtmlLinkElement(urlLink, urlLinkText);
    } else {
      // '&nbsp;' necessário para o cursor não ficar preso dentro do link no Firefox.
      const linkValue = isFirefox() ?
      `&nbsp;<a class="po-rich-text-link" href="${urlLink}" target="_blank">${urlLinkText || urlLink}</a>&nbsp;` :
      `<a class="po-rich-text-link" href="${urlLink}" target="_blank">${urlLinkText || urlLink}</a>`;

      document.execCommand(linkCommand, false, linkValue);
    }

    this.addClickListenerOnAnchorElements();
  }

  // tratamento específico para IE pois não suporta o comando 'insertHTML'.
  private insertHtmlLinkElement(urlLink: string, urlLinkText: string) {
    const selection = document.getSelection();
    const selectionRange = selection.getRangeAt(0);
    const elementLink = document.createElement('a');
    const elementlinkText = document.createTextNode(urlLinkText);

    elementLink.appendChild(elementlinkText);
    elementLink.href = urlLink;
    elementLink.setAttribute('target', '_blank');
    elementLink.classList.add('po-rich-text-link');

    selectionRange.deleteContents();
    selectionRange.insertNode(elementLink);
  }

  private isCursorPositionedInALink(): boolean {
    const textSelection = document.getSelection();
    const parent = textSelection.focusNode.parentElement;

    this.linkElement = undefined;

    let isLink = false;

    if (parent && parent.tagName === 'A') {
      this.linkElement = parent;
      isLink = true;

    } else if (isFirefox() || isIEOrEdge()) {
      isLink = this.verifyCursorPositionInFirefoxIEEdge(textSelection);

    } else {
      isLink = this.isParentNodeAnchor(textSelection);
    }

    return isLink;
  }

  private isParentNodeAnchor(textSelection): boolean {

    if (textSelection) {
      let isLink = false;
      let parentElementHTML = textSelection.focusNode.parentElement;

      while (parentElementHTML && parentElementHTML.tagName !== null) {
        if (parentElementHTML.tagName === 'A') {
          this.linkElement = parentElementHTML;
          isLink = true;
          return isLink;
        }
        parentElementHTML = parentElementHTML.parentElement;
      }

      this.linkElement = undefined;
      return isLink;
    }
  }

  private onAnchorClick = event => {
    const { target, ctrlKey, metaKey } = event;

    if (ctrlKey || metaKey) {
      const url = target.attributes.href.value;

      openExternalLink(url);
      target.classList.remove('po-clickable');
    }
  }

  // Tratamento necessário para eliminar a tag <br> criada no firefox quando o body for limpo.
  private removeBrElement() {
    const bodyElement = this.bodyElement.nativeElement;

    if (!bodyElement.innerText.trim() && bodyElement.childNodes.length === 1 && bodyElement.querySelector('br')) {
      bodyElement.querySelector('br').remove();
    }
  }

  private rgbToHex(rgb) {
    // Tratamento necessário para converter o código rgb para hexadecimal.
    const sep = rgb.indexOf(',') > -1 ? ',' : ' ';
    rgb = rgb.substr(4).split(')')[0].split(sep);

    let r = (+rgb[0]).toString(16);
    let g = (+rgb[1]).toString(16);
    let b = (+rgb[2]).toString(16);

    if (r.length === 1) {
      r = '0' + r;
    }
    if (g.length === 1) {
      g = '0' + g;
    }
    if (b.length === 1) {
      b = '0' + b;
    }

    return '#' + r + g + b;
  }

  private searchForALinkInDOM(textLink: any) {
    return Array.from(this.bodyElement.nativeElement.querySelectorAll('a')).some(element => {
      if (element['innerText'] && element['innerText'] === textLink) {
        this.linkElement = element;
        return true;
      }
    });
  }

  private toggleCursorOnLink(event: any, action: 'add' | 'remove') {
    const element = document.getSelection().focusNode.parentNode;
    const isCtrl = event.ctrlKey || event.key === 'Control';
    const isCommand = event.metaKey;
    const isOnCtrlLink = this.isCursorPositionedInALink() && (isCtrl || isCommand);

    if (isOnCtrlLink) {
      element['classList'][action]('po-clickable');

    } else {
      element['classList'].remove('po-clickable');
    }

    this.updateModel();

  }

  private updateModel() {
    this.modelValue = this.bodyElement.nativeElement.innerHTML;

    this.value.emit(this.modelValue);
  }

  private updateValueWithModelValue() {
    if (this.modelValue) {
      this.bodyElement.nativeElement.insertAdjacentHTML('afterbegin', this.modelValue);
    }
  }

  private verifyCursorPositionInFirefoxIEEdge(textSelection): boolean {
    const firstChild = textSelection.anchorNode.childNodes[0];
    let isLink = false;

    if (firstChild && firstChild.nodeName === 'A') {
      this.linkElement = firstChild;
      isLink = true;

    } else {
      const textLink = textSelection.toString() || textSelection.anchorNode.data;

      isLink = !!textLink && this.searchForALinkInDOM(textLink);
    }

    return isLink;
  }

}
