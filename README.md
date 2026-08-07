# ⚡ Cyber Defender - Jogo Web Arcade Sci-Fi

**Cyber Defender** é um jogo web arcade 2D retro-futurista construído com HTML5 Canvas e JavaScript puro. O projeto conta com arquitetura modular, sistema de partículas, gerador de som procedural via Web Audio API e é totalmente compatível com **GitHub Pages**.

---

## 🎮 Como Jogar

1. Abra o arquivo [`index.html`](file:///C:/Users/Aluno/Documents/GitHub/jogo/index.html) diretamente no seu navegador ou rode um servidor local (`npx serve .` ou Live Server).
2. **Controles**:
   - <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> ou <kbd>Setas</kbd>: Mover a nave.
   - <kbd>Espaço</kbd> ou <kbd>Clique Esquerdo</kbd>: Atirar.
   - <kbd>Shift</kbd>: Super Boost (Consome energia).
   - <kbd>P</kbd> ou <kbd>Esc</kbd>: Pausar / Retomar.

---

## 🔄 Sistema de Controle de Versão & Rollback (Como voltar uma versão)

Este repositório utiliza o **Git** para salvaguardar cada etapa do desenvolvimento. Se algo der errado durante o desenvolvimento ou personalização do seu GDD, você pode restaurar uma versão funcional facilmente:

### 1. Ver o Histórico de Versões / Commits
```bash
git log --oneline
```

### 2. Descartar edições não salvas (Voltar para o último commit limpo)
```bash
git reset --hard HEAD
```

### 3. Restaurar uma Tag de Versão Específica
```bash
git checkout v1.0.0
```

### 4. Marcar uma Nova Versão Estável (Tag)
```bash
git tag -a v1.1.0 -m "Descrição da nova versão"
```

---

## 🚀 Como Fazer o Upload para o GitHub & GitHub Pages

Para colocar o seu jogo online no GitHub para que qualquer pessoa possa jogar:

```bash
# 1. Adicionar todos os arquivos e comitar
git add .
git commit -m "feat: versão inicial do Cyber Defender pronta para publicação"

# 2. Conectar com o seu repositório no GitHub (Substitua a URL abaixo pela sua URL do GitHub)
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSISTORIO.git

# 3. Garantir a branch principal 'main' e enviar os arquivos
git branch -M main
git push -u origin main
```

### Como Ativar o GitHub Pages (Jogo Grátis Online)
1. Vá no seu repositório no GitHub.
2. Acesse **Settings (Configurações)** > **Pages**.
3. Em **Source**, selecione a branch `main` e a pasta `/ (root)`.
4. Clique em **Save**. Seu jogo estará online em alguns segundos no link: `https://SEU-USUARIO.github.io/SEU-REPOSISTORIO/`.

---

## 🛠️ Personalizando com o seu GDD

O código do jogo foi separado em módulos claros dentro de `src/js/`:
- `src/js/entities.js`: Contém as velocidades, vidas e danos das naves, armas e inimigos.
- `src/js/game.js`: Contém as regras do jogo, pontuações, ondas e taxas de spawn.
- `src/js/audio.js`: Sintetizador de efeitos sonoros.
- `src/js/particles.js`: Efeitos visuais e cores do espaço.

---

*Desenvolvido em HTML5 Canvas & Vanilla JS.*
