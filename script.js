// Email copy-to-clipboard
let emailCopiedNotificationTimeout = null;
document.getElementById('email-btn').addEventListener('click', () => {
    navigator.clipboard.writeText('luke@criswell.net').then(() => {
        const notice = document.getElementById('clipboard-notice');
        notice.classList.add('visible');
        if(emailCopiedNotificationTimeout)
            clearTimeout(emailCopiedNotificationTimeout);
        emailCopiedNotificationTimeout = setTimeout(() => notice.classList.remove('visible'), 4000);
    });
});

// Tag icons mapping
const tagIcons = {
    "java": "assets/icon-java.png",
    "c": "assets/icon-c.png",
    "cpp": "assets/icon-cpp.png",
    "csharp": "assets/icon-csharp.png",
    "python": "assets/icon-python.png",
    "spring-boot": "assets/icon-spring.png",
    "mccompiled": "assets/icon-mcc.png"
};

// State variable to store loaded projects
let loadedProjects = [];
let activeProjectId = null;

// DOM Elements
const projectTabsContainer = document.getElementById('project-tabs');
const projectDetailsContainer = document.getElementById('project-details');

/**
 * Initializes the personal website by triggering asynchronous loading of projects.
 */
async function init() {
    try {
        await loadProjects();
    } catch (error) {
        console.error('Initialization error:', error);
        showC64ErrorScreen();
    }
}

/**
 * Loads the project list and then fetches individual project configurations.
 */
async function loadProjects() {
    const response = await fetch('projectlist.json');
    if (!response.ok) {
        throw new Error('Failed to load projectlist.json');
    }
    
    const projectPaths = await response.json();
    
    // Fetch all project configurations in parallel
    const fetchPromises = projectPaths.map(async (path) => {
        try {
            const projectResponse = await fetch(path);
            if (!projectResponse.ok) {
                console.error(`Failed to fetch project from path: ${path}`);
                return null;
            }
            return await projectResponse.json();
        } catch (err) {
            console.error(`Error fetching project from path: ${path}`, err);
            return null;
        }
    });
    
    const projects = await Promise.all(fetchPromises);
    
    // Filter out any failed loads
    loadedProjects = projects.filter(proj => proj !== null);
    
    if (loadedProjects.length === 0) {
        throw new Error('No projects could be loaded');
    }
    
    // Build tabs and render the first project
    renderTabs();
    selectProject(loadedProjects[0].id);
}

/**
 * Renders the sidebar/topbar tabs for all loaded projects.
 */
function renderTabs() {
    projectTabsContainer.innerHTML = '';
    
    loadedProjects.forEach(project => {
        const tab = document.createElement('button');
        tab.className = 'project-tab-btn';
        tab.id = `tab-${project.id}`;
        tab.role = 'tab';
        tab.ariaSelected = 'false';
        tab.textContent = project.name.toUpperCase();
        
        tab.addEventListener('click', () => {
            selectProject(project.id);
        });
        
        projectTabsContainer.appendChild(tab);
    });
}

/**
 * Selects a project, updates active class, and populates the details card.
 */
function selectProject(projectId) {
    if (activeProjectId === projectId) return;
    
    // Find the project object
    const project = loadedProjects.find(p => p.id === projectId);
    if (!project) return;
    
    activeProjectId = projectId;
    
    // Update active state on tab buttons
    const tabs = projectTabsContainer.querySelectorAll('.project-tab-btn');
    tabs.forEach(tab => {
        if (tab.id === `tab-${projectId}`) {
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
        } else {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        }
    });
    
    // Apply dynamic project theme accent colors
    const [r, g, b] = project.color;
    projectDetailsContainer.style.setProperty('--project-accent', `rgb(${r}, ${g}, ${b})`);
    projectDetailsContainer.style.setProperty('--project-accent-alpha', `rgba(${r}, ${g}, ${b}, 0.15)`);
    
    // Render the project details
    renderProjectDetails(project);
}

/**
 * Renders the complete project details with support for safe custom HTML sections and links.
 */
function renderProjectDetails(project) {
    const [r, g, b] = project.color;
    
    // Build the Header (Title & Short Description)
    let detailsHTML = `
        <div class="details-header">
            <h3 class="details-project-name">${project.name}</h3>
            <p class="details-project-desc" style="color: rgb(${r}, ${g}, ${b})">${project.description}</p>
            <div class="details-project-tags">
    `;
    
    // Append tags with icons where available
    if (project.tags && project.tags.length > 0) {
        project.tags.forEach(tag => {
            const hasIcon = tagIcons[tag];
            detailsHTML += `
                <span class="project-tag-pill">
                    ${hasIcon ? `<img src="${hasIcon}" alt="${tag}" class="tag-pill-icon">` : ''}
                    ${tag}
                </span>
            `;
        });
    }
    
    detailsHTML += `
            </div>
        </div>
        <div class="details-body">
    `;
    
    // Render custom sections
    if (project.html && project.html.sections) {
        const sections = project.html.sections;
        
        for (const title in sections) {
            const content = sections[title];
            
            // Check for horizontal rule line command
            if (title.startsWith('_')) {
                if (content === 'hr') {
                    detailsHTML += `<hr class="retro-divider">`;
                }
                continue;
            }
            
            // Render section with heading (handling "feature: " prefix)
            let displayTitle = title;
            let isFeature = false;
            if (title.startsWith('feature:')) {
                displayTitle = title.replace('feature:', '').trim();
                isFeature = true;
            }
            
            detailsHTML += `
                <div class="details-section ${isFeature ? 'feature-section' : ''}">
                    <h4 class="details-section-heading">${displayTitle}</h4>
                    <div class="details-section-content">${content}</div>
                </div>
            `;
        }
    }
    
    detailsHTML += `</div>`;
    
    // Render flat, dynamic external link buttons
    if (project.html && project.html.links) {
        const links = project.html.links;
        detailsHTML += `<div class="details-links">`;
        
        for (const label in links) {
            const url = links[label];
            detailsHTML += `
                <!--suppress CssInvalidFunction -->
<a href="${url}" target="_blank" class="details-link-btn" style="--btn-color: rgb(${r}, ${g}, ${b}); --btn-hover-color: rgba(${r}, ${g}, ${b}, 0.15)">
                    ${label}
                </a>
            `;
        }
        
        detailsHTML += `</div>`;
    }
    
    // Inject the generated HTML behind a C64 tape-loading animation
    playC64TapeLoad(projectDetailsContainer, detailsHTML, [r, g, b]);
}

/* ------------------------------------------------------------------ *
 *  C64 TAPE-LOADING ANIMATION
 *  Emulates a Commodore 64 datasette loading a program:
 *    1. Screen "blanks" and pulses the classic colorful loader
 *       stripes (the border bars you saw while a tape loaded).
 *    2. The real content is injected but kept invisible.
 *    3. Text decodes in via a PETSCII glyph-scramble effect,
 *       resolving random glyphs into the final characters.
 *  Total runtime ~1 second.
 * ------------------------------------------------------------------ */

// Timing tokens for the effect (ms)
const C64_LOAD = {
    stripes: 500,   // duration of the colorful loader-bar phase
    decode: 600,    // duration of the glyph-scramble decode phase
    stripeStep: 50  // how fast a fresh stripe color is pushed on
};

// Pool of glyphs used while text is "still loading" (PETSCII-ish block art)
const C64_GLYPHS = '▚▞▓▒░█▄▀▐▌▛▜▙▟┼╳◤◥◣◢0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%*=+'.split('');

// The 16-color C64 hardware palette, used for the loader stripes
const C64_PALETTE = [
    '#000000', '#ffffff', '#883932', '#67b6bd', '#8b3f96', '#55a049',
    '#40318d', '#bfce72', '#8b5429', '#574200', '#b86962', '#505050',
    '#787878', '#94e089', '#7869c4', '#9f9f9f'
];

let c64LoadToken = 0; // guards against overlapping loads when tabs are clicked fast

/**
 * Runs the full tape-load sequence, then reveals the injected HTML.
 */
function playC64TapeLoad(container, html, accent) {
    const token = ++c64LoadToken; // invalidate any in-flight animation
    const [ar, ag, ab] = accent;

    container.scrollTop = 0;
    container.classList.add('c64-loading');

    // Build the colorful loader-bar overlay
    const overlay = document.createElement('div');
    overlay.className = 'c64-tape-overlay';
    overlay.innerHTML = `
        <div class="c64-tape-stripes"></div>
        <div class="c64-tape-readout">
            <span class="c64-tape-label">FOUND</span>
            <span class="c64-tape-name">${(html.match(/details-project-name">([^<]*)</) || [,'PROGRAM'])[1].toUpperCase()}</span>
            <span class="c64-tape-status blink-fast">LOADING</span>
            <span class="c64-tape-bytes" style="color: rgb(${ar}, ${ag}, ${ab})">$0000</span>
        </div>
    `;
    container.innerHTML = '';
    container.appendChild(overlay);

    const stripes = overlay.querySelector('.c64-tape-stripes');
    const bytes = overlay.querySelector('.c64-tape-bytes');

    // Phase 1: pump fresh loader-bar colors + a rising byte counter
    const start = performance.now();
    const stripeTimer = setInterval(() => {
        if (token !== c64LoadToken) return clearInterval(stripeTimer);
        const c = C64_PALETTE[(Math.random() * C64_PALETTE.length) | 0];
        stripes.style.setProperty('--stripe-a', c);
        stripes.style.setProperty('--stripe-b', C64_PALETTE[(Math.random() * C64_PALETTE.length) | 0]);
        const progress = Math.min(1, (performance.now() - start) / C64_LOAD.stripes);
        bytes.textContent = '$' + Math.round(progress * 0x8000).toString(16).toUpperCase().padStart(4, '0');
    }, C64_LOAD.stripeStep);

    // Phase 2: swap in the real content and decode it in
    setTimeout(() => {
        if (token !== c64LoadToken) return;
        clearInterval(stripeTimer);

        container.innerHTML = html;
        container.scrollTop = 0;
        glyphDecode(container, token);

        // Drop the loading state once the decode finishes
        setTimeout(() => {
            if (token !== c64LoadToken) return;
            container.classList.remove('c64-loading');
        }, C64_LOAD.decode);
    }, C64_LOAD.stripes);
}

/**
 * Resolves every text node inside `root` from random PETSCII glyphs into
 * its final characters, left-to-right, like a program painting to screen.
 */
function glyphDecode(root, token) {
    // Collect text nodes (skip pure-whitespace) and remember their targets
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: n => n.nodeValue.trim().length
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT
    });

    const nodes = [];
    let totalChars = 0;
    let n;
    while ((n = walker.nextNode())) {
        const target = n.nodeValue;
        nodes.push({ node: n, target, start: totalChars });
        totalChars += target.length;
        n.nodeValue = ''; // hide content until the wave reaches it
    }
    if (!totalChars) return;

    const startTime = performance.now();

    function frame(now) {
        if (token !== c64LoadToken) return; // a newer load superseded us
        const progress = Math.min(1, (now - startTime) / C64_LOAD.decode);
        const revealHead = progress * totalChars;      // solid characters so far
        const scrambleWidth = Math.max(6, totalChars * 0.06); // fuzzy loading edge

        for (const item of nodes) {
            const { node, target, start } = item;
            let out = '';
            for (let i = 0; i < target.length; i++) {
                const globalIndex = start + i;
                const ch = target[i];
                if (ch === ' ' || ch === '\n' || globalIndex < revealHead) {
                    out += ch; // already resolved (or a space, keep layout)
                } else if (globalIndex < revealHead + scrambleWidth) {
                    out += C64_GLYPHS[(Math.random() * C64_GLYPHS.length) | 0];
                } else {
                    break; // everything past here is still blank this frame
                }
            }
            node.nodeValue = out;
        }

        if (progress < 1) {
            requestAnimationFrame(frame);
        } else {
            // Guarantee a clean final state
            for (const item of nodes) item.node.nodeValue = item.target;
        }
    }

    requestAnimationFrame(frame);
}

/**
 * Renders an authentic retro C64 network/loading error screen inside the details pane.
 */
function showC64ErrorScreen() {
    projectTabsContainer.innerHTML = '';
    projectDetailsContainer.innerHTML = `
        <div class="c64-error-box">
            <p class="blink-fast">*** DEVICE ERROR ***</p>
            <p>FAILED TO FETCH SYSTEM PROJECTS.</p>
            <p>READY.</p>
            <p class="blink-fast">_</p>
        </div>
    `;
}

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
