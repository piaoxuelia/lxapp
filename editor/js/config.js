/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	config.toolbarGroups = [
		{ name: 'links', groups: [ 'links' ] },
		{ name: 'insert', groups: [ 'insert' ] },
		'/',
		{ name: 'paragraph', groups: [ 'list', 'indent', 'blocks' ] },
	];

	config.removeButtons = 'Underline,Subscript,Superscript,Cut,Copy,Paste,PasteText,PasteFromWord,Undo,Redo,Scayt,Unlink,Anchor,Image,Table,SpecialChar,Maximize,Source,Bold,Italic,Strike,RemoveFormat,Outdent,Indent,Styles,Format,About';
};


