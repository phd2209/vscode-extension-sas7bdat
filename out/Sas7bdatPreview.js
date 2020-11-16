'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const basePreview_1 = require("./basePreview");
class Sas7bdatPreview extends basePreview_1.default {
    static create(context, uri, viewColumn) {
        let preview = new Sas7bdatPreview(context, uri, "sas7bdat-preview");
        preview.initWebviewPanel(viewColumn);
        preview.handleEvents();
        return preview;
    }
    static revive(context, uri, webviewPanel) {
        let preview = new Sas7bdatPreview(context, uri, "sas7bdat-preview");
        preview.attachWebviewPanel(webviewPanel);
        preview.handleEvents();
        return preview;
    }
    async getOptions() {
        const file = this.psUri.fsPath + "/ReadSasDataset.ps1";
        let ps1command = "& {&'" + file + "' '" + this.uri.fsPath + "'}";
        let rowData = [];
        if (ps1command.includes(".sas7bdat")) {
            const { spawn } = require('child_process');
            const ps1 = spawn('powershell.exe', ["-command ", ps1command]);
            let dataset = "";
            for await (const data of ps1.stdout) {
                dataset = dataset + data.toString();
                this.saveState(dataset);
                let self = this;
                let options = {
                    uri: this.uri.toString(),
                    previewUri: this.previewUri.toString(),
                    state: this.state
                };
                self.webview.postMessage({
                    refresh: true,
                    content: options
                });
                //}
            }
            ;
            ps1.stderr.on('data', (data) => {
                console.error(data.toString());
            });
            ps1.on('exit', (code) => {
                console.log(`Child exited with code ${code}`);
                ps1.exit();
            });
        }
    }
    async refresh() {
        await this.getOptions();
    }
    getHtml(ignoreState = false) {
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
    get viewType() {
        return "sasviewer-sas7bdat";
    }
}
exports.default = Sas7bdatPreview;
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=Sas7bdatPreview.js.map