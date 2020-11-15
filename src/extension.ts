'use strict';
import { window, workspace, commands, ExtensionContext, Uri, ViewColumn, WebviewPanel, Webview, Disposable } from 'vscode';
import Sas7bdatPreview from './Sas7bdatPreview'
import { previewManager } from './previewManager';
import Sas7bdatSerializer from './Sas7bdatSerializer';

export function activate(context: ExtensionContext) {

	let sasCommand = commands.registerCommand('sas7bdat.preview', (uri) => {
		let resource = uri;
		let viewColumn = getViewColumn();
		if (!(resource instanceof Uri)) {
			window.showInformationMessage("Use the explorer context menu or editor title menu to preview sas7bdat files.");
			return;
		}
		const sas7bdat = resource.with({
			scheme: 'sas7bdat-preview'
		});

		let preview = previewManager.find(sas7bdat);
		if (preview) {
			preview.reveal();
			return;
		}

		preview = Sas7bdatPreview.create(context, resource, viewColumn);
		return preview.webview;
	});

	context.subscriptions.push(sasCommand);
	window.registerWebviewPanelSerializer("sasviewer-sas7bdat", new Sas7bdatSerializer(context));

	// Reset all previews when the configuration changes
	workspace.onDidChangeConfiguration(() => {
		previewManager.configure();
	});
}

function getViewColumn(): ViewColumn {
	const active = window.activeTextEditor;
	return active ? active.viewColumn! : ViewColumn.One;
}



