# 🚀 Quick Start - Literary Agent System

## Pré-requisitos

- Docker e Docker Compose instalados
- API Key da Anthropic ([obtenha aqui](https://console.anthropic.com/))

## Setup em 3 Passos

### 1. Configure a API Key

```bash
# Copie o template
cp .env.example .env

# Edite o arquivo .env e adicione sua API key
nano .env  # ou use seu editor preferido
```

No arquivo `.env`, substitua:
```
ANTHROPIC_API_KEY=your-api-key-here
```

Por:
```
ANTHROPIC_API_KEY=sk-ant-api03-...  # Sua key real
```

### 2. Inicie os Serviços

```bash
docker-compose up -d
```

Isso vai iniciar:
- **PostgreSQL** (porta 5432)
- **Redis** (porta 6379)
- **Backend FastAPI** (porta 8000)
- **Frontend Next.js** (porta 3000)

### 3. Acesse a Aplicação

Abra seu navegador em:
```
http://localhost:3000
```

## Verificando se Funciona

### Check 1: Backend Health
```bash
curl http://localhost:8000/
```

Deve retornar:
```json
{
  "status": "healthy",
  "app": "Literary Agent System",
  "version": "1.0.0"
}
```

### Check 2: API Docs
Acesse: http://localhost:8000/docs

Você verá a documentação interativa do FastAPI (Swagger UI)

### Check 3: Frontend
Acesse: http://localhost:3000

Deve carregar o formulário de criação de contos

## Testando a Geração de Contos

1. Acesse http://localhost:3000
2. Preencha o formulário:
   - **Plot**: "Um bibliotecário descobre um livro amaldiçoado que revela segredos sombrios sobre sua cidade"
   - **Estilo**: Carlos Ruiz Zafón
   - **Gênero**: Terror
   - **Público**: Adulto
   - **Palavras**: 10000
3. Clique em "Gerar Conto"
4. Observe o progresso em tempo real
5. Aguarde ~5-15 minutos para o conto completo

## Logs e Debug

### Ver logs de todos os serviços
```bash
docker-compose logs -f
```

### Ver logs apenas do backend
```bash
docker-compose logs -f backend
```

### Ver logs do frontend
```bash
docker-compose logs -f frontend
```

### Entrar no container do backend
```bash
docker exec -it literary_backend bash
```

## Comandos Úteis

### Parar todos os serviços
```bash
docker-compose down
```

### Reiniciar apenas o backend (após mudanças)
```bash
docker-compose restart backend
```

### Limpar tudo (dados também)
```bash
docker-compose down -v
```

### Rebuild após mudanças no código
```bash
docker-compose up -d --build
```

## Troubleshooting

### Erro: "Cannot connect to Redis"
```bash
# Verifique se Redis está rodando
docker-compose ps

# Reinicie Redis
docker-compose restart redis
```

### Erro: "Database connection failed"
```bash
# Verifique se PostgreSQL está rodando
docker-compose ps

# Reinicie PostgreSQL
docker-compose restart postgres
```

### Erro: "Anthropic API key not set"
```bash
# Verifique se o .env existe e tem a key
cat .env | grep ANTHROPIC_API_KEY

# Reconfigure e reinicie
docker-compose down
# Edite .env
docker-compose up -d
```

### Frontend não carrega
```bash
# Reinstale dependências
docker-compose exec frontend npm install

# Reinicie frontend
docker-compose restart frontend
```

## Estrutura de Portas

| Serviço | Porta | URL |
|---------|-------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 8000 | http://localhost:8000 |
| API Docs | 8000 | http://localhost:8000/docs |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |

## Próximos Passos

Após o sistema estar rodando:

1. Leia o [README.md](README.md) completo para entender a arquitetura
2. Explore os agentes em `backend/.claude/agents/`
3. Customize prompts dos agentes conforme necessário
4. Veja logs para entender o fluxo de execução
5. Ajuste configurações em `backend/.env` (max iterations, timeouts, etc.)

## Suporte

- **Issues**: https://github.com/seu-usuario/literary-agent-system/issues
- **Documentação**: [README.md](README.md)
- **Logs**: `docker-compose logs -f`

---

**Pronto!** 🎉 O sistema está rodando e você pode começar a gerar contos literários com IA multi-agente!
