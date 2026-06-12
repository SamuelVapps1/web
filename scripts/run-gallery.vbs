Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
repoDir = fso.GetParentFolderName(scriptDir)

shell.CurrentDirectory = repoDir
shell.Run "cmd /c python scripts\gallery.py", 0, True
