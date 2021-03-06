import React from 'react'
import MonacoEditor from 'react-monaco-editor';
import { generateModelFromCode } from "./model"

const CodeEditor = (props) => {
  const editorDidMount = (editor, monaco) => {
    editor.focus()
  }

  const options = {
    selectOnLineNumbers: true
  }

  return (
    <MonacoEditor
      width="600"
      height="652"
      language="javascript"
      theme="vs-dark"
      value={props.code}
      options={options}
      onChange={props.onChange}
      editorDidMount={editorDidMount}
    />
  )
}

export default CodeEditor
