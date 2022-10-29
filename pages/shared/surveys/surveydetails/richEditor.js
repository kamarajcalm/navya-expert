import React from "react";
import ReactQuill from "react-quill";
import EditorToolbar, { modules, formats } from "./editorToolbar";

export const Editor = (props) => {

  return (
    <div className="text-editor-container">
    {props.className&&<div id={props.className+'-editor-container'} className="text-editor">
      <EditorToolbar onSave={props.save} id={props.className}/>
      <ReactQuill
        theme="snow"
        value={props.value}
        id={props.className+'-id'}
        onChange={props.onChange}
        onBlur={props.save}
        placeholder=""
        className={props.className}
        modules={modules[props.className]}
        formats={formats}
      />
    </div>}
    </div>
  );
};

export default Editor;