document.addEventListener('DOMContentLoaded', () => {
    // --- V7 ENGINE CONFIGURATION ---
    const ENGINE_VERSION = "7.3";
    let apiKey = localStorage.getItem('geminiApiKey');

    // --- STATE MANAGEMENT (The "Save File") ---
    const gameState = {
        location: {
            hub: 'hub_lily_residence',
            local: 'loc_lily_bedroom'
        },
        tanks: {
            vitality: 100,
            composure: 80,
            sync: 45
        },
        attributes: {
            will: 3,
            grace: 4,
            wit: 6,
            heart: 5,
            flair: 2
        },
        matrix: {
            intent: 'ENGAGE',
            stance: 'NEUTRAL'
        },
        clothing: {
            outfit_id: 'item_body_onesie', // Starting outfit
            exposure: 0,
            comfort: 10
        },
        time: {
            turn: 1,
            display: "08:00 AM"
        }
    };

    // --- DATABASE (From your V7 Docs) ---
    const LOCATION_DB = {
        'hub_lily_residence': {
            name: "Lily's Residence (Unit 2B)",
            desc: "A modern, sterile space. 'Landlord Special' grey walls. A blank canvas.",
            tags: ["SAFE_ZONE", "TEMP_CONTROLLED", "PRIVATE"],
            locals: {
                'loc_lily_bedroom': { name: "Bedroom", desc: "A space designed for rest. Slate grey upholstery. Large window overlooking the lake." },
                'loc_lily_closet': { name: "Closet", desc: "The Armory. The divide between 'Eli' and 'Lily'." },
                'loc_lily_bathroom': { name: "Bathroom", desc: "Clinical white tile. Unforgiving vanity lighting." }
            }
        },
        'hub_mitch_residence': {
            name: "Mitch's Unit (Unit 2A)",
            desc: "Heavy wood, dark leather. The Bear's Den.",
            tags: ["SAFE_ZONE", "ALLY_HUB", "WARM"],
            locals: {
                'loc_mitch_living': { name: "Living Room", desc: "The Council Chamber." }
            }
        }
    };

    const NPC_DB = {
        'npc_mitch': {
            name: "Mitch",
            role: "The Anchor",
            archetype: "Guardian Bear",
            desc: "6'4, heavy muscle, full beard. Uses 'thumbs up' for approval. Protective.",
            stats: { trust: 50 }
        },
        'npc_ashley': {
            name: "Ashley",
            role: "The Chaos Engine",
            archetype: "Streamer/Hacker",
            desc: "Red curly hair, glasses, manic energy. Analytical and chaotic.",
            stats: { affinity: 40 }
        }
    };

    // --- DOM ELEMENTS ---
    const ui = {
        narrative: document.getElementById('narrative-output'),
        promptInput: document.getElementById('prompt-input'),
        sendBtn: document.getElementById('send-prompt'),
        stats: {
            vit: document.querySelector('#stat-vitality .bar-fill'),
            cmp: document.querySelector('#stat-composure .bar-fill'),
            snc: document.querySelector('#stat-sync .bar-fill'),
            vitVal: document.querySelector('#stat-vitality .stat-value'),
            cmpVal: document.querySelector('#stat-composure .stat-value'),
            sncVal: document.querySelector('#stat-sync .stat-value'),
            will: document.querySelector('#stat-will .hex-val'),
            grace: document.querySelector('#stat-grace .hex-val'),
            wit: document.querySelector('#stat-wit .hex-val'),
            heart: document.querySelector('#stat-heart .hex-val'),
            flair: document.querySelector('#stat-flair .hex-val'),
        },
        matrix: {
            intentDisplay: document.getElementById('active-intent-display'),
            stanceDisplay: document.getElementById('active-stance-display'),
            intentBtns: document.querySelectorAll('.intent-btn'),
            stanceBtns: document.querySelectorAll('.stance-btn')
        }
    };

    // --- INITIALIZATION ---
    function init() {
        updateUI();
        setupMatrixListeners();
        
        // Initial narrative push if API key exists
        if(apiKey) {
            // Wait for user first input or trigger intro?
            // ui.narrative.innerHTML += `<p>System Ready. Waiting for Pilot Input...</p>`;
        }
    }

    // --- UI UPDATER ---
    function updateUI() {
        // Update Tanks
        ui.stats.vit.style.width = `${gameState.tanks.vitality}%`;
        ui.stats.vitVal.textContent = gameState.tanks.vitality;
        
        ui.stats.cmp.style.width = `${gameState.tanks.composure}%`;
        ui.stats.cmpVal.textContent = gameState.tanks.composure;
        
        ui.stats.snc.style.width = `${gameState.tanks.sync}%`;
        ui.stats.sncVal.textContent = gameState.tanks.sync;

        // Update Attributes
        ui.stats.will.textContent = gameState.attributes.will;
        ui.stats.grace.textContent = gameState.attributes.grace;
        ui.stats.wit.textContent = gameState.attributes.wit;
        ui.stats.heart.textContent = gameState.attributes.heart;
        ui.stats.flair.textContent = gameState.attributes.flair;

        // Update Matrix Display
        ui.matrix.intentDisplay.textContent = `INTENT: ${gameState.matrix.intent}`;
        ui.matrix.stanceDisplay.textContent = `STANCE: ${gameState.matrix.stance}`;
    }

    // --- MATRIX LOGIC ---
    function setupMatrixListeners() {
        ui.matrix.intentBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                ui.matrix.intentBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                gameState.matrix.intent = btn.dataset.value;
                updateUI();
            });
        });

        ui.matrix.stanceBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                ui.matrix.stanceBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                gameState.matrix.stance = btn.dataset.value;
                updateUI();
            });
        });
    }

    // --- CONTEXT BUILDER (The "Prompt Engineer") ---
    function buildSystemContext() {
        const loc = LOCATION_DB[gameState.location.hub];
        const subLoc = loc.locals[gameState.location.local];
        
        // Construct the V7 System Prompt
        return `
# IDENTITY: DELILAH (The Executive Partner)
You are Delilah, the Narrative Architect for "Lily's Life V7". 
Tone: Sardonic, intelligent, warm, "After-Hours Executive".
User is "The Pilot". Lily is "The Vehicle".

# CURRENT STATE
- Location: ${loc.name} - ${subLoc.name}
- Atmosphere: ${subLoc.desc}
- Global Tags: ${loc.tags.join(', ')}

# THE TANKS (V7 Mechanics)
- Vitality: ${gameState.tanks.vitality}/100 (Physical Energy)
- Composure: ${gameState.tanks.composure}/100 (Social Health)
- Synchronization: ${gameState.tanks.sync}/100 (Pilot Connection)

# THE PENTAGRAM
[WILL:${gameState.attributes.will}] [GRACE:${gameState.attributes.grace}] [WIT:${gameState.attributes.wit}] [HEART:${gameState.attributes.heart}] [FLAIR:${gameState.attributes.flair}]

# TASK
The Pilot has submitted an action. 
1. Analyze the Intent (${gameState.matrix.intent}) and Stance (${gameState.matrix.stance}).
2. Determine outcome based on stats.
3. Narrate the result in 2-3 paragraphs. Focus on sensory details (The Hummingbird Protocol).
4. Provide 3 options for the next turn.
        `;
    }

    // --- ACTION HANDLER ---
    ui.sendBtn.addEventListener('click', async () => {
        const input = ui.promptInput.value.trim();
        if (!apiKey) {
            alert("Please set your API Key in settings first.");
            return;
        }

        // Visual Feedback
        const userAction = `> [${gameState.matrix.intent} / ${gameState.matrix.stance}] ${input}`;
        ui.narrative.innerHTML += `<p style="color:var(--color-sync); opacity:0.8;">${userAction}</p>`;
        ui.narrative.scrollTop = ui.narrative.scrollHeight;
        ui.promptInput.value = '';

        // Call Gemini
        try {
            const systemPrompt = buildSystemContext();
            const fullPrompt = `${systemPrompt}\n\nPLAYER INPUT: ${input}`;
            
            const genAI = new window.GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            
            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();

            // Simple Markdown parsing for formatting
            const formattedText = text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>');

            ui.narrative.innerHTML += `<div class="ai-response">${formattedText}</div>`;
            ui.narrative.scrollTop = ui.narrative.scrollHeight;
            
        } catch (error) {
            ui.narrative.innerHTML += `<p style="color:red;">Error: ${error.message}</p>`;
        }
    });

    // --- SETTINGS (Simplified) ---
    const saveKeyBtn = document.getElementById('save-api-key');
    if(saveKeyBtn) {
        saveKeyBtn.addEventListener('click', () => {
            const key = document.getElementById('api-key-input').value;
            localStorage.setItem('geminiApiKey', key);
            apiKey = key;
            alert("API Key Saved. System Online.");
        });
    }

    // Run Init
    init();
});