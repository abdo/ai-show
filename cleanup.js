const fs = require('fs');
const path = require('path');

const dirs = [
  'server/handlers/talk',
  'src/components/ChromaGallery',
  'src/components/ChromaGrid',
  'src/components/CircularGallery',
  'src/components/ScriptOverlay',
  'src/components/VolumeControl',
  'src/components/ModeSwitch'
];

dirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  try {
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`Deleted ${dir}`);
    } else {
      console.log(`Did not find ${dir}`);
    }
  } catch (e) {
    console.error(`Failed to delete ${dir}:`, e.message);
  }
});
