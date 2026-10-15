#!/usr/bin/env bash
set -euo pipefail

# Initialize SwarmForge 4-role squad worktrees and git branches
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORKTREES_DIR="${REPO_ROOT}/.worktrees"
SWARMFORGE_DIR="${REPO_ROOT}/.swarmforge"

echo "=== Initializing SwarmForge Squad Worktrees ==="
mkdir -p "${WORKTREES_DIR}"
mkdir -p "${SWARMFORGE_DIR}/handoffs/queue"
mkdir -p "${SWARMFORGE_DIR}/handoffs/archive"
mkdir -p "${REPO_ROOT}/tmp"

ROLES=("coder" "refactorer" "architect")

for ROLE in "${ROLES[@]}"; do
  BRANCH_NAME="squad/${ROLE}"
  WORKTREE_PATH="${WORKTREES_DIR}/${ROLE}"

  # Ensure branch exists
  if ! git -C "${REPO_ROOT}" show-ref --quiet --heads "${BRANCH_NAME}"; then
    echo "Creating branch '${BRANCH_NAME}' from main..."
    git -C "${REPO_ROOT}" branch "${BRANCH_NAME}" main
  fi

  # Ensure worktree exists
  if [ ! -d "${WORKTREE_PATH}" ]; then
    echo "Adding worktree for '${ROLE}' at '${WORKTREE_PATH}'..."
    git -C "${REPO_ROOT}" worktree add "${WORKTREE_PATH}" "${BRANCH_NAME}"
  else
    echo "Worktree for '${ROLE}' already exists at '${WORKTREE_PATH}'."
  fi

  mkdir -p "${WORKTREE_PATH}/tmp"
done

# Install commit-msg hook if not already present
HOOKS_DIR="${REPO_ROOT}/.git/hooks"
COMMIT_MSG_HOOK="${HOOKS_DIR}/commit-msg"

if [ ! -f "${COMMIT_MSG_HOOK}" ]; then
  echo "Installing SwarmForge commit-msg hook..."
  cat << 'EOF' > "${COMMIT_MSG_HOOK}"
#!/usr/bin/env bash
# Appends 'By <role>.' byline if missing
COMMIT_MSG_FILE="$1"
ROLE="${SWARMFORGE_ROLE:-}"

if [ -z "$ROLE" ]; then
  CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  case "$CURRENT_BRANCH" in
    squad/coder) ROLE="coder" ;;
    squad/refactorer) ROLE="refactorer" ;;
    squad/architect) ROLE="architect" ;;
    main|master) ROLE="specifier" ;;
  esac
fi

if [ -n "$ROLE" ] && ! grep -q "By ${ROLE}." "$COMMIT_MSG_FILE"; then
  echo "" >> "$COMMIT_MSG_FILE"
  echo "By ${ROLE}." >> "$COMMIT_MSG_FILE"
fi
EOF
  chmod +x "${COMMIT_MSG_HOOK}"
fi

chmod +x "${REPO_ROOT}/swarmforge/scripts/"*.sh

echo "=== SwarmForge Squad Worktrees Ready ==="
git -C "${REPO_ROOT}" worktree list
