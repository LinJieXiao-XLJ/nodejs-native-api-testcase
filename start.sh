#!/bin/sh
# ============================================================================
# nodejs-native-api-testcase 的 PLM 统一入口
#
# 测试框架：Jest
# PLM 调用：sh start.sh case '<CASE_ID>'   （cwd = 仓库根）
# 产物：$PLM_REPORT_DIR/case-<ID>.xml（JUnit XML，每个 testcase 带 case_id）
#
# 数据库连接通过环境变量覆盖（不设置时使用默认值）：
#   IOTDB_HOST / IOTDB_PORT / IOTDB_USER / IOTDB_PASSWORD
# PLM 的 session-nodejs 不注入 IOTDB_HOST/IOTDB_PORT，默认连执行机本地 127.0.0.1:6667。
# ============================================================================
set -u

REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd) || exit 1
cd "$REPO_ROOT" || exit 1

REPORTS_DIR="${PLM_REPORT_DIR:-reports}"
AUTOMATION_TYPE="${PLM_AUTOMATION_TYPE:-session-nodejs}"
PYTHON="${PYTHON:-python3}"
JEST_CONFIG="$REPO_ROOT/jest.config.cjs"

usage() {
    cat >&2 <<'EOF'
Usage: sh start.sh <command> [target]
  prepare              安装依赖并校验 Jest 可收集测试
  list-cases --json    输出用例清单 JSON（stdout 仅 JSON）
  case <case-id>       执行单条用例
  cases <id1,id2>      批量执行（兼容保留；PLM 只逐条派发）
  help                 帮助
EOF
}

safe_name() {
    printf '%s' "$1" | tr '/' '_'
}

prepare() {
    if ! command -v node >/dev/null 2>&1; then
        echo "[plm] 未找到 node，请先安装 Node.js（111 节点使用 22.23.1）" >&2
        return 2
    fi
    if [ ! -d "$REPO_ROOT/node_modules" ] || [ "$REPO_ROOT/package-lock.json" -nt "$REPO_ROOT/node_modules" ]; then
        (cd "$REPO_ROOT" && npm ci --no-audit --no-fund) || return 1
    fi
    npx jest --config "$JEST_CONFIG" --listTests >/dev/null || return 1
    return 0
}

list_cases() {
    "$PYTHON" scripts/plm/plm_cases.py list --automation-type "$AUTOMATION_TYPE"
}

case_one() {
    [ -z "${1:-}" ] && { usage; return 2; }
    target=$("$PYTHON" scripts/plm/plm_cases.py lookup "$1") || return 5
    pattern=$("$PYTHON" scripts/plm/plm_cases.py regex "$1") || return 5
    file=${target%%::*}
    full=${target#*::}

    case "$REPORTS_DIR" in
        /*) : ;;
        *) REPORTS_DIR="$REPO_ROOT/$REPORTS_DIR" ;;
    esac
    mkdir -p "$REPORTS_DIR"
    final="$REPORTS_DIR/case-$(safe_name "$1").xml"
    raw="$REPORTS_DIR/.jest-$(safe_name "$1").json"
    rm -f -- "$final" "$raw"

    npx jest --config "$JEST_CONFIG" --runInBand --forceExit --json --outputFile="$raw" "$file" -t "$pattern"
    rc=$?

    if ! "$PYTHON" scripts/plm/jest_to_junit.py "$raw" "$final" "$1" --full-name "$full"; then
        rm -f -- "$raw" "$final"
        return 1
    fi
    rm -f -- "$raw"
    return $rc
}

cases_batch() {
    [ -z "${1:-}" ] && { usage; return 2; }
    ok=0
    old_ifs=$IFS
    IFS=','
    for raw in $1; do
        id=$(printf '%s' "$raw" | tr -d '[:space:]')
        [ -z "$id" ] && continue
        case_one "$id" || ok=1
    done
    IFS=$old_ifs
    return $ok
}

command="${1:-help}"
target="${2:-}"
case "$command" in
    prepare) prepare ;;
    list-cases)
        [ "$target" = "--json" ] || { usage; exit 2; }
        list_cases
        ;;
    case) case_one "$target" ;;
    cases) cases_batch "$target" ;;
    help|-h|--help) usage ;;
    *) usage; exit 2 ;;
esac
