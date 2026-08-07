# 🩸 Project Hunt (v2.0.0) - Survival Horror 3D Assimétrico 1v4

**Project Hunt** é um jogo de terror assimétrico em 3D (WebGL / Three.js) onde você controla o **Assassino** em primeira pessoa e caça 4 **Sobreviventes** controlados por Inteligência Artificial (FSM) antes que reparem os 5 geradores e abram os portões de saída.

Inspirado em jogos como *Dead by Daylight*, *Friday the 13th* e *Identity V*.

---

## 🎮 Controles do Assassino

- <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>: Mover o Assassino (Velocidade: 4.6 m/s).
- <kbd>Mouse</kbd>: Olhar em 1ª pessoa (Trava o ponteiro com PointerLock API).
- <kbd>Clique Esquerdo</kbd>: Ataque de lâmina.
  - **1º Golpe**: Deixa o sobrevivente **Ferido**.
  - **2º Golpe**: Deixa o sobrevivente **Caído** no chão.
- <kbd>E</kbd>: Interagir:
  - **Carregar**: Pega um sobrevivente caído no chão e o carrega no ombro.
  - **Colocar no Gancho**: Pendura o sobrevivente em um dos 8 Ganchos de Sacrifício.
  - **Mori (Execução Instantânea)**: Se o sobrevivente já foi pendurado no gancho 2 vezes (`Hook Count >= 2`), aperte <kbd>E</kbd> sobre ele caído para executá-lo instantaneamente!
- <kbd>Espaço</kbd>: Destruir Pallets de madeira derrubados / Salto em Janelas.
- <kbd>P</kbd> ou <kbd>Esc</kbd>: Pausar partida.

---

## ⚙️ Regras do Jogo & GDD (v1.0)

- **Objetivo do Assassino**: Eliminar todos os 4 sobreviventes antes que eles escapem.
- **Objetivo dos Sobreviventes (IA)**: Reparar 5 Geradores ➔ Energizar os 2 Portões de Saída ➔ Escapar.
- **Skill Checks & Explosões**: Quando os sobreviventes falham no teste de habilidade durante o reparo de um gerador, uma notificação visual vermelha com aviso sonoro é enviada para a tela do Assassino!

---

## 🔄 Sistema de Controle de Versão e Rollback (Git Tags)

Este repositório possui duas marcas de versão estáveis salvas no Git:
- **`v1.0.0-arcade`**: Jogo 2D Arcade Space Shooter inicial.
- **`v2.0.0-project-hunt`**: Jogo 3D de Terror Assimétrico 1v4 (Project Hunt).

### Comandos de Rollback:
```bash
# Alternar para o jogo 2D arcade:
git checkout v1.0.0-arcade

# Voltar para o Project Hunt 3D:
git checkout v2.0.0-project-hunt

# Descartar alterações locais não salvas:
git reset --hard HEAD
```

---

## 🚀 Como Fazer o Upload para o GitHub & GitHub Pages

Para publicar este jogo online e permitir que qualquer pessoa jogue via navegador:

```bash
cd C:\Users\Aluno\Documents\GitHub\jogo

# 1. Adicionar e comitar arquivos
git add .
git commit -m "feat: versão final Project Hunt 3D (GDD 1v4)"

# 2. Enviar a tag da versão
git tag -a v2.0.0-project-hunt -m "Versao 2.0.0 Project Hunt 3D"

# 3. Enviar para o repositório remoto (Substitua pela sua URL do GitHub)
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSISTORIO.git
git branch -M main
git push -u origin main --tags
```

### Como Ativar no GitHub Pages
1. Acesse o seu repositório no GitHub.
2. Vá em **Settings** > **Pages**.
3. Em **Source**, selecione a branch `main` e a pasta `/ (root)`.
4. Clique em **Save**. Seu jogo estará online em instantes no link `https://SEU-USUARIO.github.io/SEU-REPOSISTORIO/`.

---

*Desenvolvido em HTML5, Three.js WebGL & Vanilla JS.*
