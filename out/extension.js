"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const PARENT_DIRECTORY = '../';
const SAME_DIRECTORY = './';
const IMPORT_BASE_STRING = `import $fileName from '$relativePath'`;
const INDEX_MATCH_REGEX = /index\.(js|ts|jsx)/i;
const ALLOW_INDEX_FILE = false;
const ALLOW_FILE_EXTENSION = false;
function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.fuzzyImport', () => __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage("No active editor available");
            return;
        }
        const currentFile = getCurrentFilePath(editor);
        const availableFiles = yield getAllAvailableFiles();
        const selectedFile = yield vscode.window.showQuickPick(availableFiles);
        if (selectedFile) {
            const relativePath = convertToRelativePath(selectedFile, currentFile);
            insertImport(relativePath, editor);
        }
    }));
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function insertImport(relativePath, editor) {
    const fileName = relativePath
        .replace(/(.*\/|\..*?$)/g, '')
        .replace(/-([a-z])/g, groups => groups[1].toUpperCase());
    const importLine = IMPORT_BASE_STRING
        .replace(/\$fileName/g, fileName)
        .replace(/\$relativePath/g, relativePath);
    editor.edit((editBuilder) => {
        const { start } = editor.selection;
        editBuilder.insert(start, importLine);
    });
}
function getCurrentFilePath(editor) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const filePath = editor.document.uri.path;
    if (workspaceFolders && workspaceFolders.length === 1) {
        const workspaceFolderLength = workspaceFolders[0].uri.path.length;
        return filePath.substring(workspaceFolderLength);
    }
    return filePath;
}
function getAllAvailableFiles() {
    return __awaiter(this, void 0, void 0, function* () {
        const files = yield vscode.workspace.findFiles('**/*.{js,ts,jsx}', '**/node_modules/**');
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length === 1) {
            const workspaceFolderLength = workspaceFolders[0].uri.path.length;
            return files.map(({ path }) => path.substring(workspaceFolderLength));
        }
        return files.map(({ path }) => path);
    });
}
function convertToRelativePath(importStr, currentDirectory) {
    const importValues = importStr.split('/');
    const currentValues = currentDirectory.split('/');
    const offsetIndex = currentValues.findIndex((value, i) => value !== importValues[i]);
    if (offsetIndex === -1 ||
        importValues.length === currentValues.length &&
            importValues.length - 1 === offsetIndex) {
        return `${SAME_DIRECTORY}${getFileImportValue()}`;
    }
    const remaingParentDirs = currentValues.length - 1 - offsetIndex;
    const remainingImportDirs = importValues.length - 1 - offsetIndex;
    const upTraversals = PARENT_DIRECTORY.repeat(remaingParentDirs);
    const downTraversals = remainingImportDirs > 0
        ? importValues.slice(offsetIndex, offsetIndex + remainingImportDirs).join('/') + '/'
        : '';
    return `${upTraversals}${downTraversals}${getFileImportValue()}`;
    function getFileImportValue() {
        const file = importValues[importValues.length - 1];
        if (!ALLOW_INDEX_FILE && INDEX_MATCH_REGEX.test(file)) {
            return '';
        }
        if (!ALLOW_FILE_EXTENSION) {
            return file.replace(/\..*?$/, '');
        }
    }
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map