from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class Genre(str, Enum):
    TERROR = "terror"
    FICCAO_CIENTIFICA = "ficcao_cientifica"
    FANTASIA = "fantasia"
    DRAMA = "drama"
    ROMANCE = "romance"
    MISTERIO = "misterio"
    SUSPENSE = "suspense"


class TargetAudience(str, Enum):
    INFANTIL = "infantil"
    YOUNG_ADULT = "young_adult"
    ADULTO = "adulto"


class AuthorStyle(str, Enum):
    ZAFON = "Carlos Ruiz Zafón"
    LOVECRAFT = "H.P. Lovecraft"
    TOLKIEN = "J.R.R. Tolkien"
    KING = "Stephen King"
    CHRISTIE = "Agatha Christie"
    ASIMOV = "Isaac Asimov"
    MACHADO = "Machado de Assis"
    CLARICE = "Clarice Lispector"


class StoryRequest(BaseModel):
    plot: str = Field(
        ...,
        min_length=50,
        max_length=2000,
        description="Plot inicial do conto (50-2000 caracteres)"
    )
    author_style: AuthorStyle = Field(
        ...,
        description="Estilo literário do autor de referência"
    )
    genre: Genre = Field(
        ...,
        description="Gênero literário do conto"
    )
    target_audience: TargetAudience = Field(
        ...,
        description="Público-alvo do conto"
    )
    word_count_target: int = Field(
        default=10000,
        ge=5000,
        le=15000,
        description="Número alvo de palavras (5000-15000)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "plot": "Um jovem bibliotecário descobre um livro amaldiçoado que revela segredos sombrios sobre sua cidade.",
                "author_style": "Carlos Ruiz Zafón",
                "genre": "terror",
                "target_audience": "adulto",
                "word_count_target": 10000
            }
        }
