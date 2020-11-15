'use strict';
import { window, workspace, commands, ExtensionContext, Uri, ViewColumn, WebviewPanel, Webview, Disposable } from 'vscode';
import BasePreview from './basePreview';
/**
 * Manages cat coding webview panels
 */
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

	public processResult(stdout: any): any {
		var dataset: any = []
		var rows = stdout.split(/\r\n\r\n/);
		for (let row of rows) {
			if (row.trim().length === 0) { continue; };
			var jsonRow: any = {};
			var columns = row.split(/\r?\n/);
			for (let column of columns) {
				if (column.trim().length === 0) { continue; };
				var columnName = column.split(":")[0].trim()
				var columnValue = column.split(":")[1].trim()
				jsonRow[columnName] = columnValue
			};
			dataset.push(jsonRow)
		};
		this.saveState(dataset)
		//return dataset
	}

	public async getOptions(): Promise<any> {

		const file = this.psUri.fsPath + "/ReadSasDataset.ps1";

		let ps1command = "& {&'" + file + "' '" + this.uri.fsPath + "'}";
		let rowData: any = [];

		//"& {&'C:\\Experimental projects\\Sas-dataset-viewer\\ps\\ReadSasDataset.ps1' 'c:\\SAS Files\\SAS Prograns\\Pilot\\dm.sas7bdat'}"

		if (ps1command.includes(".sas7bdat")) {

			const { spawn } = require('child_process');
			const ps1 = spawn('powershell.exe', ["-command ", ps1command]);
			let dataset: string = "";
			//working as expected
			//for await (const data of ps1.stdout) {
			//console.log(data.toString())
			//	dataset = dataset + data.toString();
			//};
			//this.processResult(dataset);
			//let bufs: Buffer[] = []
			for await (const data of ps1.stdout) {
				//bufs.push(data)
				dataset = dataset + data.toString();
				this.saveState(dataset)

				//dataset = dataset + data.toString();
				//if (dataset.indexOf('\r\n\r\n') !== -1) {
				//this.processResult(dataset);
				//this.saveState(dataset)
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

			//return {
			//	uri: this.uri.toString(),
			//	previewUri: this.previewUri.toString(),
			//	state: this.state,
			//	rowData: rowData
			//};
		}

		//return {
		//	uri: this.uri.toString(),
		//	previewUri: this.previewUri.toString(),
		//	state: this.state
		//};
	}

	async refresh(): Promise<void> {
		let self = this;
		const options = await this.getOptions()
		//const options = this.getOptions()
		//const state = this.state
		//console.log(options)
		//console.log(state)
		//self.webview.postMessage({
		//	refresh: true,
		//	content: options
		//})
		//workspace.fs.readFile(this.uri).then(buffer => {
		//	self.webview.postMessage({
		//		refresh: true,
		//		content: buffer
		//	})
		//}, reason => {
		//window.showInformationMessage(reason);
		//});
	}

	getHtml(ignoreState: boolean = false): string {

		//const scriptPathOnDisk = Uri.joinPath(this.extensionUrl, 'media', 'main.js');
		const nonce = getNonce();
		//console.log(this.getOptions());
		//console.log(this.state)

		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<link href="${this.webMediaUri}/reset.css" rel="stylesheet">
			<link href="${this.webMediaUri}/ag-grid.min.css" rel="stylesheet">
			<link href="${this.webMediaUri}/ag-theme-alpine.min.css" rel="stylesheet">
			<script src="${this.webMediaUri}/sas7bdat.js"></script>
			<title>Sas7bat preview</title>
		</head>
		<body style="padding:0px; overflow:hidden" onload="resizeSheet()" onresize="resizeSheet()">

			<div id="myGrid">
			</div>

			<script nonce="${nonce}" src="${this.webMediaUri}/ag-grid-community.min.noStyle.js"></script>
			<!--<script nonce="${nonce}" src="${this.webMediaUri}/main.js"></script>-->
			
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
