#!/usr/bin/env bash
set -euo pipefail

# SwarmForge Done With Current Tool
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

echo "=== SwarmForge: Acknowledging Task Completion for '${ROLE}' ==="

ACTIVE_FILE="${SWARMFORGE_DIR}/handoffs/active_${ROLE}.manifest"

if [ -f "${ACTIVE_FILE}" ]; then
  ORIGINAL_MANIFEST="$(grep -E "^manifest_file:" "${ACTIVE_FILE}" | cut -d' ' -f2- || true)"
  TASK="$(grep -E "^task:" "${ACTIVE_FILE}" | cut -d' ' -f2- || true)"

  if [[ -n "${ORIGINAL_MANIFEST}" && -f "${ORIGINAL_MANIFEST}" ]]; then
    mv "${ORIGINAL_MANIFEST}" "${ARCHIVE_DIR}/"
    echo "✓ Archived queue manifest: $(basename "${ORIGINAL_MANIFEST}")"
  fi

  rm -f "${ACTIVE_FILE}"
  echo "✓ Completed task '${TASK}' for role '${ROLE}'."
else
  # Check if there is an unarchived manifest addressed to this role in queue
  FOUND=false
  for MANIFEST in $(find "${QUEUE_DIR}" -maxdepth 1 -name "*.manifest" | sort); do
    MANIFEST_TO="$(grep -E "^to:" "${MANIFEST}" | awk '{print $2}' || true)"
    if [[ "${MANIFEST_TO}" == "${ROLE}" ]]; then
      mv "${MANIFEST}" "${ARCHIVE_DIR}/"
      echo "✓ Cleaned and archived queue manifest: $(basename "${MANIFEST}")"
      FOUND=true
    fi
  done

  if [ "$FOUND" = false ]; then
    echo "Notice: No active task or pending queue item found for role '${ROLE}'."
  fi
fi

echo "✓ Role '${ROLE}' is ready for the next task."
