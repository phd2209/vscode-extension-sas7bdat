'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.previewManager = exports.PreviewManager = void 0;
class PreviewManager {
    constructor() {
        this._previews = [];
    }
    static get Instance() {
        return this._instance || (this._instance = new this());
    }
    add(preview) {
        this._previews.push(preview);
    }
    remove(preview) {
        let found = this._previews.indexOf(preview);
        if (found >= 0) {
            this._previews.splice(found, 1);
        }
    }
    find(uri) {
        return this._previews.find(p => p.previewUri.toString() === uri.toString());
    }
    active() {
        return this._previews.find(p => p.visible);
    }
    configure() {
        this._previews.forEach(p => p.configure());
    }
}
exports.PreviewManager = PreviewManager;
exports.previewManager = PreviewManager.Instance;
//# sourceMappingURL=previewManager.js.map