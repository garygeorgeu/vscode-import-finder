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
const EXTENSION_REGEX = /\.[^\.]*$/;
const FILE_DIR_REGEX = /.*?\//;
const settings = {
    importBaseString: `import $fileName from '$relativePath'`,
    include: '**/*.{js,ts,jsx}',
    ignore: '**/node_modules/**',
    aliases: [{ match: '/out', replace: '@out' }],
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
            const { relativePath, fileName } = findAlias(selectedFile) || convertToRelativePath(selectedFile, currentFile);
            insertImportString(relativePath, fileName, editor);
        }
    }));
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function loadSettings() {
    settings.importBaseString = vscode.workspace.getConfiguration().get('finderImport.importString') || settings.importBaseString;
    settings.allowIndexFile = vscode.workspace.getConfiguration().get('finderImport.allowIndexFile') || settings.allowIndexFile;
    settings.allowFileExtension = vscode.workspace.getConfiguration().get('finderImport.allowFileExtension') || settings.allowFileExtension;
    settings.aliases = vscode.workspace.getConfiguration().get('finderImport.aliases') || settings.aliases;
    settings.include = vscode.workspace.getConfiguration().get('finderImport.include') || settings.include;
    settings.ignore = vscode.workspace.getConfiguration().get('finderImport.ignore') || settings.ignore;
}
function insertImportString(relativePath, fileName, editor) {
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
function findAlias(selectedFile) {
    const matchedAlias = settings.aliases.find(({ match }) => selectedFile.startsWith(match));
    if (!matchedAlias)
        return;
    const { match, replace } = matchedAlias;
    const replacedString = `${replace}${selectedFile.substring(match.length)}`;
    const split = replacedString.split('/');
    const [lastValue, fileName] = getFileImportValue(split);
    const joinedPrefix = split.slice(0, split.length - 1).join('/');
    return {
        relativePath: `${joinedPrefix && lastValue ? joinedPrefix + '/' : joinedPrefix}${lastValue}`,
        fileName
    };
}
function convertToRelativePath(importStr, currentDirectory) {
    const importValues = importStr.split('/');
    const currentValues = currentDirectory.split('/');
    const offsetIndex = currentValues.findIndex((value, i) => value !== importValues[i]);
    const [lastValue, fileName] = getFileImportValue(importValues);
    if (offsetIndex === -1 ||
        importValues.length === currentValues.length &&
            importValues.length - 1 === offsetIndex) {
        return {
            relativePath: `${SAME_DIRECTORY}${lastValue}`,
            fileName
        };
    }
    const remaingParentDirCount = currentValues.length - 1 - offsetIndex;
    const remainingImportDirCount = importValues.length - 1 - offsetIndex;
    const upString = PARENT_DIRECTORY.repeat(remaingParentDirCount);
    const downTraversals = remainingImportDirCount > 0
        ? importValues.slice(offsetIndex, offsetIndex + remainingImportDirCount)
        : [];
    const downString = [...downTraversals, ...(lastValue ? [lastValue] : [])].join('/');
    return {
        relativePath: `${upString}${downString}`,
        fileName
    };
}
function getFileImportValue(fileArr) {
    const fileWithExtension = fileArr[fileArr.length - 1];
    const fileName = fileWithExtension.replace(EXTENSION_REGEX, '');
    if (!settings.allowIndexFile && INDEX_MATCH_REGEX.test(fileWithExtension)) {
        const folderName = fileArr.length > 2 ? fileArr[fileArr.length - 2] : fileName;
        return ['', folderName];
    }
    if (!settings.allowFileExtension) {
        return [fileName, fileName];
    }
    return [fileWithExtension, fileName];
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map