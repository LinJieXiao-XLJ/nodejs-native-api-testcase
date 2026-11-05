#!/usr/bin/env python3
"""PLM 用例映射与 Jest 结果处理（nodejs-native-api-testcase）。"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MAP_PATH = ROOT / ".plm-case-id-map.json"
DEFAULT_AUTOMATION_TYPE = "session-nodejs"


def load_map():
    if not MAP_PATH.exists():
        return {"nmap": {}, "revmap": {}, "aliases": {}}
    with MAP_PATH.open(encoding="utf-8") as fh:
        data = json.load(fh)
    if "nmap" in data or "revmap" in data:
        return {
            "nmap": data.get("nmap") or {},
            "revmap": data.get("revmap") or {},
            "aliases": data.get("aliases") or {},
        }
    return {"nmap": data, "revmap": {}, "aliases": {}}


def normalize(case_id):
    return str(case_id).strip().upper()


def lookup(case_id):
    data = load_map()
    key = normalize(case_id)
    mapping = {normalize(k): v for k, v in data["nmap"].items()}
    aliases = {normalize(k): v for k, v in data["aliases"].items()}
    target = mapping.get(normalize(aliases.get(key, key)))
    if not target:
        return None
    if isinstance(target, list):
        return target[0] if target else None
    return str(target)


def cmd_list(args):
    data = load_map()
    entries = []
    for raw_id, targets in data["nmap"].items():
        case_id = normalize(raw_id)
        target = targets[0] if isinstance(targets, list) and targets else targets
        if not target:
            continue
        entries.append({
            "caseId": case_id,
            "automationType": args.automation_type,
            "nodeId": str(target),
            "sourceFile": "tests",
            "description": "",
        })
    entries.sort(key=lambda item: item["caseId"])
    json.dump(entries, sys.stdout, ensure_ascii=False)
    sys.stdout.write("\n")


def cmd_lookup(args):
    target = lookup(args.case_id)
    if not target:
        sys.stderr.write(f"[plm] 未找到用例映射: {args.case_id}\n")
        return 5
    sys.stdout.write(target + "\n")
    return 0


def cmd_regex(args):
    target = lookup(args.case_id)
    if not target:
        sys.stderr.write(f"[plm] 未找到用例映射: {args.case_id}\n")
        return 5
    full = target.split("::", 1)[1] if "::" in target else target
    sys.stdout.write(re.escape(full) + "\n")
    return 0


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)

    p_list = sub.add_parser("list")
    p_list.add_argument("--automation-type", default=os.environ.get("PLM_AUTOMATION_TYPE", DEFAULT_AUTOMATION_TYPE))
    p_list.set_defaults(func=cmd_list)

    p_lookup = sub.add_parser("lookup")
    p_lookup.add_argument("case_id")
    p_lookup.set_defaults(func=cmd_lookup)

    p_regex = sub.add_parser("regex")
    p_regex.add_argument("case_id")
    p_regex.set_defaults(func=cmd_regex)

    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
