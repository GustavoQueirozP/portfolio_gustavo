"""Verifica links e conteúdo público. Use --ignorar-notebooks para adiar sua auditoria."""

import argparse
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {".venv", ".git", ".pytest_cache", "__pycache__", ".uv-cache"}


class PageParser(HTMLParser):
    def __init__(self, path, report, root=ROOT):
        super().__init__(convert_charrefs=True)
        self.path, self.report = path, report
        self.root = root
        self.footer_depth = 0
        self.footer_credit = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        line = self.getpos()[0]
        if tag == "footer":
            self.footer_depth += 1
        if tag == "img" and not (attrs.get("alt") or "").strip():
            self.report(self.path, line, "imagem sem alt descritivo")
        for attr in ("href", "src"):
            value = attrs.get(attr)
            if not value:
                continue
            if tag == "a" and attr == "href" and value.strip() == "#":
                # Âncoras vazias não oferecem um destino de contato utilizável.
                self.report(self.path, line, 'link sem destino: href="#"')
            url = urlsplit(value.replace("\\", "/"))
            if url.scheme or url.netloc or not url.path:
                continue
            target = (self.root if url.path.startswith("/") else self.path.parent) / unquote(url.path).lstrip("/")
            if not target.exists() or (target.is_dir() and not (target / "index.html").is_file()):
                self.report(self.path, line, f"{attr} local inexistente: {value}")

    def handle_endtag(self, tag):
        if tag == "footer":
            self.footer_depth = max(0, self.footer_depth - 1)

    def handle_data(self, data):
        if self.footer_depth and "HTML5 UP" in data:
            self.footer_credit = True


def check(root=ROOT, ignore_notebooks=False):
    problems = []

    def report(path, line, message):
        problems.append(f"{path.relative_to(root).as_posix()}:{line}: {message}")

    for path in sorted(root.rglob("*")):
        relative = path.relative_to(root)
        if any(part in EXCLUDED for part in relative.parts) or not path.is_file():
            continue
        if path.suffix.lower() not in {".html", ".py", ".ipynb"}:
            continue
        if ignore_notebooks and path.suffix.lower() == ".ipynb":
            continue
        source = path.read_text(encoding="utf-8-sig")
        for number, line in enumerate(source.splitlines(), 1):
            if re.search(r"C:(?:/|\\+)Users", line, re.IGNORECASE):
                report(path, number, "caminho absoluto de usuário Windows")
            if re.search(r"\bAir[b]nb\b", line, re.IGNORECASE):
                report(path, number, "referência indevida a hospedagem")
        if path.suffix.lower() == ".html" and "assets" not in relative.parts:
            parser = PageParser(path, report, root)
            parser.feed(source)
            if not parser.footer_credit:
                report(path, 1, "rodapé sem crédito HTML5 UP")
    return problems


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ignorar-notebooks", action="store_true", help="adia a auditoria dos arquivos .ipynb")
    args = parser.parse_args()
    problems = check(ignore_notebooks=args.ignorar_notebooks)
    print("\n".join(problems)) if problems else None
    print(f"{len(problems)} problema(s).")
    return bool(problems)


if __name__ == "__main__":
    raise SystemExit(main())
