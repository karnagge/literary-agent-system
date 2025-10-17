# 📚 Literary Agent System - Sistema Multi-Agente para Geração de Contos

Sistema de geração de contos literários de alta qualidade (até 10.000 palavras) usando múltiplos agentes Claude orquestrados. O sistema implementa um pipeline completo de escrita criativa com validação, revisão e refinamento iterativo até alcançar coerência narrativa e qualidade literária profissional.

## ✨ Características

- **8 Agentes Especializados** coordenados por um orchestrator master
- **Validação Rigorosa** - sistema não para até que o conto esteja perfeito
- **Múltiplos Estilos de Autores** - Zafón, Lovecraft, Tolkien, King, e mais
- **Interface Web Interativa** com progresso em tempo real
- **Suporte para Múltiplos Gêneros** - Terror, Ficção Científica, Fantasia, Drama, etc.
- **Iteração Automática** - refina o conto até atingir qualidade >= 8/10

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    WEB INTERFACE                         │
│  [Input Plot] [Author Style] [Genre] [Target Audience]  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              ORCHESTRATOR AGENT                          │
│  Coordena todo o pipeline de geração                     │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌───────────────┐         ┌──────────────────┐
│  GENERATION   │         │   VALIDATION     │
│    AGENTS     │◄────────┤     AGENTS       │
└───────────────┘         └──────────────────┘
```

### Agentes Especializados

1. **Orchestrator** - Coordenador master do sistema
2. **Plot Architect** - Cria estrutura narrativa em 3 atos
3. **Character Designer** - Desenvolve personagens complexos
4. **Style Master** - Analisa e replica estilo de autores
5. **Writer** - Escreve a prosa do conto
6. **Consistency Validator** - Detecta plot holes e inconsistências
7. **Literary Critic** - Avalia qualidade (mínimo 8/10)
8. **Editor** - Implementa correções e refinamentos

## 🚀 Quick Start

### Pré-requisitos

- Docker e Docker Compose
- Conta Anthropic com API key
- Git

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/literary-agent-system.git
cd literary-agent-system
```

2. **Configure variáveis de ambiente**
```bash
cp backend/.env.example backend/.env
# Edite backend/.env e adicione sua ANTHROPIC_API_KEY
```

3. **Inicie os serviços**
```bash
docker-compose up -d
```

4. **Acesse a aplicação**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Desenvolvimento Local (sem Docker)

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure .env
cp .env.example .env
# Edite .env com suas configurações

# Inicie PostgreSQL e Redis localmente
# Rode migrations
alembic upgrade head

# Inicie o servidor
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📖 Como Usar

### 1. Via Interface Web

1. Acesse http://localhost:3000
2. Preencha o formulário:
   - **Plot**: Descreva sua ideia inicial (50-2000 caracteres)
   - **Estilo de Autor**: Escolha o autor de referência
   - **Gênero**: Selecione o gênero literário
   - **Público-Alvo**: Infantil, Young Adult ou Adulto
   - **Palavras**: Número alvo (5.000-15.000)
3. Clique em "Gerar Conto"
4. Acompanhe o progresso em tempo real
5. Receba o conto final quando todos os agentes aprovarem

### 2. Via API

```bash
curl -X POST "http://localhost:8000/api/stories/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "plot": "Um bibliotecário descobre um livro amaldiçoado que revela segredos sombrios.",
    "author_style": "Carlos Ruiz Zafón",
    "genre": "terror",
    "target_audience": "adulto",
    "word_count_target": 10000
  }'
```

### 3. Monitoramento em Tempo Real

Conecte via WebSocket para receber atualizações:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/session_id');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Status:', update.status);
  console.log('Agent:', update.current_agent);
  console.log('Progress:', update.iteration, '/', update.max_iterations);
};
```

## 🎯 Pipeline de Geração

### Fase 1: Planning (Paralelo)
- Plot Architect cria estrutura de 3 atos
- Character Designer desenvolve personagens
- Style Master analisa estilo do autor

### Fase 2: Writing
- Writer gera draft inicial usando outputs da Fase 1

### Fase 3: Validation Loop (Iterativo)
```
while não_aprovado and iterações < 10:
    1. Consistency Validator verifica plot holes
    2. Literary Critic avalia qualidade (todas dimensões >= 8/10)

    if problemas_encontrados:
        3. Editor implementa correções
        4. volta para step 1
    else:
        APROVADO - retorna conto final
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Anthropic API
ANTHROPIC_API_KEY=sk-ant-api03-...

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/literary_db
REDIS_URL=redis://localhost:6379/0

# Agent Configuration
MAX_AGENT_ITERATIONS=10      # Máximo de ciclos de refinamento
AGENT_TIMEOUT_SECONDS=1800   # Timeout por agente (30 min)
MIN_CRITIC_SCORE=8.0         # Nota mínima para aprovação
```

### Configuração dos Agentes

Os agentes são definidos em arquivos Markdown em `.claude/agents/`:

- `orchestrator.md` - Coordenador principal
- `plot-architect.md` - Estrutura narrativa
- `character-designer.md` - Personagens
- `style-master.md` - Análise de estilo
- `writer.md` - Escrita da prosa
- `consistency-validator.md` - Validação lógica
- `literary-critic.md` - Avaliação qualitativa
- `editor.md` - Refinamento

Você pode customizar os prompts editando esses arquivos.

## 📊 Critérios de Qualidade

O Literary Critic avalia o conto em 6 dimensões:

| Dimensão | Peso | Mínimo |
|----------|------|--------|
| Qualidade da Prosa | 1x | 8.0 |
| Desenvolvimento de Personagens | 1x | 8.0 |
| Estrutura Narrativa | 1x | 8.0 |
| Aderência ao Estilo | 1x | 8.0 |
| Impacto Emocional | 1x | 8.0 |
| Originalidade | 1x | 8.0 |

**Aprovação**: Todas dimensões >= 8.0 + sem plot holes críticos

## 🎨 Estilos de Autores Suportados

- **Carlos Ruiz Zafón**: Gótico, atmosférico, labiríntico, realismo mágico
- **H.P. Lovecraft**: Horror cósmico, vocabulário antiquário, narrador não-confiável
- **J.R.R. Tolkien**: Épico, mitológico, mundo detalhado
- **Stephen King**: Horror psicológico, personagens realistas, suspense
- **Agatha Christie**: Mistério, dedução lógica, reviravoltas
- **Isaac Asimov**: Ficção científica hard, exploração de ideias, prosa clara
- **Machado de Assis**: Ironia, realismo psicológico, análise social
- **Clarice Lispector**: Introspecção, fluxo de consciência, existencialismo

## 🧪 Testes

```bash
cd backend
pytest tests/ -v --cov=app
```

### Testes Incluídos

- ✅ Testes unitários de cada agente
- ✅ Testes de integração do pipeline completo
- ✅ Testes de validação (plot holes, inconsistências)
- ✅ Testes de avaliação crítica
- ✅ Testes de API endpoints
- ✅ Testes de WebSocket

## 📚 Estrutura do Projeto

```
literary-agent-system/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI application
│   │   ├── config.py                  # Settings
│   │   ├── api/routes/                # API endpoints
│   │   ├── models/                    # Pydantic models
│   │   ├── services/                  # Business logic
│   │   └── agents/                    # Agent wrappers
│   ├── .claude/agents/                # Agent prompts (8 agentes)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                       # Next.js app router
│   │   ├── components/                # React components
│   │   ├── hooks/                     # Custom hooks
│   │   └── lib/                       # Utilities
│   ├── package.json
│   └── Dockerfile
├── docs/
│   ├── architecture.md                # Arquitetura detalhada
│   ├── api_documentation.md           # API reference
│   └── agent_prompts.md               # Documentação dos agentes
├── tests/
│   ├── test_agents.py
│   └── test_story_generation.py
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 🔄 Workflow de Desenvolvimento

### Adicionando um Novo Agente

1. Crie o prompt em `.claude/agents/new-agent.md`
2. Defina responsabilidades, input/output format
3. Adicione ao orchestrator workflow
4. Implemente wrapper em `backend/app/agents/`
5. Adicione testes em `tests/test_agents.py`

### Adicionando um Novo Estilo de Autor

1. Adicione enum em `backend/app/models/story_request.py`
2. Crie análise de estilo em `style-master.md`
3. Documente características principais
4. Teste com exemplos reais

## 🐛 Troubleshooting

### Problema: Agentes entram em loop infinito

**Solução**: Verifique `MAX_AGENT_ITERATIONS` no `.env`. O sistema para após 10 iterações por padrão.

### Problema: Qualidade inconsistente entre gerações

**Solução**: Ajuste `MIN_CRITIC_SCORE` e revise prompts dos agentes. Considere adicionar exemplos específicos aos prompts.

### Problema: Context window exceeded

**Solução**: O sistema usa prompt caching automaticamente. Para contos muito longos (>15k palavras), considere dividir em capítulos.

### Problema: Alto custo de API

**Solução**:
- Use prompt caching (já habilitado)
- Considere usar Claude Haiku para agentes mais simples
- Limite `MAX_AGENT_ITERATIONS`
- Cache validações bem-sucedidas

## 📈 Métricas e Monitoramento

O sistema rastreia automaticamente:

- Taxa de aprovação no primeiro ciclo
- Média de iterações até aprovação
- Scores críticos médios por dimensão
- Tempo médio de geração
- Taxa de plot holes detectados

Acesse as métricas em: `http://localhost:8000/api/metrics`

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma feature branch (`git checkout -b feature/NovoAgente`)
3. Commit suas mudanças (`git commit -m 'Add: Novo agente X'`)
4. Push para a branch (`git push origin feature/NovoAgente`)
5. Abra um Pull Request

### Guidelines

- Mantenha prompts dos agentes concisos mas completos
- Adicione testes para novas features
- Documente mudanças significativas
- Siga convenções de código existentes
- Valide que contos gerados mantêm qualidade

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes

## 🙏 Créditos

- **Claude Agent SDK** by Anthropic
- **FastAPI** by Sebastián Ramírez
- **Next.js** by Vercel
- Inspirado nos trabalhos de Carlos Ruiz Zafón e outros grandes autores

## 📞 Suporte

- **Issues**: https://github.com/seu-usuario/literary-agent-system/issues
- **Discussions**: https://github.com/seu-usuario/literary-agent-system/discussions
- **Email**: seu-email@exemplo.com

---

**Nota**: Este sistema usa a API da Anthropic que tem custos associados. Monitore seu uso em https://console.anthropic.com/

Criado com ❤️ usando Claude Sonnet 4.5 e Multi-Agent Architecture
