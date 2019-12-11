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
const INDEX_MATCH_REGEX = /index\.(js|ts|jsx)$/i;
const settings = {
    importBaseString: `import $fileName from '$relativePath'`,
    include: '**/*.{js,ts,jsx}',
    ignore: '**/node_modules/**',
    allowIndexFile: false,
    allowFileExtension: false
};
function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.fuzzyImport', () => __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage("No active editor available");
            return;
        }
        loadSettings();
        const currentFile = getCurrentFilePath(editor);
        const availableFiles = yield getAllAvailableFiles();
        const selectedFile = yield vscode.window.showQuickPick(availableFiles);
        if (selectedFile) {
            const [relativePath, fileName] = convertToRelativePath(selectedFile, currentFile);
            insertImport(relativePath, fileName, editor);
        }
    }));
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function loadSettings() {
    settings.importBaseString = vscode.workspace.getConfiguration().get('finderImport.importString') || settings.importBaseString;
    settings.allowIndexFile = vscode.workspace.getConfiguration().get('finderImport.allowIndexFile') || settings.allowIndexFile;
    settings.allowFileExtension = vscode.workspace.getConfiguration().get('finderImport.allowFileExtension') || settings.allowFileExtension;
    settings.include = vscode.workspace.getConfiguration().get('finderImport.include') || settings.include;
    settings.ignore = vscode.workspace.getConfiguration().get('finderImport.ignore') || settings.ignore;
}
function insertImport(relativePath, fileName, editor) {
    const casedName = fileName.replace(/[-\.]([a-z])/g, groups => groups[1].toUpperCase());
    const importLine = settings.importBaseString
        .replace(/\$fileName/g, casedName)
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
        const files = yield vscode.workspace.findFiles(settings.include, settings.ignore);
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
        const [lastValue, fileName] = getFileImportValue();
        return [`${SAME_DIRECTORY}${lastValue}`, fileName];
    }
    const remaingParentDirCount = currentValues.length - 1 - offsetIndex;
    const remainingImportDirCount = importValues.length - 1 - offsetIndex;
    const [lastValue, fileName] = getFileImportValue();
    const upString = PARENT_DIRECTORY.repeat(remaingParentDirCount);
    const downTraversals = remainingImportDirCount > 0
        ? importValues.slice(offsetIndex, offsetIndex + remainingImportDirCount)
        : [];
    const downString = [...downTraversals, ...(lastValue ? [lastValue] : [])].join('/');
    return [`${upString}${downString}`, fileName];
    function getFileImportValue() {
        const file = importValues[importValues.length - 1];
        const fileName = file.replace(/\.[^\.]*$/, '');
        if (!settings.allowIndexFile && INDEX_MATCH_REGEX.test(file)) {
            const folderName = importValues.length > 2 ? importValues[importValues.length - 2] : fileName;
            return ['', folderName];
        }
        if (!settings.allowFileExtension) {
            return [fileName, fileName];
        }
        return [file, fileName];
    }
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map