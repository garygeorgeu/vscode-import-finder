import * as vscode from 'vscode';

const PARENT_DIRECTORY = '../'
const SAME_DIRECTORY = './'
const INDEX_MATCH_REGEX = /index\.(js|ts|jsx)$/i
const EXTENSION_REGEX = /\.[^\.]*$/
const FILE_DIR_REGEX = /.*?\//

const settings = {
  importBaseString: `import $fileName from '$relativePath'`,
  include: '**/*.{js,ts,jsx}',
  ignore: '**/node_modules/**',
  aliases: [{ match: '/out', replace: '@out'}],
  allowIndexFile: false,
  allowFileExtension: false
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('extension.fuzzyImport', async () => {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      vscode.window.showInformationMessage("No active editor available")
      return
    }

    loadSettings()
    const currentFile = getCurrentFilePath(editor)
    const availableFiles = await getAllAvailableFiles()
    const selectedFile = await vscode.window.showQuickPick(availableFiles)
    if (selectedFile) {
      const { relativePath, fileName } = findAlias(selectedFile) || convertToRelativePath(selectedFile, currentFile)
      insertImportString(relativePath, fileName, editor)
    }
	})

	context.subscriptions.push(disposable)
}

function loadSettings() {
  settings.importBaseString = vscode.workspace.getConfiguration().get('finderImport.importString') || settings.importBaseString
  settings.allowIndexFile = vscode.workspace.getConfiguration().get('finderImport.allowIndexFile') || settings.allowIndexFile
  settings.allowFileExtension = vscode.workspace.getConfiguration().get('finderImport.allowFileExtension') || settings.allowFileExtension
  settings.aliases = vscode.workspace.getConfiguration().get('finderImport.aliases') || settings.aliases
  settings.include = vscode.workspace.getConfiguration().get('finderImport.include') || settings.include
  settings.ignore = vscode.workspace.getConfiguration().get('finderImport.ignore') || settings.ignore
}

function insertImportString(relativePath: string, fileName: string, editor: vscode.TextEditor) {
  const casedName = fileName.replace(/[-\.]([a-z])/g, groups => groups[1].toUpperCase())
  const importLine = settings.importBaseString
    .replace(/\$fileName/g, casedName)
    .replace(/\$relativePath/g, relativePath)

  editor.edit(
    (editBuilder: vscode.TextEditorEdit) => {
      const { start } = editor.selection
      editBuilder.insert(start, importLine)
    }
  )
}

function getCurrentFilePath(editor: vscode.TextEditor) {
  const workspaceFolders = vscode.workspace.workspaceFolders
  const filePath = editor.document.uri.path
  if (workspaceFolders && workspaceFolders.length === 1) {
    const workspaceFolderLength = workspaceFolders[0].uri.path.length
    return filePath.substring(workspaceFolderLength)
  }
  return filePath
}

async function getAllAvailableFiles() {
  const files = await vscode.workspace.findFiles(settings.include, settings.ignore)
  const workspaceFolders = vscode.workspace.workspaceFolders

  if (workspaceFolders && workspaceFolders.length === 1) {
    const workspaceFolderLength = workspaceFolders[0].uri.path.length
    return files.map(({ path }) => path.substring(workspaceFolderLength))
  }

  return files.map(({ path }) => path)
}

function findAlias(selectedFile: string) {
  const matchedAlias = settings.aliases.find(({ match }) => selectedFile.startsWith(match))
  if (!matchedAlias) return
  const { match, replace } = matchedAlias
  const replacedString = `${replace}${selectedFile.substring(match.length)}`
  const split = replacedString.split('/')
  const [lastValue, fileName] = getFileImportValue(split)
  const joinedPrefix = split.slice(0, split.length - 1).join('/')

  return {
    relativePath: `${joinedPrefix && lastValue ? joinedPrefix + '/' : joinedPrefix}${lastValue}`,
    fileName
  }
}

function convertToRelativePath(importStr: string, currentDirectory: string) {
  const importValues = importStr.split('/')
  const currentValues = currentDirectory.split('/')
  const offsetIndex = currentValues.findIndex((value, i) => value !== importValues[i])
  const [lastValue, fileName] = getFileImportValue(importValues)

  if (
    offsetIndex === -1 ||
    importValues.length === currentValues.length &&
    importValues.length - 1 === offsetIndex
  ) {
    return {
      relativePath: `${SAME_DIRECTORY}${lastValue}`,
      fileName
    }
  }

  const remaingParentDirCount = currentValues.length - 1 - offsetIndex
  const remainingImportDirCount = importValues.length - 1 - offsetIndex
  const upString = PARENT_DIRECTORY.repeat(remaingParentDirCount)
  const downTraversals = remainingImportDirCount > 0 
    ? importValues.slice(offsetIndex, offsetIndex + remainingImportDirCount) 
    : []
  const downString = [...downTraversals, ...(lastValue ? [lastValue] : [])].join('/')
  return {
    relativePath: `${upString}${downString}`,
    fileName
  }
}

function getFileImportValue(fileArr: Array<string>) {
  const fileWithExtension = fileArr[fileArr.length - 1]
  const fileName = fileWithExtension.replace(EXTENSION_REGEX, '')

  if (!settings.allowIndexFile && INDEX_MATCH_REGEX.test(fileWithExtension)) {
    const folderName = fileArr.length > 2 ? fileArr[fileArr.length - 2] : fileName
    return ['', folderName]
  }
  if (!settings.allowFileExtension) {
    return [fileName, fileName]
  }
  return [fileWithExtension, fileName]
}

export function deactivate() {}
