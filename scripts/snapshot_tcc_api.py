"""Grava em JSON as respostas da API do dashboard do TCC (Data Warehouse Financeiro), para a versão estática.

Precisa da API do TCC rodando em http://localhost:3001 (repositório privado do TCC: `node backend/src/server.js`).
Só dados públicos (CVM e cotações); nenhuma credencial passa por aqui.

    uv run python scripts/snapshot_tcc_api.py
"""
import json
import urllib.parse
import urllib.request
from pathlib import Path

API = "http://localhost:3001/api"
SAIDA = Path(__file__).resolve().parents[1] / "projetos" / "tcc_dw_financeiro" / "app" / "dados"
ANOS = range(2018, 2026)


def get(caminho, **params):
    q = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
    with urllib.request.urlopen(f"{API}{caminho}{'?' + q if q else ''}", timeout=60) as r:
        return json.loads(r.read())


def gravar(nome, dados):
    (SAIDA / nome).write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def main():
    SAIDA.mkdir(parents=True, exist_ok=True)
    empresas = get("/empresas")
    gravar("empresas.json", empresas)
    gravar("r2-modelos.json", get("/r2-modelos"))
    gravar("validacao-preco.json", get("/validacao-preco"))
    gravar("dashboard-executivo.json", {"todos": get("/dashboard-executivo"), **{str(a): get("/dashboard-executivo", ano=a) for a in ANOS}})
    gravar("ranking.json", {"todos": get("/ranking"), **{str(a): get("/ranking", ano=a) for a in ANOS}})
    gravar("indicadores.json", {"todos": get("/indicadores")} | {e["ticker"]: get("/indicadores", ticker=e["ticker"]) for e in empresas})
    gravar("mercado.json", {e["ticker"]: get("/mercado", ticker=e["ticker"]) for e in empresas})
    gravar("projecoes.json", {e["ticker"]: get("/projecoes", ticker=e["ticker"]) for e in empresas})
    gravar("preco-projetado.json", {e["ticker"]: get("/preco-projetado", ticker=e["ticker"]) for e in empresas})
    for p in sorted(SAIDA.glob("*.json")):
        print(f"{p.name}: {p.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
