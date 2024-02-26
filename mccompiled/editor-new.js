'use strict';

const exampleFile = `print "Hello, user!"`

const takeoverAnimationLength = 200;
const lintDelay = 250;
const wikiURL = "https://github.com/7UKECREAT0R/MCCompiled/wiki/Cheat-Sheet";
const githubURL = "https://github.com/7UKECREAT0R/MCCompiled";
const downloadURL = "https://github.com/7UKECREAT0R/MCCompiled/releases/latest";
const socketURL = "ws://localhost:11830"
const navElement = document.getElementById('nav');
const projectInputElement = document.getElementById('projectField');
const green = '#3cc741';
const red = '#db4b35';

const takeover_startserver = `
<h1>Open MCCompiled Server?</h1>
<h2 style="max-width:400px">
    Failed to connect to an MCCompiled server running on your system. Do you want to start one? This requires that you have MCCompiled installed.
</h2>
<div>
    <button onclick="openServer()">YES</button>
    <button onclick="removeTakeover()">NO</button>
</div>`;

const takeover_wiki = `
<h1>Open Wiki?</h1>
<h2 style="max-width:400px">
    The wiki contains useful reference information for good code and use of features.
</h2>
<div>
    <button onclick="openWiki()">YES</button>
    <button onclick="removeTakeover()">NO</button>
</div>`;

const takeover_extras = `
<h2>LINKS</h2>
<div>
    <button onclick="openWiki()">WIKI</button>
    <button onclick="openGithub()">GITHUB</button>
    <button onclick="openDownload()">DOWNLOAD</button>
</div>
<h2>SERVER</h2>
<div>
    <button onclick="sendSocketPing()">PING SERVER</button>
    <button onclick="sendSocketInfo()">INFO</button>
</div>
<h2>FILESYSTEM</h2>
<div>
    <button onclick="sendSocketOpenFolder('current')">OPEN DIRECTORY</button>
    <button onclick="sendSocketOpenFolder('bp')">OPEN COM.MOJANG</button>
</div>
<h2 style="margin:10px"></h2>
<div>
    <button onclick="removeTakeover()" style="width:98%">CLOSE</button>
</div>
`;

// Encodes a base64 string.
function encodeBase64(str) {
    return btoa(str);
}
// Decodes a base64 string.
function decodeBase64(_str) {
    return atob(_str);
}
// Returns the current code.
function getCode() {
    if(editor)
        return editor.getValue();
    
    return "";
}
// Sets the current code. 
function setCode(code) {
    if(editor)
        editor.setValue(code);
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
function takeoverScreen(html, showLogo) {
    const hasExisting = removeTakeover();

    takeover = document.createElement('div');
    const sub = document.createElement('div');
    sub.innerHTML = html;
    takeover.appendChild(sub);
    
    if(showLogo) {
        // <img src="assets/logo-transparent.png" alt="MCCompiled Logo" />
        const logo = document.createElement('img');
        logo.setAttribute("src", "assets/web-logo.png");
        logo.setAttribute("alt", "MCCompiled Logo");
        takeover.prepend(logo);
    }

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

function openWiki() {
    window.open(wikiURL);
    removeTakeover();
}
function openGithub() {
    window.open(githubURL);
    removeTakeover();
}
function openDownload() {
    window.open(downloadURL);
    removeTakeover();
}
function openServer() {
    removeTakeover();
    window.location.assign("mccompiled://");
}

// WebSocket stuff
var projectName = 'web_project';
var metadata = {
    projectName: projectName
};
var socket = null;
var hasSocketFeatures = false;
var isBusy = false;
var currentNotification = null;
var takeover = null;
var editor = null;
var editorContainer = null;
var lintCooldown = null;

var propertiesPopup = null;
var propertiesIsClosing = false;

var properties = [];

var mouseX = 0;
var mouseY = 0;
window.onmousemove = function(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;

    if(propertiesPopup && !propertiesIsClosing) {
        // get rect holding the element
        const rect = propertiesPopup.getClientRects()[0];
        const bound = 60;
        if(mouseX < (rect.left - bound) ||
                mouseX > (rect.right + bound) ||
                mouseY < (rect.top - bound) ||
                mouseY > (rect.bottom + bound)) {
            propertiesIsClosing = true;
            propertiesPopup.style.animation = "propertiesOut 0.1s ease-out forwards";
            window.setTimeout(function() {
                propertiesPopup.remove();
                propertiesPopup = null;
                propertiesIsClosing = false;
            }, 110);

            propertiesPopup.select();
        }
    }
}

const saveButton = document.getElementById('saveButton');
const loadButton = document.getElementById('loadButton');
const connectButton = document.getElementById('connectButton');
const compileButton = document.getElementById('compileButton');
const wikiButton = document.getElementById('wikiButton');
const propertiesButton = document.getElementById('propertiesButton');

// Project Management
function updateTitle() {
    var title = projectName + " - MCCompiled";
    document.title = title;
}
function setProjectNameByElement(element) {
    if (element.value.length == 0) {
        showNotification(`Project name cannot be empty.`, 'red');
        projectInputElement.value = projectName;
        return;
    }

    projectName = element.value.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]+/g, "");
    metadata["projectName"] = projectName; // update metadata
    projectInputElement.value = projectName;
    showNotification(`Set project name to ${projectName}.`, 'white');

    updateTitle();
}
function setProjectName(name) {
    if (name.length == 0)
        name = "web_project";

    projectName = name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]+/g, "");
    metadata["projectName"] = projectName; // update metadata
    projectInputElement.value = projectName;

    updateTitle();
}

// Request a lint operation from the server.
// If the server is busy, this request is deferred for (lintDelay) ms.
function lint() {
    lintCooldown = null;

    if (!hasSocketFeatures)
        return;
    if (isBusy) {
        tryLint();
        return;
    }

    console.log("Running lint operation!");

    const code = getCode();
    const payload = {
        "action": "lint",
        "code": encodeBase64(code)
    };

    enableBusyFeatures(false);
    sendSocket(payload);
}
// Try to lint after a delay (lintDelay).
// This is called on loop while the compiler is busy.
function tryLint() {
    if(!hasSocketFeatures)
        return; // no point to try to lint
    if (lintCooldown)
        window.clearTimeout(lintCooldown);
    lintCooldown = window.setTimeout(lint, lintDelay);
}
// Compile the code currently.
function compile() {
    if (!hasSocketFeatures || isBusy)
        return;

    const code = encodeBase64(getCode());
    const project = encodeBase64(projectName);

    const payload = {
        "action": "compile",
        "code": code,
        "project": project
    };

    enableBusyFeatures(true);
    sendSocket(payload);
}

// Enable/disable the connect button.
function enableConnectButton(bool) {
    connectButton.setAttribute('enabled', bool.toString());
}
// Enable/disable the features in the GUI granted by connecting to the server.
// Also sets the hasSocketFeatures field.
function enableSocketFeatures(bool) {
    hasSocketFeatures = bool;
    saveButton.setAttribute('enabled', bool.toString());
    loadButton.setAttribute('enabled', bool.toString());
    connectButton.setAttribute('enabled', (!bool).toString());
    compileButton.setAttribute('enabled', bool.toString());
    propertiesButton.setAttribute('enabled', bool.toString());
}
// Enable/disable the features in the GUI that cannot be accessed when the server is busy.
// Also sets the isBusy field.
function enableBusyFeatures(bool) {
    isBusy = !bool;
    saveButton.setAttribute('enabled', bool.toString());
    loadButton.setAttribute('enabled', bool.toString());
    compileButton.setAttribute('enabled', bool.toString());
    propertiesButton.setAttribute('enabled', bool.toString());
}

function onClickSave() {
    if(!hasSocketFeatures || isBusy)
        return;

    const code = getCode();

    sendSocket({
        "action": "save",
        "code": encodeBase64(code),
        "meta": metadata
    })
}
function onClickLoad() {
    if(!hasSocketFeatures || isBusy)
        return;
    
    sendSocket({
        "action": "load"
    });
}
function onClickConnect() {
    if(hasSocketFeatures)
        return;

    openSocket();
}
function onClickCompile() {
    if(!hasSocketFeatures || isBusy)
        return;
    
    compile();
}
function onClickExtras() {
    takeoverScreen(takeover_extras, true);
}
function onClickProperties() {
    if(!hasSocketFeatures || isBusy)
        return;
    if(propertiesPopup)
        return;
    
    // create a pop up window on the user's cursor for setting the available properties.
    propertiesPopup = document.createElement('div');
    propertiesPopup.className = "propertiesPanel";
    propertiesPopup.style.left = mouseX + "px";
    propertiesPopup.style.top = mouseY + "px";
    propertiesIsClosing = false;

    // create an element for each property
    let i = -1;
    for(var property of properties) {
        i++;
        const propertyName = property.name;
        const propertyValue = property.value;

        const element = document.createElement('div');

        const nameElement = document.createElement('label');
        const valueElement = document.createElement('input');
        valueElement.id = propertyName + "_input";
        nameElement.setAttribute("for", valueElement.id);
        nameElement.innerText = propertyName;
        valueElement.value = propertyValue;
        valueElement.setAttribute("propertyindex", i);
        valueElement.onclick = function() { this.select(); }
        valueElement.onchange = function(self) {
            const thisElement = self.target;
            const index = thisElement.getAttribute("propertyindex");
            const item = properties[index];

            item.value = valueElement.value;
            sendSocketPropertyChange(item);
        };
        valueElement.setAttribute("maxlength", 64);
        valueElement.setAttribute("spellcheck", false);

        element.appendChild(nameElement);
        element.appendChild(valueElement);
        propertiesPopup.appendChild(element);
    }

    document.body.appendChild(propertiesPopup);
}

// Opens a socket if one is not already open.
function openSocket() {
    if(socket) {
        if(socket.readyState < 2)
            return;
        else
            socket.close();
    }

    enableConnectButton(false);
    socket = new WebSocket(socketURL);
    socket.addEventListener("open", onSocketOpen);
    socket.addEventListener("close", onSocketClose);
    socket.addEventListener("error", onSocketError);
    socket.addEventListener("message", onSocketMessage);
}
// Sends a JSON object to the open socket, if any.
function sendSocket(object) {
    if(!socket || socket.readyState > 1) 
        return;

    const textData = JSON.stringify(object);
    socket.send(textData);
}
// Sends a JSON object to the open socket, if any.
function sendSocketText(string) {
    if(!socket || socket.readyState > 1) 
        return;

    socket.send(string, 'utf8');
}
// Sends a sub-protocol implemented ping to the server, if any.
// Shows an error if no connection is present.
function sendSocketPing() {
    if(!socket || socket.readyState > 1) {
        showNotification("Not connected to a server.", red);
        return;
    }

    const textData = JSON.stringify({
        "action": "ping"
    });

    socket.send(textData, 'utf8');
}
// Attempts to enable/disable debugging on the connected server, if any.
// Shows an error if no connection is present.
function sendSocketDebug(bool) {
    if(!socket || socket.readyState > 1) {
        showNotification("Not connected to a server.", red);
        return;
    }

    const textData = JSON.stringify({
        "action": "debug",
        "debug": bool
    });

    socket.send(textData);
}
// Attempts to request info from the connected server, if any.
// Shows an error if no connection is present.
function sendSocketInfo() {
    if(!socket || socket.readyState > 1) {
        showNotification("Not connected to a server.", red);
        return;
    }

    const textData = JSON.stringify({
        "action": "info"
    });

    socket.send(textData);
}
// Tells the server to open a folder based on the folder key.
// See Server Documentation v5.3+ to view all valid keys.
function sendSocketOpenFolder(key) {
    if(!socket || socket.readyState > 1) {
        showNotification("Not connected to a server.", red);
        return;
    }

    const textData = JSON.stringify({
        "action": "openfolder",
        "folder": key
    });

    socket.send(textData);
    removeTakeover();
}
// Sends a property change to the server.
function sendSocketPropertyChange(property) {
    if(!socket || socket.readyState > 1) {
        showNotification("Not connected to a server.", red);
        return;
    }

    const textData = JSON.stringify({
        "action": "property",
        "name": encodeBase64(property.name),
        "value": encodeBase64(property.value)
    });

    socket.send(textData);
}

function onSocketOpen(event) {
    showNotification("Connected to Language Server", green);
    enableSocketFeatures(true);

    // do an initial lint
    tryLint();
}
function onSocketClose(event) {
    if(event.code == 1006) {
        // this is an error due to no connection
        enableConnectButton(true);
        enableSocketFeatures(false);
        isBusy = false;
        takeoverScreen(takeover_startserver, false);
        return;
    }
    showNotification("Connection to server closed.", "#AAAAAA");
    socket = null;
    enableSocketFeatures(false);
    enableConnectButton(true);
    isBusy = false;
}
function onSocketError(event) {
    console.log(event);
    showNotification("Socket Encountered Error", red);
    socket = null;
    enableSocketFeatures(false);
    enableConnectButton(true);
    isBusy = false;
}
function onSocketMessage(event) {
    const json = JSON.parse(event.data);
    const action = json["action"];

    console.log("Got action: " + action);

    if(action.match("version"))
        version = json["version"];
    if(action.match("postload"))
        action_postLoad(json);
    if(action.match("seterrors"))
        action_setErrors(json["errors"]);
    if(action.match("setsymbols"))
        action_setSymbols(json);
    if(action.match("notification"))
        action_notification(json);
    if(action.match("menu"))
        action_menu(decodeBase64(json["html"]));
    if(action.match("busy"))
        action_busy(json["busy"]);
    if(action.match("properties"))
        action_properties(json["properties"]);
}

function action_postLoad(json) {
    if(!editor)
        return;

    const code = decodeBase64(json["code"]);
    setCode(code);

    if(json["meta"]) {
        metadata = json["meta"];

        if(metadata["projectName"]) {
            projectName = metadata["projectName"];
            projectInputElement.value = projectName;
        }
    }
}
function action_setErrors(errors) {
    var markers = [];
    const model = editor.getModel();

    errors.forEach(error => {
        const line = error["line"];
        const code = model.getLineContent(line);
        const errorMessage = decodeBase64(error["error"]);

        // start the error line at the first non-whitespace character
        var startIndex = 0;
        const beginningWhitespace = code.match(/^\s+/);
        if (beginningWhitespace && beginningWhitespace[0])
            startIndex = beginningWhitespace[0].length;

        const marker = {
            message: errorMessage,
            code: code,
            severity: 8,
            startLineNumber: line,
            endLineNumber: line,
            startColumn: startIndex + 1,
            endColumn: code.length + 1
        };
        markers.push(marker);
    });

    monaco.editor.setModelMarkers(model, 'mcc-lint', markers);
}
function action_setSymbols(json) {
    userPPVs = json["ppvs"];
    userVariables = json["variables"];
    userFunctions = json["functions"];

    if(version >= 1130) // 1.13+
        userMacros = json["macros"];
}
function action_notification(json) {
    const text = decodeBase64(json["text"]);
    const color = json["color"];
    showNotification(text, color);
}
function action_menu(html) {
    takeoverScreen(html, false);
}
function action_busy(bool) {
    enableBusyFeatures(!bool);
}
function action_properties(json) {
    properties = json;

    properties.forEach(property => {
        property.name = decodeBase64(property.name);
        property.value = decodeBase64(property.value);
    });

    if(propertiesPopup) {
        propertiesPopup.remove();
        propertiesPopup = null;
    }
}

var version = 1150; // 1.15 and under
var userPPVs = []; 
var userVariables = [];
var userFunctions = [];
var userMacros = [];

// Provides completions in the editor.
const mccCompletionProvider = {
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
                    kind: monaco.languages.CompletionItemKind.Value,
                    insertText: key,
                }
            }),
            ...userVariables.map(key => {
                var detail = key.type;

                return {
                    label: key.name,
                    detail: detail,
                    documentation: decodeBase64(key.docs),
                    kind: monaco.languages.CompletionItemKind.Variable,
                    insertText: key.name,
                }
            }),
            ...userFunctions.map(key => {
                const ret = key.return ?? 'none';
                var detail = "Returns: " + ret;

                var insert;
                // arguments present in the function
                if(key.arguments && key.arguments.length > 0) {
                    const args = key.arguments.map(arg => arg.type + ' ' + arg.name).join("  ");

                    insert = key.name + "(";
                    var snippetIndex = 0;
                    const length = key.arguments.length;
                    for (let index = 0; index < length; index++) {
                        snippetIndex++;
                        const arg = key.arguments[index];

                        // ${index:name}
                        insert += `\$\{${snippetIndex}:${arg.name}\}`;

                        // add a separator if this is not the last element
                        if(snippetIndex < length) {
                            insert += ", ";
                        }

                    }
                    insert += ")$0";

                    return {
                        sortText: key.name,
                        label: key.name + "(" + args + ")",
                        detail: detail,
                        documentation: decodeBase64(key.docs),
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: insert,
                        insertTextRules: 4 // InsertAsSnippet
                    }
                }

                // no arguments in the function
                insert = key.name + "()";
                return {
                    sortText: key.name,
                    label: insert,
                    detail: detail,
                    documentation: decodeBase64(key.docs),
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: insert,
                }
            }),
            ...userMacros.map(key => {
                var insert;
                // arguments present in the function
                if(key.arguments && key.arguments.length > 0) {
                    const args = key.arguments.join(" ");

                    insert = "\\$macro " + key.name + " ";
                    var snippetIndex = 0;
                    const length = key.arguments.length;
                    for (let index = 0; index < length; index++) {
                        snippetIndex++;
                        const arg = key.arguments[index];

                        // ${index:name}
                        insert += `\$\{${snippetIndex}:${arg}\}`;

                        // add a separator if this is not the last element
                        if(snippetIndex < length) {
                            insert += " ";
                        }

                    }
                    insert += "$0";

                    return {
                        sortText: key.name,
                        label: key.name,
                        detail: "Preprocessor Macro",
                        documentation: decodeBase64(key.docs),
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: insert,
                        insertTextRules: 4 // InsertAsSnippet
                    }
                }

                // no arguments in the function
                insert = "$macro " + key.name;
                return {
                    sortText: key.name,
                    label: key.name,
                    detail: "Preprocessor Macro",
                    documentation: decodeBase64(key.docs),
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: insert,
                }
            }),
            ...mcc_commands.map(key => {
                return {
                    label: key.word,
                    detail: key.docs,
                    kind: monaco.languages.CompletionItemKind.Event,
                    insertText: key.word
                }
            }),
            ...mcc_selectors.map(key => {
                return {
                    label: key.word,
                    detail: key.docs,
                    kind: monaco.languages.CompletionItemKind.Operator,
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
                    kind: monaco.languages.CompletionItemKind.Constant,
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
                    kind: monaco.languages.CompletionItemKind.Operator,
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
};
// Open the monaco libraries and then run load().
require(['vs/editor/editor.main'], function () {
    editorContainer = document.createElement('div');
    editorContainer.className = "editor";
    document.body.appendChild(editorContainer);

    monaco.editor.defineTheme("mcc-solar", {
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
    });

    monaco.languages.register({
        id: 'mccompiled',
        extensions: ["mcc"],
        aliases: ["mcc"]
    });

    // Syntax highlighting, defined in 'monaco/mcc-monarch.js'
    monaco.languages.setMonarchTokensProvider('mccompiled', mccompiled);

    // Provider for autocompletion.
    monaco.languages.registerCompletionItemProvider('mccompiled', mccCompletionProvider);

    editor = monaco.editor.create(editorContainer, {
        value: exampleFile,
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
});

// Update the editor layout when the screen resizes.
window.onresize = function () {
    if (editor) editor.layout();
}

// Handle Control+S for saving.
document.addEventListener('keydown', function (event) {
    const ctrl = event.ctrlKey;
    if (ctrl && event.key.match('s')) {
        event.preventDefault();
        onClickSave();
        return;
    }
}, false);

updateTitle();