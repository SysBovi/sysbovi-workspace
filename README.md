# SYSBOVI - Plataforma de Gestão de Gado de Corte

<p align="center">
  <img src="https://exemplo.com/logo_unemat.png" alt="Logo UNEMAT" width="100">
  <br>
  <strong>Digital Cattle Intelligence</strong>
</p>

O **SYSBOVI** é uma plataforma **SaaS (Software as a Service)** idealizada para resolver a falta de controle zootécnico e financeiro no manejo de gado de corte. O foco do sistema é transformar a gestão empírica em uma operação baseada em dados, proporcionando previsibilidade financeira e otimização do lucro para pequenos e médios produtores.

## 📌 Visão Geral
O sistema gerencia o ciclo completo do gado, desde o desmame até o abate, oferecendo uma solução **Mobile-First** que elimina a dependência de cadernos de papel e planilhas complexas.

### Principais Diferenciais:
*   **Módulo AvaliaVenda:** Algoritmo que cruza dados de peso e custos para indicar o momento mais lucrativo para a venda.
*   **Gestão de Infraestrutura:** Controle de rodízio de pasto para evitar a degradação e superlotação.
*   **Baixa Automática de Estoque:** Integração entre o manejo sanitário/nutricional e o inventário da fazenda.

## 🛠️ Arquitetura do Sistema
O SYSBOVI utiliza uma arquitetura **Client-Server** orientada a serviços (API RESTful), garantindo escalabilidade e segurança via isolamento lógico de dados (**Multi-Tenancy**).

<p align="center">
  <img src="https://colab.google/static/images/notebooklm/visão_arquitetural.png" alt="Arquitetura do Sistema">
  <br>
  <em>Figura 1: Visão Arquitetural Inicial</em>
</p>

### Tecnologias e Segurança:
*   **Front-end:** PWA (Progressive Web App) focado em usabilidade no campo e Portal Web para administração.
*   **Autenticação:** Tokens **JWT** (JSON Web Tokens) e criptografia de senhas (Bcrypt/Argon2).
*   **Controle de Acesso:** Modelo **RBAC** (Role-Based Access Control) para diferentes níveis de permissão.

## 👥 Perfis de Usuário e Jornadas
O sistema adapta-se dinamicamente ao perfil do usuário autenticado.

| Perfil | Descrição |
| :--- | :--- |
| **Usuário Master (UP)** | Dono da fazenda com controle total e visão financeira. |
| **Usuário Comum (UC)** | Pequeno produtor no plano gratuito com foco em digitalização básica. |
| **Usuário Especialista (UE)** | Veterinários e capatazes focados no manejo operacional. |
| **Super Admin (UA)** | Equipe interna da Sysbovi para suporte e gestão do SaaS. |

<p align="center">
  <img src="https://colab.google/static/images/notebooklm/fluxo_master.png" alt="Fluxo Usuário Master" width="300">
  <img src="https://colab.google/static/images/notebooklm/fluxo_comum.png" alt="Fluxo Usuário Comum" width="300">
  <br>
  <em>Fluxos de Navegação por Perfil</em>
</p>

## 💰 Modelo de Negócio
A monetização é baseada em assinaturas recorrentes estruturadas em três níveis:
1.  **Plano Comum (Freemium):** Cadastro limitado de animais e funções básicas.
2.  **Plano Premium:** Cadastro ilimitado e acesso ao módulo financeiro **AvaliaVenda**.
3.  **Plano Empresarial (High-ticket):** Suporte multiusuário (RBAC) e dashboards consolidados para gestão de equipes.

## 🚀 Equipe de Desenvolvimento
Projeto desenvolvido para a disciplina de Desenvolvimento de Sistemas Web - UNEMAT.
*   **Fabiano Fernandes de Oliveira Pinto**
*   **Lucas Rodrigues de Paula**
*   **Marcus Vinicius Silva Dias**
*   **Matheus de Arruda Silva**
*   **Paula Martins Stolberg Fernandes**

---
**Docente:** Prof. Esp. Marlon Vinicius da Silva.
**Versão:** 1.0 (Março/2026).
