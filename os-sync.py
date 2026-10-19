#!/usr/bin/env python3
"""PixelProTech OS sync check. Run from the repo folder (flat, no subfolders).

  python3 os-sync.py                 check + rewrite os-files.json
  python3 os-sync.py --version 0.9.0 same, and bump the version in index.html + service-worker.js

It does three things so the OS can keep growing without hand-edited lists:
  1. every "file": "app-*.html" in pixel-repos.js must exist on disk
  2. every app-*.html on disk should be registered in pixel-repos.js (warns if not)
  3. writes os-files.json (all runtime files) used by Settings > Download all apps
Exit code 1 if something registered is missing, so a push never ships a broken launcher entry.
"""
import json, os, re, sys

here = os.path.dirname(os.path.abspath(__file__))
os.chdir(here)

def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()

if os.path.isdir(".git") is False and any(os.path.isdir(d) for d in os.listdir(".") if not d.startswith(".")):
    print("note: subfolders found; this OS is meant to stay flat")

repos = read("pixel-repos.js")
registered = sorted(set(re.findall(r'"file":\s*"([^"]+\.html)"', repos)))
on_disk = sorted(f for f in os.listdir(".") if re.fullmatch(r"app-[a-z0-9-]+\.html", f))

missing = [f for f in registered if not os.path.isfile(f)]
unregistered = [f for f in on_disk if f not in registered]
print(f"registered apps: {len(registered)}   app files on disk: {len(on_disk)}")
for f in missing: print("MISSING (registered but not on disk):", f)
for f in unregistered: print("warning: on disk but not in pixel-repos.js:", f)

skip = {"os-files.json", "os-sync.py", "service-worker.js"}
ext_ok = (".html", ".js", ".css", ".svg", ".png", ".json")
files = sorted(f for f in os.listdir(".")
               if os.path.isfile(f) and f not in skip and f.endswith(ext_ok) and not f.startswith("."))
total = sum(os.path.getsize(f) for f in files)
with open("os-files.json", "w", encoding="utf-8") as f:
    json.dump({"generated_files": len(files), "bytes": total, "files": files}, f, indent=1)
print(f"os-files.json: {len(files)} files, {total/1048576:.1f} MB")

if "--version" in sys.argv:
    v = sys.argv[sys.argv.index("--version") + 1]
    assert re.fullmatch(r"\d+\.\d+\.\d+", v), "version looks like 0.9.0"
    s = read("index.html")
    s, n = re.subn(r'version:\s*"[\d.]+"', f'version: "{v}"', s, count=1)
    open("index.html", "w", encoding="utf-8").write(s)
    sw = read("service-worker.js")
    sw, m = re.subn(r'const VERSION = "[\d-]+"', 'const VERSION = "%s"' % v.replace(".", "-"), sw, count=1)
    open("service-worker.js", "w", encoding="utf-8").write(sw)
    print(f"version -> {v} (index.html {'ok' if n else 'NOT FOUND'}, service-worker.js {'ok' if m else 'NOT FOUND'})")

sys.exit(1 if missing else 0)
