#!/usr/bin/env bash
set -euo pipefail

# Handoff dispatcher tool for SwarmForge squad
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
QUEUE_DIR="${REPO_ROOT}/.swarmforge/handoffs/queue"
mkdir -p "${QUEUE_DIR}"

if [[ $# -ne 1 || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "Usage: swarm_handoff.sh <draft-file>" >&2
  echo "Draft file must be in ./tmp/ and include 'type:', 'to:', 'priority:', 'task:'" >&2
  exit 1
fi

DRAFT_FILE="$1"

if [ ! -f "${DRAFT_FILE}" ]; then
  echo "Error: Draft file '${DRAFT_FILE}' not found." >&2
  exit 1
fi

# Infer sender role
SENDER_ROLE="${SWARMFORGE_ROLE:-}"
if [ -z "$SENDER_ROLE" ]; then
  BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  case "$BRANCH" in
    squad/coder) SENDER_ROLE="coder" ;;
    squad/refactorer) SENDER_ROLE="refactorer" ;;
    squad/architect) SENDER_ROLE="architect" ;;
    main|master) SENDER_ROLE="specifier" ;;
    *) SENDER_ROLE="unknown" ;;
  esac
fi

HEAD_SHA="$(git rev-parse HEAD)"

# Read draft headers
TYPE="$(grep -E "^type:" "${DRAFT_FILE}" | awk '{print $2}' || true)"
TO="$(grep -E "^to:" "${DRAFT_FILE}" | awk '{print $2}' || true)"
PRIORITY="$(grep -E "^priority:" "${DRAFT_FILE}" | awk '{print $2}' || true)"
TASK="$(grep -E "^task:" "${DRAFT_FILE}" | cut -d' ' -f2- || true)"

if [[ -z "$TYPE" || -z "$TO" || -z "$TASK" ]]; then
  echo "Error: Draft file missing required headers (type, to, task)." >&2
  exit 1
fi

TIMESTAMP="$(date -u +"%Y%m%d_%H%M%S")"
OUT_FILE="${QUEUE_DIR}/handoff_${TIMESTAMP}_${SENDER_ROLE}_to_${TO}.manifest"

cat << EOF > "${OUT_FILE}"
type: ${TYPE}
from: ${SENDER_ROLE}
to: ${TO}
priority: ${PRIORITY:-10}
task: ${TASK}
commit: ${HEAD_SHA}
created_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

echo "✓ Queued ${TYPE} from '${SENDER_ROLE}' to '${TO}' for task '${TASK}' (${HEAD_SHA:0:7})"
echo "Manifest: ${OUT_FILE}"
