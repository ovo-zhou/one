import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { UPDATE_INSTALLER_SCRIPT } from '../src/main/update-installer.ts'

for (const scenario of [
  'success',
  'wait for exit',
  'process timeout',
  'swap failure',
  'rollback failure',
  'launch failure',
  'startup unconfirmed'
]) {
  test(scenario, async () => {
    const root = await mkdtemp(join(tmpdir(), 'faceless-installer-test-'))
    let parent
    try {
      const app = join(root, 'Faceless test.app')
      const staging = join(root, '.faceless-update-test')
      await mkdir(app)
      await writeFile(join(app, 'version'), 'old')
      await mkdir(join(staging, 'Faceless.app'), { recursive: true })
      await writeFile(join(staging, 'Faceless.app', 'version'), 'new')
      await writeFile(join(staging, 'install'), '')
      const mv = join(root, 'mv')
      await writeFile(
        mv,
        `#!/bin/bash
count=0
[ ! -f '${root}/count' ] || count=$(cat '${root}/count')
count=$((count+1))
echo "$count" > '${root}/count'
if [ '${scenario}' = 'swap failure' ] && [ "$count" = 2 ]; then exit 1; fi
if [ '${scenario}' = 'rollback failure' ] && [ "$count" -ge 2 ]; then exit 1; fi
exec /bin/mv "$@"
`,
        { mode: 0o700 }
      )
      const open = join(root, 'open')
      await writeFile(
        open,
        `#!/bin/bash
if [ '${scenario}' = 'launch failure' ] && [ "$(cat "$2/version")" = new ]; then exit 1; fi
if [ '${scenario}' != 'startup unconfirmed' ] && [ "$3" = --args ]; then
  touch "\${4#*=}/launched"
fi
exit 0
`,
        { mode: 0o700 }
      )
      const ps = join(root, 'ps')
      await writeFile(
        ps,
        `#!/bin/bash\n${scenario === 'process timeout' ? `echo '${app}/Contents/MacOS/Faceless'` : 'exit 0'}\n`,
        { mode: 0o700 }
      )
      const script = UPDATE_INSTALLER_SCRIPT.replaceAll('/bin/mv', `"${mv}"`)
        .replaceAll('/usr/bin/open', `"${open}"`)
        .replaceAll('/usr/bin/osascript', '/usr/bin/true')
        .replaceAll('/bin/ps', `"${ps}"`)
        .replaceAll('i<60', 'i<20')
        .replaceAll('/bin/sleep 1', '/bin/sleep 0.05')
      const scriptPath = join(root, 'install.sh')
      await writeFile(scriptPath, script)
      let pid = '99999999'
      if (scenario === 'wait for exit') {
        parent = spawn('/bin/sleep', ['30'])
        pid = String(parent.pid)
      }
      const installer = spawn('/bin/bash', [scriptPath, app, staging, pid], { stdio: 'ignore' })
      const finished = once(installer, 'exit')
      if (parent) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        assert.equal(await readFile(join(app, 'version'), 'utf8'), 'old')
        assert.equal(installer.exitCode, null)
        parent.kill()
        await once(parent, 'exit')
      }
      const [code] = await finished
      assert.equal(code, ['success', 'wait for exit'].includes(scenario) ? 0 : 1)
      if (scenario === 'rollback failure' || scenario === 'startup unconfirmed') {
        assert.equal(await readFile(join(staging, 'previous.app', 'version'), 'utf8'), 'old')
      } else {
        assert.equal(
          await readFile(join(app, 'version'), 'utf8'),
          ['success', 'wait for exit'].includes(scenario) ? 'new' : 'old'
        )
        await assert.rejects(readFile(join(staging, 'ready')), { code: 'ENOENT' })
      }
    } finally {
      parent?.kill()
      await rm(root, { recursive: true, force: true })
    }
  })
}
