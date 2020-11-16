'use strict';
import { window, workspace, commands, ExtensionContext, Uri, ViewColumn, WebviewPanel, Webview, Disposable } from 'vscode';
import BasePreview from './basePreview';

export default class Sas7bdatPreview extends BasePreview {

	static create(context: ExtensionContext, uri: Uri, viewColumn: ViewColumn): Sas7bdatPreview {
		let preview = new Sas7bdatPreview(context, uri, "sas7bdat-preview");
		preview.initWebviewPanel(viewColumn);
		preview.handleEvents();
		return preview;
	}

	static revive(context: ExtensionContext, uri: Uri, webviewPanel: WebviewPanel): Sas7bdatPreview {
		let preview = new Sas7bdatPreview(context, uri, "sas7bdat-preview");
		preview.attachWebviewPanel(webviewPanel);
		preview.handleEvents();
		return preview;
	}

	public async getOptions(): Promise<any> {

		const file = this.psUri.fsPath + "/ReadSasDataset.ps1";

		let ps1command = "& {&'" + file + "' '" + this.uri.fsPath + "'}";
		let rowData: any = [];

		if (ps1command.includes(".sas7bdat")) {

			const { spawn } = require('child_process');
			const ps1 = spawn('powershell.exe', ["-command ", ps1command]);
			let dataset: string = "";
			for await (const data of ps1.stdout) {
				dataset = dataset + data.toString();
				this.saveState(dataset)

				let self = this;

				let options = {
					uri: this.uri.toString(),
					previewUri: this.previewUri.toString(),
					state: this.state
				}

				self.webview.postMessage({
					refresh: true,
					content: options
				})
				//}
			};

			ps1.stderr.on('data', (data: any) => {
				console.error(data.toString());
			});

			ps1.on('exit', (code: any) => {
				console.log(`Child exited with code ${code}`);
				ps1.exit()
			});
		}
	}

	async refresh(): Promise<void> {
		await this.getOptions()
	}

	getHtml(ignoreState: boolean = false): string {

		const nonce = getNonce();

		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<link href="${this.webMediaUri}/reset.css" rel="stylesheet">
			<link href="${this.webMediaUri}/ag-grid.min.css" rel="stylesheet">
			<link href="${this.webMediaUri}/ag-theme-alpine.min.css" rel="stylesheet">
			<link href="${this.webMediaUri}/ag-theme-alpine-dark.min.css" rel="stylesheet">
			<script src="${this.webMediaUri}/sas7bdat.js"></script>
			<title>Sas7bat preview</title>
		</head>
		<body style="padding:0px; overflow:hidden" onload="resizeSheet()" onresize="resizeSheet()">

			<div id="myGrid">
			</div>

			<script nonce="${nonce}" src="${this.webMediaUri}/ag-grid-community.min.noStyle.js"></script>
			
			<script type="text/javascript">			
            	function ignoreState() {
                	return ${ignoreState};
            	}			
            	function getOptions() {
                	return ${JSON.stringify(this.getOptions())};
            	}
            	initPage();
			</script>
			
		</body>
		</html>`;
	}

	get viewType(): string {
		return "sasviewer-sas7bdat";
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
