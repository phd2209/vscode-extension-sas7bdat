'use strict';
import { WebviewPanel, WebviewPanelSerializer, ExtensionContext, Uri } from 'vscode';
import Sas7bdatPreview from './Sas7bdatPreview';

export default class ExcelSerializer implements WebviewPanelSerializer {

	private _context: ExtensionContext;

	constructor(context: ExtensionContext) {
		this._context = context;
	}

	public async deserializeWebviewPanel(webviewPanel: WebviewPanel, state: any) {
		Sas7bdatPreview.revive(this._context, Uri.parse(state.uri), webviewPanel);
	}
}