'use strict';

const takeoverAnimationLength = 200;
const wikiURL = "https://github.com/7UKECREAT0R/MCCompiled/wiki/Cheat-Sheet";
const navElement = document.getElementById('nav');
const projectInputElement = document.getElementById('projectField');
const compileButton = document.getElementById('compileButton');
const green = '#3cc741';
const red = '#db4b35';

const takeover_installserver = `<h1>Installing MCCompiled Server:</h1>
<h2 style="max-width:480px">
Granted you have MCCompiled setup on your system, open an administrator command prompt and run the command: <code>mc-compiled --protocol</code>.
You should now be able to open the server through the web-interface.
</h2>
<div>
<button onclick="startServer()">DONE</button>
<button onclick="removeTakeover()">WILL DO</button>
</div>`;
const takeover_startserver = `<h1>Open MCCompiled Server?</h1>
<h2 style="max-width:400px">
Failed to connect to an MCCompiled server running on your system. Do you want to start one? This requires that you have 'installed' the MCCompiled server. <a onclick="takeoverScreen(takeover_installserver)">How to install?</a>
</h2>
<div>
<button onclick="startServer()">YES</button>
<button onclick="removeTakeover()">NO</button>
</div>`;
const takeover_wiki = `<h1>Open Wiki?</h1>
<h2 style="max-width:400px">
The wiki contains useful reference information for good code and use of features.
</h2>
<div>
<button onclick="wiki()">YES</button>
<button onclick="removeTakeover()">NO</button>
</div>`;

var isConnectedToServer = false;
var isBusy = false;
var isSaving = false;
var isLoading = false;
var unsavedChanges = false;

var currentNotification = null;
var takeover = null;

function encodeBase64(str) {
    const length = { length: str.length };
    const units = Uint16Array.from(length, (element, index) => str.charCodeAt(index));
    const codes = new Uint8Array(units.buffer);

    var result = "";
    codes.forEach((c) => {
        result += String.fromCharCode(c);
    });

    return btoa(result);
}
function decodeBase64(_str) {
    const str = atob(_str);
    const length = { length: str.length };

    const units = Uint8Array.from(length, (element, index) => str.charCodeAt(index));
    const codes = new Uint16Array(units.buffer);

    var result = "";
    codes.forEach((c) => {
        result += String.fromCharCode(c);
    });

    return result;
}

function showNotification(text, color) {
    if (currentNotification)
        currentNotification.remove();

    currentNotification = document.createElement("p");
    currentNotification.innerText = text;
    currentNotification.style.color = color;
    currentNotification.className = "notification";
    navElement.appendChild(currentNotification);
}
function takeoverScreen(html) {
    const hasExisting = removeTakeover();

    takeover = document.createElement('div');
    const sub = document.createElement('div');
    sub.innerHTML = html;
    takeover.appendChild(sub);

    if (hasExisting) {
        window.setTimeout(function () {
            takeover.className = "takeover";
            document.body.appendChild(takeover);
        }, takeoverAnimationLength);
    } else {
        takeover.className = "takeover";
        document.body.appendChild(takeover);
    }
}
function removeTakeover() {
    if (takeover) {
        takeover.style.animation = 'takeover-fade-out 0.2s cubic-bezier(.3,.09,.54,1) forwards';
        const holder = takeover;
        takeover = null;

        window.setTimeout(function () {
            holder.remove();
        }, takeoverAnimationLength);
        return true;
    }

    return false;
}

// server heartbeat services
function onConnectedToServer() {
    compileButton.innerText = "COMPILE";
    compileButton.onclick = compile;
    isConnectedToServer = true;

    tryLint();
}
function onDisconnectedFromServer() {
    compileButton.innerText = "CONNECT";
    compileButton.onclick = heartbeat;
    isConnectedToServer = false;
}
async function heartbeat() {

    if (isConnectedToServer) {
        while (isBusy) // wait
            await new Promise(resolve => setTimeout(resolve, 250));
    } else {
        if (isBusy)
            return;
        showNotification("Attempting to connect to an MCCompiled server...", '#AAAAAA');
        compileButton.setAttribute('enabled', 'false');
        isBusy = true;
    }

    const url = "http://localhost:11830/heartbeat";
    fetch(url).then(response => {
        isBusy = false;
        compileButton.setAttribute('enabled', 'true');
        if (!isConnectedToServer) {
            showNotification("Connected to an MCCompiled server.", green);
            isConnectedToServer = true;
            onConnectedToServer();
        }
        window.setTimeout(heartbeat, 1000);
        return response;
    }).catch(err => {
        showNotification("Couldn't connect to an MCCompiled server.", red);
        isConnectedToServer = false;
        compileButton.setAttribute('enabled', 'true');
        isBusy = false;
        onDisconnectedFromServer();
        takeoverScreen(takeover_startserver);
    });
}
function enableDebug() {
    const url = "http://localhost:11830/debug";
    fetch(url).then(response => {
        return response.json();
    }).then(json => {
        const response = json['response'];
        const decoded = decodeString(response);
        showNotification(decoded, green);
    }).catch(err => {
        showNotification(`Failed to enable debug.`, red);
    })
}
function startServer() {
    removeTakeover();
    window.location.assign("mccompiled://");
}

// linting service
const lintTimer = 500;
var lintCooldown = null;
function tryLint() {
    if (lintCooldown)
        window.clearTimeout(lintCooldown);
    lintCooldown = window.setTimeout(lint, lintTimer);
}

var projectName = "web_project";
function setProjectNameByElement(element) {
    if (element.value.length == 0) {
        showNotification(`Project name cannot be empty.`, 'red');
        projectInputElement.value = projectName;
        return;
    }

    projectName = element.value.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]+/g, "");
    projectInputElement.value = projectName;
    fileHandle = null;
    showNotification(`Set project name to ${projectName}.`, 'white');

    unsavedChanges = true;
    updateTitle();
}
function setProjectName(name) {
    if (name.length == 0)
        name = "web_project";
    projectName = name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]+/g, "");
    projectInputElement.value = projectName;
    fileHandle = null;

    unsavedChanges = true;
    updateTitle();
}

var userPPVs = []; 
var userVariables = [];
var userFunctions = [];

const mcc_completion_provider = {
    provideCompletionItems: (currentModel, position) => {
        const matches = [
            ...mcc_preprocessor.map(key => {
                return {
                    label: key.word,
                    detail: key.docs,
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: key.word,
                    range: {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column - 1,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column
                    }
                }
            }),
            ...userPPVs.map(key => {
                return {
                    label: key,
                    detail: "Preprocessor Variable",
                    kind: monaco.languages.CompletionItemKind.User,
                    insertText: key,
                }
            }),
            ...userVariables.map(key => {
                return {
                    label: key.name,
                    detail: "Type: " + key.type,
                    kind: monaco.languages.CompletionItemKind.User,
                    insertText: key.name,
                }
            }),
            ...userFunctions.map(key => {
                const ret = key.return ? key.return : 'null';
                const args = key.arguments.map(arg => arg.type + ' ' + arg.name).join("  ");
                return {
                    label: key.name,
                    detail: "Arguments: " + args + ", Returns: " + ret,
                    kind: monaco.languages.CompletionItemKind.User,
                    insertText: key.name
                }
            }),
            ...mcc_commands.map(key => {
                return {
                    label: key.word,
                    detail: key.docs,
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: key.word
                }
            }),
            ...mcc_selectors.map(key => {
                return {
                    label: key.word,
                    detail: key.docs,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: key.word,
                    range: {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column - 1,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column
                    }
                }
            }),
            ...mcc_literals.map(key => {
                return {
                    label: key.word,
                    detail: key.docs,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: key.word
                }
            }),
            ...mcc_types.map(key => {
                return {
                    label: key.word,
                    detail: key.docs,
                    kind: monaco.languages.CompletionItemKind.Class,
                    insertText: key.word
                }
            }),
            ...mcc_comparisons.map(key => {
                return {
                    label: key.word,
                    detail: key.docs,
                    kind: monaco.languages.CompletionItemKind.Property,
                    insertText: key.word
                }
            }),
            ...mcc_options.map(key => {
                return {
                    label: key.word,
                    detail: key.docs,
                    kind: monaco.languages.CompletionItemKind.Field,
                    insertText: key.word
                }
            })
        ];
        return { suggestions: matches };
    },
    triggerCharacters: ['$', '@', '&', '~', '^']
}
const mcc_solar = {
    base: 'vs-dark',
    inherit: false,
    rules: [
        { token: '', foreground: 'D4D4D4', background: '352F35' },
        { token: 'comment', foreground: '3E8C42' },
        { token: 'numbers', foreground: 'E0C1FF' },
        { token: 'strings', foreground: 'E0C1FF' },

        { token: 'operators', foreground: 'E0C1FF' },
        { token: 'selectors', foreground: 'FF4F4F' },
        { token: 'selectors.properties', foreground: 'E8A8FF' },
        { token: 'preprocessor', foreground: '0BA4DD' },
        { token: 'commands', foreground: 'EE5BAF' },
        { token: 'literals', foreground: 'E0C1FF' },
        { token: 'types', foreground: 'FF8080' },
        { token: 'comparisons', foreground: 'FF5F42' },
        { token: 'options', foreground: 'D7AEFF' }
    ],
    colors: {
        ["editor.background"]: '#352F35',
        ["editor.foreground"]: '#D4D4D4'
    }
}

var editor = null;
var editorContainer = null;

function load() {
    unsavedChanges = true;
    updateTitle();

    editorContainer = document.createElement('div');
    editorContainer.className = "editor";
    document.body.appendChild(editorContainer);

    monaco.editor.defineTheme("mcc-solar", mcc_solar);
    monaco.languages.register({
        id: 'mccompiled',
        extensions: ["mcc"],
        aliases: ["mcc"]
    });
    monaco.languages.setMonarchTokensProvider('mccompiled', mccompiled);
    monaco.languages.registerCompletionItemProvider('mccompiled', mcc_completion_provider);
    //monaco.languages.registerHoverProvider('mccompiled', mcc_hover_provider);

    editor = monaco.editor.create(editorContainer, {
        value: `function example {
    print "[color: green]Hello World!"
}

/*
    Simple magic system!
    Multiline comment.
*/

define mana

function reset {
    init mana
    mana = 50
}

// Uses a spell and consumes 'amount' mana.
function useSpell amount {
    mana -= amount
    print "[color: cyan]Used {amount} mana."
}`,
        language: "mccompiled",
        theme: "mcc-solar",
        codeLensFontFamily: "Roboto Mono",
        fontFamily: "Roboto Mono",
        fontSize: "16px",
        suggestFontSize: "10px",
        suggestLineHeight: "18px",
        cursorBlinking: "blink",
        mouseWheelZoom: true,
        fontLigatures: true,
        formatOnPaste: true,
        tabCompletion: "on",
        wrappingIndent: "indent",
        wordSeparators: "`~!#%^&*()-=+[{]}\|;'\",.<>/?",
        wordBasedSuggestions: false,
        renderWhitespace: "trailing",
        copyWithSyntaxHighlighting: false,
        emptySelectionClipboard: true,
        inlineSuggest: {
            enabled: true,
            mode: "prefix"
        },
        quickSuggestionsDelay: 0,
        quickSuggestions: {
            comments: false,
            other: "inline",
            strings: false
        },
        suggest: {
            showColors: true,
            showWords: false
        },
        padding: {
            bottom: "24px",
            top: "24px"
        },
        lightbulb: {
            enabled: false
        },
        find: {
            loop: true,
            cursorMoveOnType: true,
            autoFindInSelector: "multiline",
            addExtraSpaceOnTop: false
        },
        minimap: {
            enabled: false
        }
    });

    const model = editor.getModel();
    model.onDidChangeContent(function (event) {
        tryLint();
        /*if (!unsavedChanges) {
            unsavedChanges = true;
            updateTitle();
        }*/
    });
    model.updateOptions({
        tabSize: 4
    });
}

// keyboard handler
document.addEventListener('keydown', function (event) {
    const ctrl = event.ctrlKey;
    if (ctrl && event.key.match('s')) {
        event.preventDefault();
        save();
        return;
    }
}, false);

async function save() {
    if (isSaving)
        return;

    showNotification("Attempting to save file...", '#AAAAAA');
    isSaving = true;

    const content = encodeString(editor.getValue());
    fetch()

    isSaving = false;
    unsavedChanges = false;
    updateTitle();
}
async function loadFile() {
    fileHandle = await window.showOpenFilePicker({
        multiple: false,
        types: [
            {
                "description": "MCCompiled Code",
                "accept": { 'text/plain': ['.mcc'] }
            }
        ]
    });
    if (fileHandle.length && fileHandle.length > 0) {
        fileHandle = fileHandle[0];
        showNotification("Loading file...", '#AAAAAA');
        const file = await fileHandle.getFile();
        const pName = file.name;

        if (pName.endsWith(".mcc"))
            setProjectName(pName.substr(0, pName.length - 4));
        else
            setProjectName(pName);

        file.text().then(contents => {
            editor.setValue(contents);
            showNotification(`Loaded project ${projectName}!`, green);

            unsavedChanges = false;
            updateTitle();
        });
    }
}
function compile() {
    if (!isConnectedToServer)
        return;
    if (isBusy)
        return;

    const url = "http://localhost:11830/compile/" + projectName;
    const data = encodeString(editor.getValue());

    const params = {
        headers: {
            "Content-Type": "text/plain; charset=UTF-8"
        },
        body: data,
        method: "POST"
    };

    showNotification("Compiling code...", '#AAAAAA');
    compileButton.setAttribute('enabled', 'false');
    isBusy = true;

    fetch(url, params).then(response => {

        compileButton.setAttribute('enabled', 'true');
        isBusy = false;

        if (response.status == 500) {
            showNotification("Error during compilation. Check code.", red);
            tryLint();
            return;
        }
        if (response.status == 413) {
            showNotification("Code is too long to send to server.", red);
            return;
        }

        showNotification("Compilation completed.", green);
        return response;
    }).catch(err => {
        showNotification(err.toString(), red);
        compileButton.setAttribute('enabled', 'true');
        isBusy = false;
    });
}
function lint() {

    lintCooldown = null;

    if (!isConnectedToServer)
        return;
    if (isBusy) {
        tryLint();
        return;
    }

    const url = "http://localhost:11830/lint/" + projectName;
    const data = encodeString(editor.getValue());

    const params = {
        headers: {
            "Content-Type": "text/plain; charset=UTF-8"
        },
        body: data,
        method: "POST"
    };

    isBusy = true;
    compileButton.setAttribute('enabled', 'false');
    fetch(url, params).then(response => {
        if (response.status == 500) {
            showNotification("Fatal compiler error.", red);
            return;
        }
        if (response.status == 413) {
            showNotification("Code is too long to send to server.", red);
            return;
        }
        return response.json();
    }).then(json => {
        isBusy = false;
        compileButton.setAttribute('enabled', 'true');
        handleLintJSON(json);
    }).catch(err => {
        showNotification(err.toString(), red);
        isBusy = false;
        compileButton.setAttribute('enabled', 'true');
    });
}
function handleLintSuccess(json) {
    userVariables = json["variables"];
    userFunctions = json["functions"];
    userPPVs = json["ppvs"];

    monaco.editor.setModelMarkers(editor.getModel(), 'mcc-lint', []);
}
function handleLintError(json) {
    var line = json["line"];
    if (line == 0)
        line = 1;

    const message = json["message"];
    const model = editor.getModel();
    const code = model.getLineContent(line);

    var startIndex = 0;
    const beginningWhitespace = code.match(/^\s+/);
    if (beginningWhitespace && beginningWhitespace[0])
        startIndex = beginningWhitespace[0].length;

    monaco.editor.setModelMarkers(model, 'mcc-lint', [
        {
            message: message,
            code: code.trim(),
            severity: 8,
            startLineNumber: line,
            endLineNumber: line,
            startColumn: startIndex + 1,
            endColumn: code.length + 1
        }
    ]);
}
function handleLintJSON(json) {
    const type = json["type"];
    if (type == 'error')
        handleLintError(json);
    else if (type == 'success')
        handleLintSuccess(json);
    else
        console.log("Unknown lint result type: " + type);
}
function wiki() {
    window.open(wikiURL);
    removeTakeover();
}
function updateTitle() {
    var title = "MCCompiled - " + projectName;
    if (unsavedChanges)
        title += '*';

    document.title = title;
}

require(['vs/editor/editor.main'], function () {
    load();
});
window.onresize = function () {
    if (editor)
        editor.layout();
}
window.onbeforeunload = function (e) {
    if (unsavedChanges) {
        e.preventDefault();

        // doesnt show on most browsers
        return "You have unsaved changes in the project " + projectName + ". Exit page?";
    }
}