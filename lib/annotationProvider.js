'use babel';

import suggestionDB from '../data/suggestions.json'
// notice data is not being loaded from a local json file
// instead we will fetch suggestions from this URL

class AnnotationProvider {
	constructor() {
		// offer suggestions only when editing plain text or HTML files
		this.selector = '.js';

		// except when editing a comment within an HTML file
		this.disableForSelector = '';

		// make these suggestions appear above default suggestions
		this.suggestionPriority = 2;
	}

	getSuggestions(options) {
		const { editor, bufferPosition } = options;

		// getting the prefix on our own instead of using the one Atom provides
		let prefix = this.getPrefix(editor, bufferPosition);

		// all of our snippets start with "@"
		if (prefix.startsWith('@')) {
			return this.findMatchingSuggestions(prefix);
		}
	}

	getPrefix(editor, bufferPosition) {
		// the prefix normally only includes characters back to the last word break
		// which is problematic if your suggestions include punctuation (like "@")
		// this expands the prefix back until a whitespace character is met
		// you can tweak this logic/regex to suit your needs
		let line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
		let match = line.match(/\S+$/);
		return match ? match[0] : '';
	}

	findMatchingSuggestions(prefix) {
		// using a Promise lets you fetch and return suggestions asynchronously
		// this is useful for hitting an external API without causing Atom to freeze
		return new Promise((resolve) => {
			// fire off an async request to the external API
            json = suggestionDB;
			// filter json (list of suggestions) to those matching the prefix
			let matchingSuggestions = json.filter((suggestion) => {
				return suggestion.displayText.startsWith(prefix);
			});

			// bind a version of inflateSuggestion() that always passes in prefix
			// then run each matching suggestion through the bound inflateSuggestion()
			let inflateSuggestion = this.inflateSuggestion.bind(this, prefix);
			let inflatedSuggestions = matchingSuggestions.map(inflateSuggestion);

			// resolve the promise to show suggestions
			resolve(inflatedSuggestions);
		});
	}

	// clones a suggestion object to a new object with some shared additions
	// cloning also fixes an issue where selecting a suggestion won't insert it
	inflateSuggestion(replacementPrefix, suggestion) {
		return {
			displayText: suggestion.displayText,
			snippet: suggestion.snippet,
			description: suggestion.description,
			replacementPrefix: replacementPrefix, // ensures entire prefix is replaced
			iconHTML: `<i class="${suggestion.icon}"></i>`,
			type: 'snippet',
			rightLabelHTML: '<span class="aab-right-label">Snippet</span>', // look in /styles/atom-slds.less
            descriptionMoreURL: 'https://cr.houzz.net/w/api/graphql/annotations/'
		};
	}

	onDidInsertSuggestion(options) {
		atom.notifications.addSuccess(options.suggestion.displayText + ' was inserted.');
	}
}
export default new AnnotationProvider();
