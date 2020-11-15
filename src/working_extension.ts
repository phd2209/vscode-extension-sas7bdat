'use strict';
import { window, workspace, commands, ExtensionContext, Uri, ViewColumn, WebviewPanel, Webview, Disposable } from 'vscode';
//import * as ADODB from 'node-adodb'
//import * as edge from 'edge-js'
//import Sas7bdatPreview from './Sas7bdatPreview'
//import { previewManager } from './previewManager';
//import * as exec from 'child_process'

export function activate(context: ExtensionContext) {

	// Excel: Open Preview
	context.subscriptions.push(
		commands.registerCommand('sas7bdat.preview', (uri: Uri) => {
			let resource = uri;
			//let viewColumn = getViewColumn();

			if (!(resource instanceof Uri)) {
				window.showInformationMessage("Use the explorer context menu or editor title menu to preview Sas datasets.");
				return;
			}

			Sas7bdatPreview.createOrShow(uri)
		})
	);

	if (window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		window.registerWebviewPanelSerializer(Sas7bdatPreview.viewType, {
			async deserializeWebviewPanel(webviewPanel: WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				Sas7bdatPreview.revive(webviewPanel, context.extensionUri);
			}
		});
	}
}

/**
 * Manages cat coding webview panels
 */
class Sas7bdatPreview {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: Sas7bdatPreview | undefined;

	public static readonly viewType = 'sas7bdat';

	private readonly _panel: WebviewPanel;
	private readonly _extensionUri: Uri;
	private _disposables: Disposable[] = [];

	public static createOrShow(extensionUri: Uri) {
		const column = window.activeTextEditor
			? window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (Sas7bdatPreview.currentPanel) {
			Sas7bdatPreview.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = window.createWebviewPanel(
			Sas7bdatPreview.viewType,
			'Sas dataset viewer',
			column || ViewColumn.One,
			{
				// Enable javascript in the webview
				enableScripts: true,

				// And restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [Uri.joinPath(extensionUri, 'media')]
			}
		);

		Sas7bdatPreview.currentPanel = new Sas7bdatPreview(panel, extensionUri);
	}

	public static revive(panel: WebviewPanel, extensionUri: Uri) {
		Sas7bdatPreview.currentPanel = new Sas7bdatPreview(panel, extensionUri);
	}

	private constructor(panel: WebviewPanel, extensionUri: Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		const libraryPath = extensionUri.fsPath.substring(0, extensionUri.fsPath.lastIndexOf("\\"));

		//this works
		//"./ReadSasDataset.ps1 "c:\SAS Files\SAS Prograns\Pilot\dm.sas7bdat" | Out-GridView"
		//powershell -command "& {&'C:\Experimental projects\Sas-dataset-viewer\ps\ReadSasDataset.ps1' 'c:\SAS Files\SAS Prograns\Pilot\dm.sas7bdat' | Out-GridView}"


		//var dataset = this._extensionUri.fsPath.replace(/^.*[\\\/]/, '').split(".")[0]
		//const scriptPathOnDisk = Uri.joinPath(this._extensionUri, 'ps', 'ReadSasDataset.ps1');
		const file = "C:\\Experimental projects\\Sas-dataset-viewer\\ps\\ReadSasDataset.ps1";
		//let ps1command = '"' + file + '" "' + this._extensionUri.fsPath + ' " | Out-GridView'
		let ps1command = '"' + file + '" "' + this._extensionUri.fsPath + '"'
		//ReadSasDataset.ps1 c:\Data\sample.sas7bdat | Out-GridView		
		let jsonArray: string[] = [];
		if (ps1command.includes(".sas7bdat")) {
			const { spawn } = require('child_process');

			//const ps1 = spawn('powershell.exe', ["-command ", "& {&'C:\\Experimental projects\\Sas-dataset-viewer\\ps\\ReadSasDataset.ps1' 'c:\\SAS Files\\SAS Prograns\\Pilot\\dm.sas7bdat' | Out-GridView}"]);

			const ps1 = spawn('powershell.exe', ["-command ", "& {&'C:\\Experimental projects\\Sas-dataset-viewer\\ps\\ReadSasDataset.ps1' 'c:\\SAS Files\\SAS Prograns\\Pilot\\dm.sas7bdat'}"]);

			ps1.stdout.on('data', (data: any) => {
				//console.log(data)
				jsonArray.push(data.toString())
				console.log(data.toString());
			});

			ps1.stderr.on('data', (data: any) => {
				console.error(data.toString());
			});

			ps1.on('exit', (code: any) => {
				console.log(`Child exited with code ${code}`);
			});
		}

		console.log(jsonArray)

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this._panel.webview.postMessage({ command: 'refactor' });
	}

	public dispose() {
		Sas7bdatPreview.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update() {
		const webview = this._panel.webview;
		this._updateForCat(webview);
		return;
	}

	private _updateForCat(webview: Webview) {
		this._panel.title = 'Sas dataset viewer';
		this._panel.webview.html = this._getHtmlForWebview(webview, "Hello World");
	}

	private _getHtmlForWebview(webview: Webview, sasDataset: string) {
		// Local path to main script run in the webview
		const scriptPathOnDisk = Uri.joinPath(this._extensionUri, 'media', 'main.js');

		// And the uri we use to load this script in the webview
		const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

		// Local path to css styles
		const styleResetPath = Uri.joinPath(this._extensionUri, 'media', 'reset.css');
		const stylesPathMainPath = Uri.joinPath(this._extensionUri, 'media', 'vscode.css');

		// Uri to load styles into webview
		const stylesResetUri = webview.asWebviewUri(styleResetPath);
		const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);

		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">

				<title>Cat Coding</title>
			</head>
			<body>
				<h1 id="lines-of-code-counter">0</h1>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

