'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode_1 = require("vscode");
//import * as ADODB from 'node-adodb'
//import * as edge from 'edge-js'
//import Sas7bdatPreview from './Sas7bdatPreview'
//import { previewManager } from './previewManager';
//import * as exec from 'child_process'
function activate(context) {
    // Excel: Open Preview
    context.subscriptions.push(vscode_1.commands.registerCommand('sas7bdat.preview', (uri) => {
        let resource = uri;
        //let viewColumn = getViewColumn();
        if (!(resource instanceof vscode_1.Uri)) {
            vscode_1.window.showInformationMessage("Use the explorer context menu or editor title menu to preview Sas datasets.");
            return;
        }
        Sas7bdatPreview.createOrShow(uri);
    }));
    if (vscode_1.window.registerWebviewPanelSerializer) {
        // Make sure we register a serializer in activation event
        vscode_1.window.registerWebviewPanelSerializer(Sas7bdatPreview.viewType, {
            async deserializeWebviewPanel(webviewPanel, state) {
                console.log(`Got state: ${state}`);
                Sas7bdatPreview.revive(webviewPanel, context.extensionUri);
            }
        });
    }
}
exports.activate = activate;
/**
 * Manages cat coding webview panels
 */
class Sas7bdatPreview {
    constructor(panel, extensionUri) {
        this._disposables = [];
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
        let ps1command = '"' + file + '" "' + this._extensionUri.fsPath + '"';
        //ReadSasDataset.ps1 c:\Data\sample.sas7bdat | Out-GridView		
        let jsonArray = [];
        if (ps1command.includes(".sas7bdat")) {
            const { spawn } = require('child_process');
            //const ps1 = spawn('powershell.exe', ["-command ", "& {&'C:\\Experimental projects\\Sas-dataset-viewer\\ps\\ReadSasDataset.ps1' 'c:\\SAS Files\\SAS Prograns\\Pilot\\dm.sas7bdat' | Out-GridView}"]);
            const ps1 = spawn('powershell.exe', ["-command ", "& {&'C:\\Experimental projects\\Sas-dataset-viewer\\ps\\ReadSasDataset.ps1' 'c:\\SAS Files\\SAS Prograns\\Pilot\\dm.sas7bdat'}"]);
            ps1.stdout.on('data', (data) => {
                //console.log(data)
                jsonArray.push(data.toString());
                console.log(data.toString());
            });
            ps1.stderr.on('data', (data) => {
                console.error(data.toString());
            });
            ps1.on('exit', (code) => {
                console.log(`Child exited with code ${code}`);
            });
        }
        console.log(jsonArray);
        // Set the webview's initial html content
        this._update();
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Update the content based on view changes
        this._panel.onDidChangeViewState(e => {
            if (this._panel.visible) {
                this._update();
            }
        }, null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'alert':
                    vscode_1.window.showErrorMessage(message.text);
                    return;
            }
        }, null, this._disposables);
    }
    static createOrShow(extensionUri) {
        const column = vscode_1.window.activeTextEditor
            ? vscode_1.window.activeTextEditor.viewColumn
            : undefined;
        // If we already have a panel, show it.
        if (Sas7bdatPreview.currentPanel) {
            Sas7bdatPreview.currentPanel._panel.reveal(column);
            return;
        }
        // Otherwise, create a new panel.
        const panel = vscode_1.window.createWebviewPanel(Sas7bdatPreview.viewType, 'Sas dataset viewer', column || vscode_1.ViewColumn.One, {
            // Enable javascript in the webview
            enableScripts: true,
            // And restrict the webview to only loading content from our extension's `media` directory.
            localResourceRoots: [vscode_1.Uri.joinPath(extensionUri, 'media')]
        });
        Sas7bdatPreview.currentPanel = new Sas7bdatPreview(panel, extensionUri);
    }
    static revive(panel, extensionUri) {
        Sas7bdatPreview.currentPanel = new Sas7bdatPreview(panel, extensionUri);
    }
    doRefactor() {
        // Send a message to the webview webview.
        // You can send any JSON serializable data.
        this._panel.webview.postMessage({ command: 'refactor' });
    }
    dispose() {
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
    _update() {
        const webview = this._panel.webview;
        this._updateForCat(webview);
        return;
    }
    _updateForCat(webview) {
        this._panel.title = 'Sas dataset viewer';
        this._panel.webview.html = this._getHtmlForWebview(webview, "Hello World");
    }
    _getHtmlForWebview(webview, sasDataset) {
        // Local path to main script run in the webview
        const scriptPathOnDisk = vscode_1.Uri.joinPath(this._extensionUri, 'media', 'main.js');
        // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
        // Local path to css styles
        const styleResetPath = vscode_1.Uri.joinPath(this._extensionUri, 'media', 'reset.css');
        const stylesPathMainPath = vscode_1.Uri.joinPath(this._extensionUri, 'media', 'vscode.css');
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
Sas7bdatPreview.viewType = 'sas7bdat';
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=working_extension.js.map