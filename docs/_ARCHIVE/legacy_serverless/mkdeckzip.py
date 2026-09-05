import zipfile, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__))))
with zipfile.ZipFile('deck.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    z.write('dist_bundle/deck/handler.js', 'handler.js')
    for root, dirs, files in os.walk('node_modules'):
        dirs[:] = [d for d in dirs if d not in ('.bin', '@types')]
        for f in files:
            p = os.path.join(root, f)
            z.write(p, os.path.relpath(p, '.').replace(os.sep, '/'))
print('deck.zip:', os.path.getsize('deck.zip'), 'bytes')
