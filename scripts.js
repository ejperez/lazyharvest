const output = document.getElementById( 'output' ),
	copyButton = document.getElementById( 'js-copy' );

function extractDaily () {
	if ( !document.getElementById( 'day-view-entries' ) ) {
		return 'ERROR: Not in Harvest daily timesheet page!';
	}

	return [...document.querySelectorAll( '#day-view-entries tr' )].map( ( row ) => {
		let client = row.querySelector( '.entry-client' ),
			task = row.querySelector( '.entry-task' );
		notes = row.querySelector( '.notes' );

		if ( !client || !task || !notes ) {
			return null;
		}

		client = client.innerText;
		notes = ' - ' + notes.innerText;
		task = task.innerText.split( ' ' );
		if ( task.length > 1 ) {
			task.shift();
		}
		task = task.length ? ' (' + task.join( ' ' ) + ')' : '';

		return client + notes + task;
	} ).filter( row => row ).join( '\r\n' );
}

function extractWeekly () {
	if ( !document.getElementById( 'dtr-table' ) ) {
		return 'ERROR: Not in Harvest weekly report page!';
	}

	return Object.entries( [...document.getElementById( 'dtr-table' ).querySelectorAll( 'tbody tr' )].reduce( ( output, row ) => {
		const contents = row.querySelectorAll( 'td' );

		if ( row.classList.contains( 'entry-notes' ) ) {
			output[output.length - 1].task = contents[1].innerText;
		} else if ( row.classList.contains( 'entry-has-notes' ) || row.querySelector( 'td' ) ) {
			output.push( {
				project: contents[0].innerText + ' (' + contents[1].innerText + ')',
				task: ''
			} );
		}

		return output;
	}, [] ).reduce( ( output, row ) => {
		if ( row.project in output && output[row.project].indexOf( row.task ) === -1 ) {
			output[row.project].push( row.task );
		} else {
			output[row.project] = [row.task];
		}

		return output;
	}, {} ) ).map( ( row ) => {
		return row[0] + '\r\n' + row[1].filter( row2 => row2 ).map( ( row2 ) => {
			return '    - ' + row2;
		} ).join( '\r\n' );
	} ).join( '\r\n\r\n' );
}

document.getElementById( 'js-extract-daily' ).addEventListener( 'click', () => {
	chrome.tabs.query(
		{ active: true },
		function ( tabs ) {
			const { id: tabId } = tabs[0];

			chrome.scripting.executeScript(
				{
					target: { tabId: tabId },
					func: extractDaily,
				},
				( injectionResults ) => {
					for ( const frameResult of injectionResults ) {
						output.value += frameResult.result;
					}
				}
			);
		}
	);
} );

document.getElementById( 'js-extract-weekly' ).addEventListener( 'click', () => {
	chrome.tabs.query(
		{ active: true },
		function ( tabs ) {
			const { id: tabId } = tabs[0];

			chrome.scripting.executeScript(
				{
					target: { tabId: tabId },
					func: extractWeekly,
				},
				( injectionResults ) => {
					for ( const frameResult of injectionResults ) {
						output.value += frameResult.result;
					}
				}
			);
		}
	);
} );

copyButton.addEventListener( 'click', ( e ) => {
	navigator.clipboard.writeText( output.value );

	copyButton.innerText = 'Copied!';
	const originalText = copyButton.innerText;

	setTimeout( () => copyButton.innerText = originalText, 1000 );
} );
