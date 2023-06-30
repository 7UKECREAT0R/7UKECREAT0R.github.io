const canvas = document.getElementById('editor');
const ioColors = {
    none: "#222222",
    string: "#2e6ac9",
    string_long: "#2e6ac9",
    boolean: "#cf3a89",
    choice: "#3acf7a",
    number: "#2aacc9",
    slider: "#2aacc9"
}
function ioColorFromType(type, defaultColor) {
    if(!type)
        return defaultColor;
    const access = ioColors[type];
    if(access)
        return access;
    return defaultColor;
}

function lerp(a, b, t) {
    return a + t * (b - a);
}
var curveFunction = (x) => {
    return 0.5 + Math.sin(Math.PI * x - (Math.PI / 2)) * 0.5;
}
function clone(obj) {
    // just-clone code
    let result = obj;
    var type = {}.toString.call(obj).slice(8, -1);
    if (type == 'Set') {
        return new Set([...obj].map(value => clone(value)));
    }
    if (type == 'Map') {
        return new Map([...obj].map(kv => [clone(kv[0]), clone(kv[1])]));
    }
    if (type == 'Date') {
        return new Date(obj.getTime());
    }
    if (type == 'RegExp') {
        return RegExp(obj.source, getRegExpFlags(obj));
    }
    if (type == 'Array' || type == 'Object') {
        result = Array.isArray(obj) ? [] : {};
        for (var key in obj) {
            // include prototype properties
            result[key] = clone(obj[key]);
        }
    }
    // primitives and non-supported objects (e.g. functions) land here
    return result;
}
function insertAfter(newNode, existingNode) {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}

function getWindowSize() {
    return {
        width: canvas.parentElement.clientWidth,
        height: canvas.parentElement.clientHeight
    };
}
function setCanvasSizeExact(w, h) {
    canvas.setAttribute('width', w);
    canvas.setAttribute('height', h);
}
function setCanvasSize(structure) {
    setCanvasSizeExact(structure.width, structure.height);
}
function handleMoveCircle(circle, event) {
    event.stopPropagation();
    if(isDragging && selectedPort) {
        // "snap" the position onto the port
        const boundingRect = circle.getBoundingClientRect();
        const snappedX = (boundingRect.left + boundingRect.right) / 2;
        const snappedY = (boundingRect.top + boundingRect.bottom) / 2;
        handleMoveAny(snappedX, snappedY);
        return;
    }
    handleMoveAny(event.clientX, event.clientY);
}
function handleMoveAny(x, y) {
    const deltaX = x - mouseX;
    const deltaY = y - mouseY;
    mouseX = x;
    mouseY = y;

    if(isPanning) {
        panX -= deltaX / zoom;
        panY -= deltaY / zoom;
        redraw(getWindowSize());
        updateAllNodes();
    }
    if(isDragging) {
        if(selectedPort) {
            redraw(getWindowSize());
        }
        else if(selectedNode) {
            const moveX = deltaX / zoom;
            const moveY = deltaY / zoom;
            selectedNode.x += moveX;
            selectedNode.y += moveY;
            updateNode(selectedNode);
            redraw(getWindowSize());
        }
    }
}
function handleWheelAny(event) {
    const deltaY = event.deltaY;
    const oldZoom = zoom;

    if(deltaY > 0) {
        // zoom out
        zoom -= zoomInterval;
    } else {
        // zoom in
        zoom += zoomInterval;
    }

    if(zoom < 0.1)
        zoom = 0.1;
    else if(zoom > 3)
        zoom = 3;

    // offset the position so that the zoom occurs at the center of the viewport (panX, panY)
    const windowSize = getWindowSize();

    updateAllNodes();
    redraw(windowSize);
}
function handleKeyDownAny(event) {
    if(event.repeat)
        return;
    
    const ctrl = event.ctrlKey;
    const key = event.key;

    if(key == "Delete" && selectedNode) {
        const node = selectedNode;
        deselectNode(true);
        deleteNode(node);
    }
}
function worldToScreenCoordinate(x, y) {
    const middle = getWindowSize();
    middle.width /= 2;
    middle.height /= 2;
    
    x = ((x - panX) * zoom) + middle.width;
    y = ((y - panY) * zoom) + middle.height;

    return {x:x, y:y};
}
function screenToWorldCoordinate(x, y) {
    const middle = getWindowSize();
    middle.width /= 2;
    middle.height /= 2;

    x = ((x - middle.width) / zoom) + panX;
    y = ((y - middle.height) / zoom) + panY;

    return {x:x, y:y};
}



// performance
var fastConnectionDrawing = false;

// state
var mouseX = 0;
var mouseY = 0;
var gridSize = 32;
var isPanning = false;
var isDragging = false;
var panX = 0;
var panY = 0;
const zoomInterval = 0.07;
var zoom = 1.0;

// nodes
var nodes = [];
var selectedNode = null;
var selectedPort = null;

// templates
var templates = {};
var contextMenu = null;
function deleteContextMenu() {
    if(contextMenu) {
        contextMenu.remove();
        contextMenu = null;
    }
}
function createContextMenu(x, y) {
    deleteContextMenu();

    const contextElement = document.createElement('div');
    contextElement.id = "contextmenu";
    contextElement.className = "contextmenu";

    for(const key in templates) {
        const value = templates[key];
        const insertElement = document.createElement('div');
        insertElement.className = "contextmenuitem";
        insertElement.style.borderLeft = "4px solid " + value.base.color;

        const displayText = document.createElement('p');
        displayText.className = "contextmenuitemname";
        displayText.innerText = value.base.title;

        const displayDesc = document.createElement('p');
        displayDesc.className = "contextmenuitemdesc";
        displayDesc.innerText = value.description;

        insertElement.onclick = function(event) {
            event.stopPropagation();
            deleteContextMenu();

            const nodeData = clone(value.base);
            const coords = screenToWorldCoordinate(x, y);
            nodeData.x = coords.x;
            nodeData.y = coords.y;
            addNodeFromData(nodeData);
        }

        insertElement.appendChild(displayText);
        insertElement.appendChild(displayDesc);
        contextElement.appendChild(insertElement);
    }

    contextElement.style.left = x + "px";
    contextElement.style.top = y + "px";
    return contextElement;
}
function registerNodeTemplate(key, description, nodeData) {
    templates[key] = {
        key: key,
        name: nodeData.title,
        description: description,
        base: nodeData
    };
    console.log(`Registered template ${key} (${nodeData.title})`);
}

function deselectNode(preventUpdate) {
    if(!selectedNode)
        return;
    
    selectedNode.selected = false;
    if(!preventUpdate)
        updateNode(selectedNode);
    selectedNode = null;
}
function setSelectedNode(nodeData) {
    if(selectedNode) {
        selectedNode.selected = false;
        updateNode(selectedNode);
    }

    selectedNode = nodeData;
    selectedNode.selected = true;
    updateNode(selectedNode);
}
function onNodeMouseDown(nodeData) {
    deleteContextMenu();
    setSelectedNode(nodeData);
    isDragging = true;
}
function onNodeMouseUp(nodeData) {
    isDragging = false;
    selectedPort = null;
    redraw(getWindowSize());
}

function trySendPortEvents(port, isConnected) {
    if(port.is_input) {
        if(port.connection.parent.onOutput) {
            port.connection.parent.onOutput({
                connected: isConnected,
                port: port.connection
            });
        }
        if(port.parent.onInput) {
            port.parent.onInput({
                connected: isConnected,
                port: port
            });
        }
    } else {
        if(port.connection.parent.onInput) {
            port.connection.parent.onInput({
                connected: isConnected,
                port: port.connection
            });
        }
        if(port.parent.onOutput) {
            port.parent.onOutput({
                connected: isConnected,
                port: port
            });
        }
    }
}
function onConnectionMapChanged() {
    runAll();
}
function onPortMouseDown(event, port) {
    event.stopPropagation();
    deleteContextMenu();
    isDragging = true;

    if(port.connection) {
        selectedPort = port.connection;

        // disconnect ports
        tryCreateElementForInput(port.connection);
        tryCreateElementForInput(port.connection.connection);
        trySendPortEvents(port, false);
        port.connection.connection = null;
        port.connection = null;
        redraw(getWindowSize());
        onConnectionMapChanged();
    } else {
        selectedPort = port;
    }
}
function onPortMouseUp(event, port) {
    event.stopPropagation();

    // connect to the node
    if(selectedPort && selectedPort != port) {
        if(selectedPort.is_input != port.is_input) {
            // overwrite any existing connection
            if(port.connection) {
                tryCreateElementForInput(port.connection);
                tryCreateElementForInput(port.connection.connection);
                trySendPortEvents(port, false);
                port.connection.connection = null;
                port.connection = null;
            }
            const input = port.is_input ? port : selectedPort;
            const output = port.is_input ? selectedPort : port;
            input.connection = output;
            output.connection = input;
            trySendPortEvents(port, true);
            if(input.disableUserData)
                input.disableUserData(); // no longer needed.

            onConnectionMapChanged();
        }
    }

    isDragging = false;
    selectedPort = null;
    redraw(getWindowSize());
}

// Begins to run all root nodes.
function runAll() {
    // set all I/O to not evaluated.
    nodes.forEach(node => {
        if(node.inputs) {
            node.inputs.forEach(input => {
                input.is_evaluated = false;
                input.currentValue = null;
            });
        }
    });

    // run all root nodes.
    nodes.forEach(node => {
        if(!node.isRootNode())
            return;
        runNode(node);
    });
}
function runNode(node) {
    let data = {};

    // get the data for the node.
    if(node.inputs) {
        node.inputs.forEach(input => {
            if(input.currentValue)
                data[input.name] = input.currentValue;
            else {
                if(input.getUserData)
                    data[input.name] = input.getUserData();
                else
                    data[input.name] = null;
            }
        });
    }

    // run it
    let result = {};
    if(node.run)
        result = node.run(data);
    
    // traverse to connected nodes.
    if(node.outputs) {
        node.outputs.forEach(output => {
            if(!output.connection)
                return;
            output.connection.is_evaluated = true;
            output.connection.currentValue = result[output.name];
            const nextNode = output.connection.parent;
            if(nextNode.isReadyToRun())
                runNode(nextNode);
        });
    }
}

function updateAllNodes() {
    nodes.forEach(node => {
        updateNode(node);
    });
}
function updateNode(nodeData) {
    const screenCoord = worldToScreenCoordinate(nodeData.x, nodeData.y);
    nodeData.element.style.left = screenCoord.x + "px";
    nodeData.element.style.top = screenCoord.y + "px";
    nodeData.element.style.transform = `scale(${zoom * 100}%)`;
    nodeData.element.setAttribute("selected", nodeData.selected);
}

function disconnectAllPorts(nodeData, supressRedraw) {
    if(nodeData.inputs) {
        nodeData.inputs.forEach(input => {
            if(!input.connection)
                return;
            tryCreateElementForInput(input.connection);
            tryCreateElementForInput(input.connection.connection);
            trySendPortEvents(port, false);
            input.connection.connection = null;
            input.connection = null;
        });
    }

    if(nodeData.outputs) {
        nodeData.outputs.forEach(output => {
            if(!output.connection)
                return;
            tryCreateElementForInput(output.connection);
            tryCreateElementForInput(output.connection.connection);
            trySendPortEvents(port, false);
            output.connection.connection = null;
            output.connection = null;
        });
    }

    if(!supressRedraw) {
        updateAllNodes();
        onConnectionMapChanged();
        redraw(getWindowSize());
    }
}
function deleteNode(nodeData) {
    if(nodeData.element) {
        nodeData.element.remove();
    }

    const index = nodes.indexOf(nodeData);
    if(index != -1)
        nodes.splice(index, 1);
    
    disconnectAllPorts(nodeData, true);
    updateAllNodes();
    redraw(getWindowSize());
}
function tryCreateElementForInput(input) {
    if(!input.type || input.type == "none")
        return null;
    if(!input.is_input)
        return null;
    
    const longString = input.type == "string_long";
    if(longString || input.type == "string") {
        let element = null;
        if(longString) {
            element = document.createElement('textarea');
            element.onwheel = (event) => { event.stopPropagation(); }
        }
        else {
            element = document.createElement('input');
            element.setAttribute("type", "text");
        }

        element.onmousedown = (event) => { event.stopPropagation(); }
        element.onmouseup = (event) => { event.stopPropagation(); }
        element.oninput = () => { onConnectionMapChanged(); }

        if(input.max_length)
            element.setAttribute("maxlength", input.max_length);
        if(input.placeholder)
            element.setAttribute("placeholder", input.placeholder);
        
        input.getUserData = () => {
            return element.value;
        };
        input.disableUserData = () => {
            element.remove();
            input.getUserData = null;
            input.disableUserData = null;
        };
        
        insertAfter(element, input.element.parentElement);
        return;
    }

    if(input.type == "boolean") {
        const element = document.createElement('input');
        element.setAttribute("type", "checkbox");

        element.onmousedown = (event) => { event.stopPropagation(); }
        element.onmouseup = (event) => { event.stopPropagation(); }
        element.onclick = () => { onConnectionMapChanged(); }

        if(input.default)
            element.checked = input.default;
        
        input.getUserData = () => {
            return new Boolean(element.checked);
        };
        input.disableUserData = () => {
            element.remove();
            input.getUserData = null;
            input.disableUserData = null;
        };
        
        input.element.parentElement.appendChild(element);
    }
}
function createNodeData(x, y, title, color, inputs, outputs, text, runFunction) {
    return {
        selected: false,
        x: x,
        y: y,
        title: title,
        text: text,
        color: color,
        inputs: inputs,
        outputs: outputs,
        run: runFunction,
        isRootNode: function() {
            if(!this.inputs)
                return true;
            if(this.inputs.length === 0)
                return true;
            
            var areAllSolo = true;
            this.inputs.forEach(input => {
                areAllSolo &= input.connection == null;
            });

            return areAllSolo;
        },
        isReadyToRun: function() {
            if(!this.inputs)
                return true;
            if(this.inputs.length === 0)
                return true;
            
            var isReady = true;
            this.inputs.forEach(input => {
                if(!input.connection)
                    return;
                isReady &= input.is_evaluated;
            });
            
            return isReady;
        }
    };
}
function addNodeFromData(nodeData) {
    const node = document.createElement('div');
    const nodeHeader = document.createElement('p');
    const nodeContents = document.createElement('div')
    
    const nodeIO = document.createElement('div');
    node.className = "node";
    node.onwheel = (event) => { handleWheelAny(event) };

    nodeHeader.className = "nodeheader";
    nodeContents.className = "nodecontents";
    nodeIO.className = "nodeio";

    // node I/O
    if(nodeData.inputs) {
        for (let inputIndex = 0; inputIndex < nodeData.inputs.length; inputIndex++) {
            const input = nodeData.inputs[inputIndex];
            input.parent = nodeData;
            input.is_input = true;
            input.is_evaluated = false;
            input.connection = null;

            const inputElement = document.createElement('div');
            const text = document.createElement('p');
            inputElement.className = "inputelement";
            text.className = "fieldtext";
            text.innerText = input.name;
            
            if(!input.disable_port) {
                const circle = document.createElement('div');
                circle.setAttribute("index", inputIndex);
                circle.onmousedown = function(event) { onPortMouseDown(event, input) };
                circle.onmouseup = function(event) { onPortMouseUp(event, input) };
                circle.onmousemove = (event) => { handleMoveCircle(circle, event); };
                circle.className = "circle circleinput";
                circle.style.backgroundColor = ioColorFromType(input.type, nodeData.color);
                inputElement.appendChild(circle);
                input.element = circle;
            } else {
                input.element = text;
                text.style.marginLeft = "12px";
            }

            inputElement.appendChild(text);
            nodeIO.appendChild(inputElement);
            input.io = nodeIO;

            tryCreateElementForInput(input);
        }
    } else if(nodeData.outputs) {
        const inputElement = document.createElement('div');
        inputElement.className = "inputelement";
        nodeIO.appendChild(inputElement);
    }

    if(nodeData.outputs) {
        for (let outputIndex = 0; outputIndex < nodeData.outputs.length; outputIndex++) {
            const output = nodeData.outputs[outputIndex];
            output.parent = nodeData;
            output.is_input = false;
            output.is_evaluated = false;
            output.connection = null;

            const outputElement = document.createElement('div');
            const circle = document.createElement('div');
            const text = document.createElement('p');
            
            circle.setAttribute("index", outputIndex);
            circle.onmousedown = function(event) { onPortMouseDown(event, output); };
            circle.onmouseup = function(event) { onPortMouseUp(event, output); };
            circle.onmousemove = (event) => { handleMoveCircle(circle, event); };
            outputElement.className = "outputelement";
            circle.className = "circle circleoutput";
            text.className = "fieldtext";

            circle.style.backgroundColor = ioColorFromType(output.type, nodeData.color);
            text.innerText = output.name;

            outputElement.appendChild(circle);
            outputElement.appendChild(text);
            nodeIO.appendChild(outputElement);
            output.io = nodeIO;
            output.element = circle;
        }
    }

    node.style.borderColor = nodeData.color;
    nodeHeader.style.backgroundColor = nodeData.color;
    nodeHeader.textContent = nodeData.title;

    node.appendChild(nodeHeader);
    node.appendChild(nodeContents);
    node.appendChild(nodeIO);
    nodeData.element = node;
    document.body.appendChild(node);

    updateNode(nodeData);
    nodes.push(nodeData);

    node.onmousedown = function() { onNodeMouseDown(nodeData); }
    node.onmouseup = function() { onNodeMouseUp(nodeData); }
    node.onmousemove = canvas.onmousemove;

    if(nodeData.text)
        nodeContents.textContent = nodeData.text;

    return nodeData;
}
function addNode(x, y, title, color, inputs, outputs, text, runFunction) {
    var nodeData = createNodeData(x, y, title, color, inputs, outputs, text, runFunction);
    return addNodeFromData(nodeData);
}


window.addEventListener('keydown', handleKeyDownAny);
canvas.onwheel = handleWheelAny;
canvas.onmousedown = (event) => {
    deleteContextMenu();
    if(event.button < 2) {
        isPanning = true;
        // deselect node if a drag doesn't begin.
        window.setTimeout(function() {
            if(!isDragging) {
                deselectNode();
                selectedPort = null;
            }
        }, 1);
    }
}
canvas.onmouseup = (event) => {
    if(event.button < 2) {
        isPanning = false;
        isDragging = false;
        selectedPort = null;
        redraw(getWindowSize());
    }
}
canvas.onmousemove = (event) => { handleMoveAny(event.clientX, event.clientY) };
canvas.oncontextmenu = (event) => {
    event.preventDefault();
    let x = event.offsetX + canvas.clientLeft;
    let y = event.offsetY + canvas.clientTop;
    const element = createContextMenu(x, y);
    canvas.parentElement.appendChild(element);
    contextMenu = element;
} ;

function isInsideWindow(x, y, window, tolerance) {
    if(!tolerance)
        tolerance = 50;
    return x >= -tolerance && x < window.width + tolerance && y >= -tolerance && y < window.height + tolerance;
}
// Draw a node line on the canvas.
function drawNodeLine(ctx, x1, y1, x2, y2, colorA, colorB) {
    ctx.lineWidth = Math.ceil(zoom * 2);

    if(colorA != colorB) {
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, colorA);
        gradient.addColorStop(1, colorB);
        ctx.strokeStyle = gradient;
    } else {
        ctx.strokeStyle = colorA;
    }

    if(fastConnectionDrawing) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        const distance = Math.sqrt(Math.pow(Math.abs(x2 - x1), 2) + Math.pow(Math.abs(y2 - y1), 2));
        const resolution = 0.05 * distance;
        const subdivision = 1 / resolution;
        for (let i = 0; i < resolution; i++) {
            const t = subdivision * i;
            const lerpedX = lerp(x1, x2, t);
            const lerpedY = lerp(y1, y2, curveFunction(t));
            ctx.lineTo(lerpedX, lerpedY);
        }
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}
// Draw the interface.
function redraw(size) {
    if(!canvas.getContext)
        return;
    
    const ctx = canvas.getContext("2d");

    // draw background
    ctx.fillStyle = "#352f35";
    ctx.fillRect(0, 0, size.width, size.height);

    // gridlines
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#2e262e";

    const gridSizeScaled = gridSize * zoom;
    for(var x = gridSizeScaled - ((panX * zoom) % gridSizeScaled); x < size.width; x += gridSizeScaled) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size.height);
        ctx.stroke();
    }
    for(var y = gridSizeScaled - ((panY * zoom) % gridSizeScaled); y < size.height; y += gridSizeScaled) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size.width, y);
        ctx.stroke();
    }

    // node connections (ports)
    if(isDragging && selectedPort) {
        const color = ioColorFromType(selectedPort.type, selectedPort.parent.color);
        const boundingRect = selectedPort.element.getBoundingClientRect();
        const sourceX = (boundingRect.left + boundingRect.right) / 2;
        const sourceY = (boundingRect.top + boundingRect.bottom) / 2;
        drawNodeLine(ctx, sourceX, sourceY, mouseX, mouseY, color, "white");
    }
    nodes.forEach(node => {
        if(!node.outputs)
            return;
        node.outputs.forEach(output => {
            if(!output.connection)
                return;
            const other = output.connection;
            const colorA = ioColorFromType(output.type, output.parent.color);
            const colorB = ioColorFromType(other.type, other.parent.color);
            const boundingRectA = output.element.getBoundingClientRect();
            const boundingRectB = other.element.getBoundingClientRect();
            const sourceX = (boundingRectA.left + boundingRectA.right) / 2;
            const sourceY = (boundingRectA.top + boundingRectA.bottom) / 2;
            const destX = (boundingRectB.left + boundingRectB.right) / 2;
            const destY = (boundingRectB.top + boundingRectB.bottom) / 2;
            if(isInsideWindow(sourceX, sourceY, size) || isInsideWindow(destX, destY, size))
                drawNodeLine(ctx, sourceX, sourceY, destX, destY, colorA, colorB);
            else
            console.log("skipping render");
        });
    });
}



function resetCanvasSize() {
    const size = getWindowSize();
    setCanvasSize(size);
    redraw(size);
}
window.onresize = function() {
    updateAllNodes();
    resetCanvasSize();
}

updateAllNodes();
resetCanvasSize();

registerNodeTemplate("concat", "Concatenates two strings.",
    createNodeData(0, 0, "Concat Strings", "white", [
        { name: "stringA", type: "string", placeholder: "First String..." },
        { name: "stringB", type: "string", placeholder: "Second String..." }
    ], [
        { name: "result", type: "string" }
    ], "This node concatenates two input strings together.", (inputs) => {
        const a = inputs.stringA;
        const b = inputs.stringB;
        const result = a + b;
        return {
            result: result
        };
    }
));

registerNodeTemplate("print", "console.log(...)",
    createNodeData(0, 0, "Print to Console", "#AAAAAA", [
        { name: "text", type: "string_long", placeholder: "Enter text to print here..." }
    ], null, null, (inputs) => {
        console.log(inputs.text);
    }
));

registerNodeTemplate("boolean", "Simple checkbox input.",
    createNodeData(0, 0, "Boolean Value", "#E34671", [
        { name: "value", type: "boolean", default: true, disable_port: true }
    ], [
        { name: "current", type: "boolean" }
    ], "Allows a boolean (checkbox) input.", (inputs) => {
        return { current: inputs.value };
    }
));

// dialogue editor nodes