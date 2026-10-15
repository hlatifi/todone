#!/usr/bin/env bash
set -euo pipefail

# SwarmForge Inbound Handoff Pickup Tool
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SWARMFORGE_DIR="${REPO_ROOT}/.swarmforge"
QUEUE_DIR="${SWARMFORGE_DIR}/handoffs/queue"
ARCHIVE_DIR="${SWARMFORGE_DIR}/handoffs/archive"

mkdir -p "${QUEUE_DIR}" "${ARCHIVE_DIR}"

# 1. Infer current role
ROLE="${SWARMFORGE_ROLE:-}"
if [ -z "$ROLE" ]; then
  CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  case "$CURRENT_BRANCH" in
    squad/coder) ROLE="coder" ;;
    squad/refactorer) ROLE="refactorer" ;;
    squad/architect) ROLE="architect" ;;
    main|master) ROLE="specifier" ;;
    *)
      # Check directory name as fallback
      CURRENT_DIR="$(basename "$(pwd)")"
      case "$CURRENT_DIR" in
        coder|refactorer|architect) ROLE="$CURRENT_DIR" ;;
        *) ROLE="unknown" ;;
      esac
      ;;
  esac
fi

if [[ "$ROLE" == "unknown" || -z "$ROLE" ]]; then
  echo "Error: Unable to determine role. Set SWARMFORGE_ROLE=<role> or run inside a designated squad worktree." >&2
  exit 1
fi

echo "=== SwarmForge: Checking Inbound Handoffs for '${ROLE}' ==="

# 2. Check if there's already an active handoff in progress
ACTIVE_FILE="${SWARMFORGE_DIR}/handoffs/active_${ROLE}.manifest"
if [ -f "${ACTIVE_FILE}" ]; then
  echo "Notice: Role '${ROLE}' already has an active task in progress:"
  cat "${ACTIVE_FILE}"
  echo "Run 'swarmforge/scripts/done_with_current.sh' when finished before picking up a new task."
  exit 0
fi

# 3. Find the oldest matching manifest in the queue for this role
MATCHING_MANIFEST=""
for MANIFEST in $(find "${QUEUE_DIR}" -maxdepth 1 -name "*.manifest" | sort); do
  MANIFEST_TO="$(grep -E "^to:" "${MANIFEST}" | awk '{print $2}' || true)"
  if [[ "${MANIFEST_TO}" == "${ROLE}" ]]; then
    MATCHING_MANIFEST="${MANIFEST}"
    break
  fi
done

if [ -z "${MATCHING_MANIFEST}" ]; then
  echo "No pending handoffs found in queue for role '${ROLE}'."
  exit 0
fi

# 4. Parse manifest
TYPE="$(grep -E "^type:" "${MATCHING_MANIFEST}" | awk '{print $2}' || true)"
FROM="$(grep -E "^from:" "${MATCHING_MANIFEST}" | awk '{print $2}' || true)"
TASK="$(grep -E "^task:" "${MATCHING_MANIFEST}" | cut -d' ' -f2- || true)"
COMMIT_SHA="$(grep -E "^commit:" "${MATCHING_MANIFEST}" | awk '{print $2}' || true)"
PRIORITY="$(grep -E "^priority:" "${MATCHING_MANIFEST}" | awk '{print $2}' || true)"

echo "Found pending ${TYPE} from '${FROM}' (priority: ${PRIORITY:-10}):"
echo "  Task: ${TASK}"
if [ -n "${COMMIT_SHA}" ]; then
  echo "  Commit: ${COMMIT_SHA}"
fi

# 5. Process according to type
if [[ "${TYPE}" == "git_handoff" ]]; then
  if [ -z "${COMMIT_SHA}" ]; then
    echo "Error: Manifest has type 'git_handoff' but lacks commit SHA." >&2
    exit 1
  fi

  if ! git cat-file -e "${COMMIT_SHA}^{commit}" 2>/dev/null; then
    echo "Error: Commit '${COMMIT_SHA}' not found in git object database." >&2
    exit 1
  fi

  echo "Merging commit '${COMMIT_SHA:0:7}' into branch '$(git rev-parse --abbrev-ref HEAD)'..."
  if ! git merge --no-edit -m "Merge handoff from ${FROM} for task ${TASK} (${COMMIT_SHA:0:7})" "${COMMIT_SHA}"; then
    echo "Conflict detected during merge! Please resolve conflicts before proceeding." >&2
    exit 1
  fi

  # Record as active task
  cat << EOF > "${ACTIVE_FILE}"
manifest_file: ${MATCHING_MANIFEST}
type: ${TYPE}
from: ${FROM}
to: ${ROLE}
task: ${TASK}
commit: ${COMMIT_SHA}
picked_up_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

  echo "✓ Successfully merged '${COMMIT_SHA:0:7}' for task '${TASK}'."
  echo "✓ Role '${ROLE}' is now active on task '${TASK}'."

elif [[ "${TYPE}" == "note" ]]; then
  MESSAGE="$(grep -E "^message:" "${MATCHING_MANIFEST}" | cut -d' ' -f2- || true)"
  echo "----------------------------------------"
  echo "NOTE from ${FROM}: ${MESSAGE}"
  echo "----------------------------------------"
  mv "${MATCHING_MANIFEST}" "${ARCHIVE_DIR}/"
  echo "✓ Note archived to ${ARCHIVE_DIR}/$(basename "${MATCHING_MANIFEST}")"
else
  echo "Notice: Unhandled handoff type '${TYPE}'."
fi
