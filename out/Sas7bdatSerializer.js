'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const Sas7bdatPreview_1 = require("./Sas7bdatPreview");
class ExcelSerializer {
    constructor(context) {
        this._context = context;
    }
    async deserializeWebviewPanel(webviewPanel, state) {
        Sas7bdatPreview_1.default.revive(this._context, vscode_1.Uri.parse(state.uri), webviewPanel);
    }
}
exports.default = ExcelSerializer;
//# sourceMappingURL=Sas7bdatSerializer.js.map