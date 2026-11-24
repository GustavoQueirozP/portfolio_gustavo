"""Formatação pt-BR independente do locale, usada pelos notebooks do portfólio."""

import math

import pandas as pd
from matplotlib.ticker import FuncFormatter, ScalarFormatter


def fmt_num(valor, casas=2):
    return f"{valor:,.{casas}f}".translate(str.maketrans({",": ".", ".": ","}))


def fmt_int(valor):
    return fmt_num(valor, 0)


def fmt_brl(valor):
    return f"R$ {fmt_num(valor, 2)}"


def fmt_pct(valor, casas=2):
    return f"{fmt_num(valor * 100, casas)}%"


def tabela_br(tabela, casas=2):
    """Preserva valores numéricos para cálculo; formata somente a apresentação."""
    formatos = {
        coluna: fmt_int if pd.api.types.is_integer_dtype(tipo) else lambda v: fmt_num(v, casas)
        for coluna, tipo in tabela.dtypes.items()
        if pd.api.types.is_numeric_dtype(tipo)
    }
    return tabela.style.format(formatos, na_rep="—")


def formatar_eixos(fig):
    """Localiza eixos numéricos, preservando datas e categorias já rotuladas."""
    def rotulo(valor, _):
        if not math.isfinite(valor):
            return ""
        texto = fmt_num(valor, 6).rstrip("0").rstrip(",")
        return "0" if texto == "-0" else texto

    for ax in fig.axes:
        for eixo in (ax.xaxis, ax.yaxis):
            if isinstance(eixo.get_major_formatter(), ScalarFormatter):
                eixo.set_major_formatter(FuncFormatter(rotulo))
