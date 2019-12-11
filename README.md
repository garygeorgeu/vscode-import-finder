# Finder Import
Allows you to import a file by searching for it through the file finder.

## Features
- Calculates the relative path to the file
- Support for aliases

## Extension Settings
* `finderImport.importString`:
  - The template that should be used for the import. $fileName is replaced with a camelcased version of the file name. $relativePath is replaced with the $relativePath.
  - Default: <code>import $fileName from '$relativePath'</code>
* `finderImport.allowIndexFile`:
  - Decides whether or not to include the "index(.js)" in the imported path.
  - Default: <code>false</code>
* `finderImport.allowFileExtension`: 
  - Decides whether or not the file extension will be included in the imported path.
  - Default: <code>false</code>
* `finderImport.include`:
  - Files to be included in results
  - Default: <code>'**/*.{js,ts,jsx}'</code>
* `finderImport.ignore`:
  - Files and folders to be ignored
  - Default: <code>'**/node_modules/**'</code>

## Installation
Download the vsix file![(here)](lnd-theme-0.0.1.vsix). Use the overflow menu under extensions in vscode to select "Install from VSIX".
