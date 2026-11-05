#!/usr/bin/env python3
"""把 Jest --json 结果转换成 PLM 需要的 JUnit XML。"""

import argparse
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def pick_result(data, full_name):
    results = []
    for file_result in data.get("testResults") or []:
        file_name = file_result.get("name") or ""
        for assertion in file_result.get("assertionResults") or []:
            name = assertion.get("fullName") or assertion.get("title") or ""
            if full_name and name != full_name:
                continue
            results.append((file_name, assertion))
    if not full_name and data.get("testResults"):
        for file_result in data["testResults"]:
            for assertion in file_result.get("assertionResults") or []:
                results.append((file_result.get("name") or "", assertion))
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("target")
    parser.add_argument("case_id")
    parser.add_argument("--full-name", default="")
    args = parser.parse_args()

    source = Path(args.source)
    if not source.exists():
        sys.stderr.write(f"[plm] 未找到 Jest 结果: {source}\n")
        return 1
    data = __import__("json").loads(source.read_text(encoding="utf-8"))
    results = pick_result(data, args.full_name)
    if not results:
        sys.stderr.write(f"[plm] Jest 结果中没有匹配的测试: {args.full_name or '(any)'}\n")
        return 1

    root = ET.Element("testsuites", {
        "tests": str(len(results)),
        "failures": str(sum(1 for _, a in results if a.get("status") == "failed")),
        "errors": "0",
        "skipped": str(sum(1 for _, a in results if a.get("status") in ("pending", "skipped", "todo"))),
    })
    for file_name, assertion in results:
        suite = ET.SubElement(root, "testsuite", {
            "name": assertion.get("ancestorTitles", [""])[-1] if assertion.get("ancestorTitles") else assertion.get("title", ""),
            "tests": "1",
            "failures": "1" if assertion.get("status") == "failed" else "0",
            "skipped": "1" if assertion.get("status") in ("pending", "skipped", "todo") else "0",
            "errors": "0",
        })
        case = ET.SubElement(suite, "testcase", {
            "name": assertion.get("fullName") or assertion.get("title") or args.case_id,
            "classname": file_name,
            "time": str(round((assertion.get("duration") or 0) / 1000.0, 3)),
        })
        properties = ET.SubElement(case, "properties")
        ET.SubElement(properties, "property", {"name": "case_id", "value": args.case_id})
        if assertion.get("status") == "failed":
            failure = ET.SubElement(case, "failure", {"message": "Jest 测试失败"})
            failure.text = "\n".join(assertion.get("failureMessages") or [])
        elif assertion.get("status") in ("pending", "skipped", "todo"):
            ET.SubElement(case, "skipped")

    target = Path(args.target)
    target.parent.mkdir(parents=True, exist_ok=True)
    tree = ET.ElementTree(root)
    tmp = target.with_suffix(target.suffix + ".tmp")
    tree.write(tmp, encoding="utf-8", xml_declaration=True)
    tmp.replace(target)
    sys.stderr.write(f"[plm] 已写出 {len(results)} 个 testcase 到 {target}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
