# finder-import README
Allows you to import a file by searching for it through the file finder.

## Features
- Calculates the relative path to the file
- Support for aliases

## Extension Settings
* `finderImport.importString`:The template that should be used for the import. $fileName is replaced with a camelcased version of the file. $relativePath is replaced with the $relativePath.
* `finderImport.allowIndexFile`: Decides whether or not to include the "index(.js)" in the imported path.
* `finderImport.allowFileExtension`: Decides whether or not the file extension will be included in the imported path.
* `finderImport.include`: Files to be included in results
* `finderImport.ignore`: Files and folders to be ignored
