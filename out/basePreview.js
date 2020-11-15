'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const path = require("path");
const previewManager_1 = require("./previewManager");
class BasePreview {
    constructor(context, uri, scheme) {
        this._disposables = [];
        this._storage = context.workspaceState;
        this._uri = uri;
        this._previewUri = this._uri.with({
            scheme: scheme
        });
        this._extOutUri = vscode_1.Uri.file(path.join(context.extensionPath, 'out'));
        this._webMediaUri = vscode_1.Uri.file(path.join(context.extensionPath, 'media'));
        this._psUri = vscode_1.Uri.file(path.join(context.extensionPath, 'ps'));
        this._title = `Preview '${path.basename(this._uri.fsPath)}'`;
        previewManager_1.previewManager.add(this);
    }
    initWebviewPanel(viewColumn) {
        let panel = vscode_1.window.createWebviewPanel(this.viewType, this._title, viewColumn, {
            enableScripts: true,
            enableCommandUris: true,
            enableFindWidget: true,
            retainContextWhenHidden: true
        });
        return this.attachWebviewPanel(panel);
    }
    attachWebviewPanel(webviewPanel) {
        this._panel = webviewPanel;
        this._panel.onDidDispose(() => {
            this.dispose();
        }, this, this._disposables);
        return this;
    }
    handleEvents() {
        this.webview.onDidReceiveMessage((e) => {
            if (e.save) {
                this.saveState(e.state);
            }
            else if (e.refresh) {
                this.refresh();
            }
            else if (e.error) {
                vscode_1.window.showErrorMessage(e.error);
            }
        }, this, this._disposables);
        this.webview.html = this.getHtml();
    }
    dispose() {
        previewManager_1.previewManager.remove(this);
        this._panel.dispose();
        while (this._disposables.length) {
            const item = this._disposables.pop();
            if (item) {
                item.dispose();
            }
        }
    }
    configure() {
        this.webview.html = this.getHtml();
    }
    reload() {
        this.webview.html = this.getHtml(true);
    }
    reveal() {
        this._panel.reveal();
    }
    get visible() {
        return this._panel.visible;
    }
    get webview() {
        return this._panel.webview;
    }
    get storage() {
        return this._storage;
    }
    get state() {
        let key = this.previewUri.toString();
        return this.storage.get(key, {});
    }
    get uri() {
        return this._uri;
    }
    get psUri() {
        return this._psUri;
    }
    get previewUri() {
        return this._previewUri;
    }
    get webMediaUri() {
        return this._panel.webview.asWebviewUri(this._webMediaUri).toString();
    }
    get extensionUrl() {
        return this._panel.webview.asWebviewUri(this._extOutUri).toString();
    }
    saveState(state) {
        this._storage.update(this.previewUri.toString(), state);
    }
}
exports.default = BasePreview;
//# sourceMappingURL=basePreview.js.map