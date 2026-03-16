Windows:

```powershell
New-Item -ItemType SymbolicLink -Path "$HOME\_vimrc" -Target "$PWD\.vimrc"
```

Linux:

```bash
ln -s "$PWD/.vimrc" "$HOME/.vimrc"
```
