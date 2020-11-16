function initPage() {
	const vscode = acquireVsCodeApi();
	const options = getOptions();
	console.log(options)
	//var sheet = new wijmo.grid.sheet.FlexSheet("#sheet");
	//wijmo.setCss(sheet.hostElement, { "font-family": "" });

	function getState() {
		var sorts = [];
		//var items = sheet.sortManager.sortDescriptions.items;
		//for (var i = 0; i < items.length; i++) {
		//    var desc = items[i];
		//    sorts.push({
		//        columnIndex: desc.columnIndex,
		//        ascending: desc.ascending
		//    });
		//}
		var state = {
			uri: options.uri,
			previewUri: options.previewUri,
			data: options.state
			//    selectedSheetIndex: sheet.selectedSheetIndex,
			//    filterDefinition: sheet.filter.filterDefinition,
			//    sortDescriptions: JSON.stringify(sorts),
			//    scrollPosition: sheet.scrollPosition,
			//    version: "3.0.36"
		};
		console.log(state)
		return state;
	}

	function preserveState() {
		var state = getState();
		console.log(state)
		vscode.setState(state);
		vscode.postMessage({ save: true, state: state });
	}

	function applyState() {
		if (ignoreState()) return;
		var json = vscode.getState() || options.state;
		console.log(json)
		//if (json && json.version) {
		//    if (json.selectedSheetIndex >= 0) {
		//        sheet.selectedSheetIndex = json.selectedSheetIndex;
		//    }
		//    sheet.filter.filterDefinition = json.filterDefinition;
		//    if (json.sortDescriptions) {
		//        var sorts = JSON.parse(json.sortDescriptions);
		//        sorts = sorts.map((s) => {
		//            return new wijmo.grid.sheet.ColumnSortDescription(s.columnIndex, s.ascending);
		//        });
		//        sheet.sortManager.sortDescriptions = new wijmo.collections.CollectionView(sorts);
		//    }
		//    if (json.scrollPosition) {
		//        sheet.scrollPosition = json.scrollPosition;
		//    }
		//}
	}

	//var news = wijmo.getElement("[wj-part='new-sheet']");
	//news.parentElement.removeChild(news);

	//sheet.hostElement.addEventListener("contextmenu", e => {
	//    e.preventDefault();
	//}, true);

	//sheet.loaded.addHandler(() => {
	//    var style = getSheetStyle(sheet);
	//    sheet.sheets.forEach(s => {
	//        s.tables.forEach(t => {
	//            t.style = style;
	//        });
	//    });
	//    sheet.isReadOnly = true;
	//   sheet.showMarquee = false;
	applyState();
	preserveState();

	//    setTimeout(() => {
	//        sheet.autoSizeColumn(0, true);
	//    }, 0);

	//    sheet.filter.filterApplied.addHandler(() => {
	//        preserveState();
	//    });

	//    sheet.selectedSheetChanged.addHandler(() => {
	//        preserveState();
	//        sheet.autoSizeColumn(0, true);
	//    });

	//    sheet.sortManager.sortDescriptions.collectionChanged.addHandler(() => {
	//        preserveState();
	//    });

	//    sheet.scrollPositionChanged.addHandler(() => {
	//        preserveState();
	//    });
	//});

	vscode.postMessage({ refresh: true });
}

function resizeSheet() {
	const eGridDiv = document.getElementById('myGrid');
	eGridDiv.style.height = window.innerHeight.toString() + "px";
}

function processData(rowData) {
	var dataset = []
	var rows = rowData.split(/\r\n\r\n/);
	for (let row of rows) {
		if (row.trim().length === 0) { continue; };
		var jsonRow = {};
		var columns = row.split(/\r?\n/);
		for (let column of columns) {
			if (column.trim().length === 0) { continue; };
			var columnName = column.split(":")[0].trim()
			var columnValue = column.split(":")[1].trim()
			jsonRow[columnName] = columnValue
		};
		dataset.push(jsonRow)
	};
	return dataset;
}

var gridOptions = {}
var allRowData = 0

function diffRows(newArray) {
	if (newArray.length > window.allRowData) {
		newArray.splice(0, window.allRowData)
		return newArray
	}
	return []
}

function addItems(newItems) {
	//var res = gridOptions.api.applyTransaction({
	//	add: newItems,
	//});
	gridOptions.api.applyTransactionAsync({ add: newItems });
}
window.addEventListener("message", event => {
	if (event.data.refresh) {

		if (event.data.content) {

			const content = event.data.content

			if (content.state) {
				let rowData = processData(content.state)
				//console.log("incoming " + rowData.length)

				if (rowData.length > 0) {

					if (Object.keys(window.gridOptions).length === 0) {
						const keys = Object.keys(rowData[0]);

						var columnDefs = keys.map(element => {
							return { headerName: element, field: element, filter: true }
						});

						window.allRowData = rowData.length
						//Create gridOptions
						window.gridOptions = {
							columnDefs: columnDefs,
							rowData: rowData,
							defaultColDef: {
								width: 150,
								sortable: true,
								resizable: true,
								filter: true,
								/*floatingFilter: true,*/
								editable: false,
							},
							statusBar: {
								statusPanels: [
									{ statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
									{ statusPanel: 'agTotalRowCountComponent', align: 'center' },
									{ statusPanel: 'agFilteredRowCountComponent' },
									{ statusPanel: 'agSelectedRowCountComponent' },
									{ statusPanel: 'agAggregationComponent' },
								],
							},
						};

						//Set style based on vscode mode
						const className = (document.body.classList.contains('vscode-dark')) ? 'ag-theme-alpine-dark' : 'ag-theme-alpine';
						const eGridDiv = document.getElementById('myGrid');
						eGridDiv.className = className;

						// create the grid passing in the div to use together with the columns & data we want to use
						new agGrid.Grid(eGridDiv, gridOptions);
					}

					else {
						const diff = diffRows(rowData)
						window.allRowData = window.allRowData + diff.length
						if (diff.length > 0) {
							addItems(diff)
						}
					}
				}
			}
		}
	}
});