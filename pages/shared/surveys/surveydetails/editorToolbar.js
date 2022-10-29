import React from "react";
import { Quill } from "react-quill";
import SaveIcon from "../../../../../assets/icon/save.png";
import ColorIcon from "../../../../../assets/icon/color.png";
import LinkIcon from "../../../../../assets/icon/link.png";

// Set custom icons for quill editor
var icons = Quill.import("ui/icons");
icons["color"] = `<img src="${ColorIcon}" alt=''/>`;
icons["link"] = `<img src="${LinkIcon}" alt=''/>`;

var Link = Quill.import('formats/link');
Link.sanitize = function(url) {
  // modify url if desired
  url=url.includes('http')?url:'https://'+url
  return url;
}

   
const TradeMarkSymbol = () => <span>™</span>;
const RegisteredSymbol = () => <span>®</span>;
const LessThanSymbol = () => <span>≤</span>;
const GreaterThanSymbol = () => <span>≥</span>;

// Undo button
const CustomUndo = () => (
  <svg width="19" height="8" viewBox="0 0 19 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.4 1.4C5.7 1.7 4.2 2.3 2.8 3.4L0 0.5V7.5H7L4.3 4.8C8 2.2 13.1 3 15.8 6.7C16 7 16.2 7.2 16.3 7.5L18.1 6.6C15.9 2.8 11.7 0.7 7.4 1.4Z" fill="#00000054"/>
  </svg>
);
// Redo button icon component for Quill editor
const CustomRedo = () => (
  <svg width="18" height="8" viewBox="0 0 18 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.6 1.4C12.3 1.7 13.8 2.3 15.2 3.4L18 0.5V7.5H11L13.7 4.8C10 2.1 4.9 3 2.3 6.7C2.1 7 1.9 7.2 1.8 7.5L0 6.6C2.1 2.8 6.3 0.7 10.6 1.4Z" fill="#00000054"/>
  </svg>
);
// Save button component for Quill editor
const CustomButton = () => <img src={SaveIcon} />;

// Undo and redo functions for Custom Toolbar
function undoChange() {
  this.quill.history.undo();
}
function redoChange() {
  this.quill.history.redo();
}

function insertTrademark() {
  const cursorPosition = this.quill.getSelection().index;
  this.quill.insertText(cursorPosition, '™');
  this.quill.setSelection(cursorPosition + 1);
}
function insertRegistered() {
  const cursorPosition = this.quill.getSelection().index;
  this.quill.insertText(cursorPosition, '®');
  this.quill.setSelection(cursorPosition + 1);
}
function insertGreaterSymbol() {
  const cursorPosition = this.quill.getSelection().index;
  this.quill.insertText(cursorPosition, '≥');
  this.quill.setSelection(cursorPosition + 1);
}
function insertLessSymbol() {
  const cursorPosition = this.quill.getSelection().index;
  this.quill.insertText(cursorPosition, '≤');
  this.quill.setSelection(cursorPosition + 1);
}

var bindings = {
  // custom keyboard bindings for shortcut keys in quill editor
  customScript: {
    key: 'S',
    shiftKey: true,
    shortKey:true,
    handler: function(range, context) {
      // Handle shift+b
      this.quill.formatText(range, 'script', 'super');
    }
  },
  customAlignCenter: {
    key: 'C',
    shiftKey: true,
    shortKey:true,
    handler: function(range, context) {
      this.quill.format('align', 'center');
    }
  },
  customAlignRight: {
    key: 'R',
    shiftKey: true,
    shortKey:true,
    handler: function(range, context) {
      this.quill.format('align', 'right');
    }
  },
  customAlignLeft: {
    key: 'L',
    shiftKey: true,
    shortKey:true,
    handler: function(range, context) {
      this.quill.format('align', '');
    }
  },
  customAlignJustify: {
    key: 'J',
    shiftKey: true,
    shortKey:true,
    handler: function(range, context) {
      this.quill.format('align', 'justify');
    }
  },
};

const Delta = Quill.import('delta');

function matchMsWordList(node, delta) {
  // Clone the operations
  let ops = delta.ops.map((op) => Object.assign({}, op));

  // Trim the front of the first op to remove the bullet/number
  let bulletOp = ops.find((op) => op.insert && op.insert.trim().length);
  if (!bulletOp) { return delta }

  bulletOp.insert = bulletOp.insert.trimLeft();
  let listPrefix = bulletOp.insert.match(/^.*?(^·|\.)/) || bulletOp.insert[0];
  bulletOp.insert = bulletOp.insert.substring(listPrefix[0].length, bulletOp.insert.length).trimLeft();

  // Trim the newline off the last op
  let last = ops[ops.length-1];
  last.insert = last.insert.substring(0, last.insert.length - 1);

  // Determine the list type
  let listType = listPrefix[0].length === 1 ? 'bullet' : 'ordered';

  // Determine the list indent
  let style = node.getAttribute('style').replace(/\n+/g, '');
  let levelMatch = style.match(/level(\d+)/);
  let indent = levelMatch ? levelMatch[1] - 1 : 0;

  // Add the list attribute
  ops.push({insert: '\n', attributes: {list: listType, indent}})

  return new Delta(ops);
}

function maybeMatchMsWordList(node, delta) {
  if (delta.ops[0].insert.trimLeft()[0] === '·') {
    return matchMsWordList(node, delta);
  }

  return delta;
}

const MSWORD_MATCHERS = [
  ['p.MsoListParagraphCxSpFirst', matchMsWordList],
  ['p.MsoListParagraphCxSpMiddle', matchMsWordList],
  ['p.MsoListParagraphCxSpLast', matchMsWordList],
  ['p.MsoListParagraph', matchMsWordList],
  ['p.msolistparagraph', matchMsWordList],
  ['p.MsoNormal', maybeMatchMsWordList]
];

const handlers={
        undo: undoChange,
        redo: redoChange,
        insertTrademark:insertTrademark,
        insertRegistered:insertRegistered,
        insertLessSymbol:insertLessSymbol,
        insertGreaterSymbol:insertGreaterSymbol
}

// Modules object for setting up the Quill editor
export const modules = {
  "rich-editor-synopsis": {
    toolbar: {
      container: "#rich-editor-synopsis",
      handlers: handlers,
    },
    clipboard: { matchers: MSWORD_MATCHERS },
    keyboard: {
      bindings: bindings
    },
    history: {
      delay: 500,
      maxStack: 100,
      userOnly: true,
    },
  },
  "rich-editor-recommendation":{
    toolbar: {
      container: "#rich-editor-recommendation",
      handlers: handlers,
    },
    clipboard: { matchers: MSWORD_MATCHERS },
    keyboard: {
      bindings: bindings
    },
    history: {
      delay: 500,
      maxStack: 100,
      userOnly: true,
    },
  },
  "rich-editor-trials": {
    toolbar: {
      container: "#rich-editor-trials",
      handlers: handlers,
    },
    clipboard: { matchers: MSWORD_MATCHERS },
    keyboard: {
      bindings: bindings
    },
    history: {
      delay: 500,
      maxStack: 100,
      userOnly: true,
    },
  },
  "rich-editor-references": {
    toolbar: {
      container: "#rich-editor-references",
      handlers: handlers,
    },
    clipboard: { matchers: MSWORD_MATCHERS },
    keyboard: {
      bindings: bindings
    },
    history: {
      delay: 500,
      maxStack: 100,
      userOnly: true,
    },
  },
};

// Formats objects for setting up the Quill editor
export const formats = [
  "header",
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "align",
  "strike",
  "script",
  "blockquote",
  "background",
  "list",
  "bullet",
  "indent",
  "link",
  "image",
  "color",
  "code-block",
];

// Quill Toolbar component
export const QuillToolbar = (props) => (
  props.id&&<div id={props.id}>
    <span className="ql-formats">
      <button title="Bold (ctrl+b)" className="ql-bold" />
      <button title="Italic (ctrl+i)" className="ql-italic" />
      <button title="Underline (ctrl+u)" className="ql-underline" />
      <select title="Pick color" className="ql-color">
        <option value="#ffffff" />
        <option value="#45C5F3" />
        <option value="#5B4EDE" />
        <option value="#7817D6" />
        <option selected />
      </select>
      <select title="background" className="ql-background">
        <option value="#FFFF00" />
        <option selected />
      </select>
      
    </span>
    <span className="ql-formats">
      <button title="Left align (ctrl+shift+l)" class="ql-align" value=""></button>
      <button title="Center align (ctrl+shift+c)" class="ql-align" value="center"></button>
      <button title="Right align (ctrl+shift+r)" class="ql-align" value="right"></button>
      <button title="Justify (ctrl+shift+j)" class="ql-align" value="justify"></button>
      <button title="Numbering list" className="ql-list" value="ordered" />
      <button title="Bullet list" className="ql-list" value="bullet" />
      <button title="Right indent" className="ql-indent" value="-1" />
      <button title="Left indent" className="ql-indent" value="+1" />
    </span>
    <span className="ql-formats">
      <button title="Link" className="ql-link" />
      <button title="Superscript (ctrl+shift+s)" className="ql-script" value="super" />
    </span>
    {/* <span className="ql-formats">
      <button onClick={props.onSave} className="ql-insertStar">
        <CustomButton />
      </button>
    </span> */}
    <button className="ql-insertTrademark">
      <TradeMarkSymbol/>
    </button>
    <button className="ql-insertRegistered">
      <RegisteredSymbol/>
    </button>
    <button className="ql-insertLessSymbol">
      <LessThanSymbol/>
    </button>
    <button className="ql-insertGreaterSymbol">
      <GreaterThanSymbol/>
    </button>
    <span className="ql-formats">
      <button title="Undo (ctrl+z)" className="ql-undo">
        <CustomUndo />
      </button>
      <button title="Redo (ctrl+y)" className="ql-redo">
        <CustomRedo />
      </button>
    </span>
  </div>
);

export default QuillToolbar;
