// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();
    //const options = getOptions();
    const oldState = vscode.getState();
    console.log(oldState)
    const eGridDiv = document.getElementById('myGrid');
    //console.log(options)
    console.log(oldState)

    var columnDefs = [
        { headerName: "Make", field: "make" },
        { headerName: "Model", field: "model" },
        { headerName: "Price", field: "price" }
    ];
    console.log(columnDefs)

    // specify the data
    var rowData = [
        { make: "Toyota", model: "Celica", price: 35000 },
        { make: "Ford", model: "Mondeo", price: 32000 },
        { make: "Porsche", model: "Boxter", price: 72000 }
    ];

    // let the grid know which columns and what data to use
    var gridOptions = {
        columnDefs: columnDefs,
        rowData: rowData
    };

    // create the grid passing in the div to use together with the columns & data we want to use
    new agGrid.Grid(eGridDiv, gridOptions);

    //console.log(counter)
    //console.log(oldState);
    //let currentCount = (oldState && oldState.count) || 0;
    //counter.textContent = currentCount;

    //setInterval(() => {
    //counter.textContent = currentCount++;

    // Update state
    //vscode.setState({ count: currentCount });

    // Alert the extension when the cat introduces a bug
    //if (Math.random() < Math.min(0.001 * currentCount, 0.05)) {
    // Send a message back to the extension
    //vscode.postMessage({
    //    command: 'alert',
    //    text: '🐛  on line ' + currentCount
    //});
    //}
    //}, 100);

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case 'refactor':
                //currentCount = Math.ceil(currentCount * 0.5);
                //counter.textContent = currentCount;
                break;
        }
    });
}());