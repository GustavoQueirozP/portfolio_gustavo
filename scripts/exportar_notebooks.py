"""Executa os três notebooks (limite total de 600 s por notebook) e publica HTML.

Execute com uv run python scripts/exportar_notebooks.py. Os caminhos de entrada
legados são convertidos para relativos; nenhuma análise é alterada. A instalação
interativa de pacotes é omitida da cópia temporária: use uv sync antes de exportar.
"""

import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NOTEBOOKS = (
    ("analise_formula1", "analise_formula1.ipynb"),
    ("analise_ifood", "analise_ifood.ipynb"),
    ("analise_vendas_python", "analise_vendas_ecommerce.ipynb"),
)


def export(folder, filename):
    directory = ROOT / "projetos" / folder
    source = directory / filename
    notebook = json.loads(source.read_text(encoding="utf-8"))
    changed = False
    for cell in notebook["cells"]:
        if cell["cell_type"] != "code":
            continue
        old = "".join(cell["source"])
        new = re.sub(r'(?i)C:(?:/|\\)+Users[^\r\n"\']*?projetos(?:/|\\)+' + re.escape(folder), ".", old)
        if new != old:
            cell["source"] = new.splitlines(keepends=True)
            changed = True
    if changed:
        source.write_text(json.dumps(notebook, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"{folder}: caminhos de entrada tornados relativos", flush=True)

    # O ambiente já é provisionado pelo uv; não instalar pacotes durante a análise.
    notebook["cells"] = [cell for cell in notebook["cells"] if not re.match(
        r"^\s*(?:%|!)?pip\s+install\b", "".join(cell["source"]))]
    env = {**os.environ, "PYTHONIOENCODING": "utf-8", "PYTHONWARNINGS": "ignore",
           "MPLBACKEND": "module://matplotlib_inline.backend_inline"}
    with tempfile.TemporaryDirectory(prefix=".export-", dir=directory) as temp:
        working = Path(temp)
        # nbconvert inicia o kernel na pasta do arquivo de entrada.
        prepared = directory / f"{working.name}.ipynb"
        try:
            prepared.write_text(json.dumps(notebook, ensure_ascii=False), encoding="utf-8")
            subprocess.run([
                sys.executable, "-m", "jupyter", "nbconvert", "--execute", "--to", "html",
                "--ExecutePreprocessor.timeout=600", "--ExecutePreprocessor.kernel_name=python3",
                "--output=notebook", f"--output-dir={working}", str(prepared),
            ], cwd=directory, env=env, check=True, timeout=600)
        finally:
            prepared.unlink(missing_ok=True)
        html = (working / "notebook.html").read_text(encoding="utf-8")
        # Saídas de gráficos do nbconvert nem sempre trazem alternativa textual.
        def image_alt(match):
            tag = match.group(0)
            if re.search(r'\balt\s*=\s*["\'][^"\']+[^\s"\']["\']', tag):
                return tag
            tag = re.sub(r'\s+alt\s*=\s*(?:"[^"]*"|\'[^\']*\')', "", tag)
            return tag.replace("<img", '<img alt="Gráfico gerado pela célula; consulte os dados e o código adjacentes"', 1)
        html = re.sub(r"<img\b[^>]*>", image_alt, html, flags=re.IGNORECASE)
        footer = '<footer><p><a href="index.html">Voltar ao estudo de caso</a> · Design: <a href="https://html5up.net">HTML5 UP</a></p></footer>'
        html = html.replace("</body>", footer + "\n</body>")
        (directory / "notebook.html").write_text(html, encoding="utf-8")
    print(f"{folder}/notebook.html exportado", flush=True)


def main():
    failed = []
    for folder, filename in NOTEBOOKS:
        try:
            export(folder, filename)
        except (subprocess.SubprocessError, OSError) as error:
            print(f"Falha em {folder}: {error}", file=sys.stderr)
            failed.append(folder)
    return bool(failed)


if __name__ == "__main__":
    raise SystemExit(main())
