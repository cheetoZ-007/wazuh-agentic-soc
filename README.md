# wazuh-agentic-soc
An autonomous, multi-agent Security Operations Center using local LLMs (Qwen/Llama) to patch Wazuh vulnerabilities.


# Autonomous Local AI SOC Pipeline 🛡️🤖

A fully local, zero-cost, multi-agent Security Operations Center (SOC) framework. This pipeline ingests live CVE vulnerability alerts from a Wazuh SIEM, formulates a mitigation strategy using a Level 3 Architect Agent, and writes executable bash scripts using a DevOps Worker Agent.

All AI processing runs locally via Ollama, utilizing aggressive VRAM management to allow high-parameter LLM handoffs on a single consumer GPU.

## Features
* **100% Local Processing:** No data leaves your network. No OpenAI API costs.
* **Multi-Agent Orchestration:** * 🧠 **Architect (Qwen 2.5 14B):** Analyzes the vulnerability and creates a mitigation plan.
  *  **Worker (Llama 3.1 8B):** Writes the raw, deployable bash code.
* **Low VRAM Optimization:** Uses Ollama's `keep_alive: "30s"` parameter to instantly evict the 14B model before waking the 8B model, allowing complex pipelines on a standard 12GB RTX 3060.
* **Network Bypass Integration:** Includes notes on bridging isolated Homelab PCs to Corporate Subnets using Cloudflare Tunnels (HTTPS -> TCP 9200).

##  Quick Start (Mock Mode)
You can test the AI agent pipeline immediately without needing a live Wazuh server.

1. Ensure you have [Ollama](https://ollama.com/) installed and running.
2. Pull the required models:
   ```bash
   ollama run qwen2.5-coder:14b
   ollama run llama3.1:8b
