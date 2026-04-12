/**
 * Patches React Navigation context files to replace throwing getters
 * with no-op returns. This prevents NativeWind's CSS interop from
 * crashing when it iterates over context default values.
 *
 * Only affects DEFAULT context values (used when no Provider is present).
 * Components inside NavigationContainer are unaffected.
 */
const fs = require('fs');
const path = require('path');

const patches = [
  {
    file: '@react-navigation/core/lib/module/NavigationStateContext.js',
    replacements: [
      [/get getKey\(\) \{\s*throw new Error\(MISSING_CONTEXT_ERROR\);\s*\}/g,
       'get getKey() { return () => undefined; }'],
      [/get setKey\(\) \{\s*throw new Error\(MISSING_CONTEXT_ERROR\);\s*\}/g,
       'get setKey() { return () => {}; }'],
      [/get getState\(\) \{\s*throw new Error\(MISSING_CONTEXT_ERROR\);\s*\}/g,
       'get getState() { return () => ({}); }'],
      [/get setState\(\) \{\s*throw new Error\(MISSING_CONTEXT_ERROR\);\s*\}/g,
       'get setState() { return () => {}; }'],
      [/get getIsInitial\(\) \{\s*throw new Error\(MISSING_CONTEXT_ERROR\);\s*\}/g,
       'get getIsInitial() { return () => true; }'],
    ],
  },
  {
    file: '@react-navigation/core/lib/module/NavigationBuilderContext.js',
    replacements: [
      [/scheduleUpdate: \(\) => \{\s*throw new Error\([^)]+\);\s*\}/g,
       'scheduleUpdate: () => {}'],
      [/flushUpdates: \(\) => \{\s*throw new Error\([^)]+\);\s*\}/g,
       'flushUpdates: () => {}'],
    ],
  },
  {
    file: '@react-navigation/native/lib/module/UnhandledLinkingContext.js',
    replacements: [
      [/get lastUnhandledLink\(\) \{\s*throw new Error\(MISSING_CONTEXT_ERROR\);\s*\}/g,
       'get lastUnhandledLink() { return undefined; }'],
      [/get setLastUnhandledLink\(\) \{\s*throw new Error\(MISSING_CONTEXT_ERROR\);\s*\}/g,
       'get setLastUnhandledLink() { return () => {}; }'],
    ],
  },
  {
    file: '@react-navigation/native/lib/module/LinkingContext.js',
    replacements: [
      [/get options\(\) \{\s*throw new Error\(MISSING_CONTEXT_ERROR\);\s*\}/g,
       'get options() { return {}; }'],
    ],
  },
];

let patchedCount = 0;

for (const { file, replacements } of patches) {
  const filePath = path.join(__dirname, '..', 'node_modules', file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [search, replace] of replacements) {
    const newContent = content.replace(search, replace);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    patchedCount++;
  }
}

if (patchedCount > 0) {
  console.log(`[patch] Fixed ${patchedCount} React Navigation context files`);
}
