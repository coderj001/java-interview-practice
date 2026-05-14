import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { java } from "@codemirror/lang-java";
import { oneDark } from "@codemirror/theme-one-dark";
import { vim } from "@replit/codemirror-vim";

function createEditor({ element, value, vimMode }) {
  const extensions = [history(), keymap.of([...defaultKeymap, ...historyKeymap]), java(), oneDark, EditorView.lineWrapping];
  if (vimMode) extensions.push(vim());
  const state = EditorState.create({ doc: value || "", extensions });
  return new EditorView({ state, parent: element });
}

window.CodeMirrorApp = { createEditor };
