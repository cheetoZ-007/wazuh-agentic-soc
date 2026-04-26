const fs = require('fs');
const { Agent } = require('open-multi-agent'); 

// =====================================================================
// STEP 1: THE DATA INGESTION ENGINE (MOCK MODE)
// =====================================================================
console.log("📡 Fetching Vulnerability Data from Mock File...");
const alertData = JSON.parse(fs.readFileSync('./mock_alert.json', 'utf8'));

const agentName = alertData.agent.name;
const packageName = alertData.data.vulnerability.package.name;
const cve = alertData.data.vulnerability.cve || "CVE-2024-1086";

console.log(`🚨 Ingesting Alert for: ${agentName} | Target: ${packageName}`);

// =====================================================================
// STEP 2: DEFINE THE AGENTS (PURE OMA FRAMEWORK)
// =====================================================================

// Shared configuration to route OMA to your local Ollama instance
const localLLMConfig = {
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama' // Required by the OpenAI adapter, ignored by Ollama
};

// 🧠 The Level 3 Architect
const architect = new Agent({
    name: 'SOC_Architect',
    model: 'qwen2.5-coder:14b',
    ...localLLMConfig,
    extraBody: { keep_alive: "30s" }, 
    systemPrompt: `You are an autonomous Level 3 SOC Architect. Read the provided Wazuh vulnerability alert for agent '${agentName}'.
    
    Your tasks:
    1. Analyze the CVE and identify the necessary package updates.
    2. Delegate the task of writing a bash script to the Worker.
    3. The Worker MUST create a file named patch_${cve}.sh containing the bash commands to update the ${packageName} package and reboot the system.
    
    CRITICAL: Do not write the script yourself. Output a strict set of instructions for the Worker agent.`
});

// ⚡ The DevOps Worker
const worker = new Agent({
    name: 'DevOps_Worker',
    model: 'llama3.1:8b',
    ...localLLMConfig,
    extraBody: { keep_alive: "30s" }, 
    systemPrompt: `You are a DevOps Worker. Execute the Architect's plan exactly as written.
    
    CRITICAL: Output ONLY the raw bash script code. Do not use markdown code blocks (\`\`\`). Do not add explanations. Just the raw bash commands.`
});

// =====================================================================
// STEP 3: RUN THE ORCHESTRATION PIPELINE
// =====================================================================
async function runPipeline() {
    try {
        console.log("\n🧠 Architect formulating mitigation strategy...");
        
        // 1. Pass the alert data to the Architect
        const architectPlan = await architect.run(`Analyze this vulnerability data: ${JSON.stringify(alertData)}`);
        console.log("\n📋 Plan formulated. Passing to Worker...");

        console.log("\n⚡ Worker drafting raw bash code...");
        
        // 2. Pass the plan to the Worker
        let bashCode = await worker.run(`Execute this plan: \n\n${architectPlan}`);
        
        // Regex cleaner to strip any AI chit-chat
        bashCode = bashCode.replace(/```bash\n?/g, '').replace(/```/g, '').trim();

        // 3. File Write (The Physical Action)
        console.log("\n💾 Executing file_write tool...");
        const fileName = `./patch_${cve}.sh`;
        fs.writeFileSync(fileName, bashCode);
        console.log(`✅ SUCCESS: ${fileName} has been generated and saved to your drive!`);

    } catch (error) {
        console.error("\n❌ Pipeline Crashed:", error.message || error);
    }
}

// Fire the weapon
runPipeline();