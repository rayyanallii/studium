from pathlib import Path
import json

# Reuse prior integration fixtures as browser-only responses; no database writes.
fixture = json.loads(Path('output/study-check/live-results.json').read_text(encoding='utf-8'))
script = Path('scripts/audit-spacing-study.js').read_text(encoding='utf-8')
Path('output/study-check/visual-check.js').write_text(script.replace('__STUDY_FIXTURE__', json.dumps(fixture)), encoding='utf-8')
