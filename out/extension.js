'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode_1 = require("vscode");
const Sas7bdatPreview_1 = require("./Sas7bdatPreview");
const previewManager_1 = require("./previewManager");
const Sas7bdatSerializer_1 = require("./Sas7bdatSerializer");
function activate(context) {
    let sasCommand = vscode_1.commands.registerCommand('sas7bdat.preview', (uri) => {
        let resource = uri;
        let viewColumn = getViewColumn();
        if (!(resource instanceof vscode_1.Uri)) {
            vscode_1.window.showInformationMessage("Use the explorer context menu or editor title menu to preview sas7bdat files.");
            return;
        }
        const sas7bdat = resource.with({
            scheme: 'sas7bdat-preview'
        });
        let preview = previewManager_1.previewManager.find(sas7bdat);
        if (preview) {
            preview.reveal();
            return;
        }
        preview = Sas7bdatPreview_1.default.create(context, resource, viewColumn);
        return preview.webview;
    });
    context.subscriptions.push(sasCommand);
    vscode_1.window.registerWebviewPanelSerializer("sasviewer-sas7bdat", new Sas7bdatSerializer_1.default(context));
    // Reset all previews when the configuration changes
    vscode_1.workspace.onDidChangeConfiguration(() => {
        previewManager_1.previewManager.configure();
    });
}
exports.activate = activate;
function getViewColumn() {
    const active = vscode_1.window.activeTextEditor;
    return active ? active.viewColumn : vscode_1.ViewColumn.One;
}
//# sourceMappingURL=extension.js.map