rz — lossless compressor + 7-Zip-style File Manager
===================================================

INSTALL (no admin needed):
  1. Double-click  install.bat
  2. If SmartScreen warns (rz.exe is unsigned): More info -> Run anyway
  3. Done. You now have:
       - a terminal command:   rz
       - a Start Menu app:      "rz File Manager"  (the GUI)
       - right-click any file:  "Compress with rz"

USE IT:
  rz ui                              open the graphical File Manager
  rz pack   file [-p password]       compress one file (optional encryption)
  rz unpack file.rz [-p password]    restore one file
  rz a  archive.rz f1 f2 [-p pw]     bundle many files into one archive
  rz l  archive.rz                   list an archive
  rz x  archive.rz [out-dir]         extract an archive
  rz bench folder                    compare vs gzip / brotli / xz / zstd

UNINSTALL:
  Double-click  uninstall.bat

Everything runs locally. Nothing is uploaded.
