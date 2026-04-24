/* eslint-disable */
const path = require('path')
const genPath = path.resolve(__dirname, '..', '..', '..', 'node_modules', '.pnpm', '@tanstack+router-generator@1.166.24', 'node_modules', '@tanstack', 'router-generator', 'dist', 'cjs', 'index.cjs')
const { Generator, getConfig } = require(genPath)

;(async () => {
  const cwd = path.resolve(__dirname, '..')
  process.chdir(cwd)
  const cfg = getConfig(
    {
      routesDirectory: path.join(cwd, 'src/routes'),
      generatedRouteTree: path.join(cwd, 'src/routeTree.gen.ts'),
    },
    cwd,
  )
  const g = new Generator({ config: cfg, root: cwd })
  await g.run()
  console.log('Route tree regenerated')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
