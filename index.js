const fs = require('fs');
const { OpenAI } = require('openai');

// Connect to your local RTX 3060 via Ollama
const ollama = new OpenAI({
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama', 
});

// =====================================================================
// STEP 1: THE DATA INGESTION ENGINE (MOCK MODE)
// =====================================================================
async function getAlertData() {
    console.log("📡 Fetching Vulnerability Data from Mock File...");
    const mockData = fs.readFileSync('./mock_alert.json', 'utf8');
    return JSON.parse(mockData);
}

// =====================================================================
// STEP 2: THE AI SOC PIPELINE (QWEN -> LLAMA)
// =====================================================================
async function runSOCPipeline() {
    try {
        // 1. Get the data 
        const alertData = await getAlertData();
        
        // Extract variables dynamically 
        const agentName = alertData.agent.name;
        const packageName = alertData.data.vulnerability.package.name;
        const cve = alertData.data.vulnerability.cve || "CVE-2024-1086";

        console.log(`🚨 Ingesting Alert for: ${agentName} | Target: ${packageName}`);
        console.log("\n🧠 Waking up Architect (Qwen 2.5 Coder 14B)...");
        
        // 2. The Architect Strategy
        const architectPrompt = `You are an autonomous Level 3 SOC Architect. Read the provided Wazuh vulnerability alert for agent '${agentName}'.
        
        Your tasks:
        1. Analyze the CVE and identify the necessary package updates.
        2. Delegate the task of writing a bash script to the Worker.
        3. The Worker MUST create a file named patch_${cve}.sh containing the bash commands to update the ${packageName} package and reboot the system.
        
        CRITICAL: Do not write the script yourself. Output a strict set of instructions for the Worker agent.`;

        const architectResponse = await ollama.chat.completions.create({
            model: 'qwen2.5-coder:14b',
            messages: [{ role: 'system', content: architectPrompt }],
            extra_body: { keep_alive: "30s" } // Clear VRAM after 30 seconds
        });

        const architectPlan = architectResponse.choices[0].message.content;
        console.log("\n📋 Architect's Plan formulated. Passing to Worker...");

        console.log("\n⚡ Waking up Worker (Llama 3.1 8B)...");

        // 3. The Worker Execution
        const workerPrompt = `You are a DevOps Worker. Execute this plan from the Architect exactly as written:\n\n${architectPlan}\n\nCRITICAL: Output ONLY the raw bash script code. Do not use markdown code blocks (\`\`\`). Do not add explanations. Just the raw bash commands.`;

        const workerResponse = await ollama.chat.completions.create({
            model: 'llama3.1:8b',
            messages: [{ role: 'user', content: workerPrompt }],
            extra_body: { keep_alive: "30s" }
        });

        // Regex cleaner to strip any AI chit-chat
        let bashCode = workerResponse.choices[0].message.content;
        bashCode = bashCode.replace(/```bash\n?/g, '').replace(/```/g, '').trim();

        // 4. File Write (The Physical Action)
        console.log("\n💾 Executing file_write tool...");
        const fileName = `./patch_${cve}.sh`;
        fs.writeFileSync(fileName, bashCode);
        console.log(`✅ SUCCESS: ${fileName} has been generated and saved to your drive!`);

    } catch (error) {
        console.error("\n❌ Pipeline Crashed:", error.message);
    }
}

// Fire the weapon
runSOCPipeline();