var obsidian = require('obsidian');

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE
function simple (CodeMirror) {
  CodeMirror.defineSimpleMode = function (name, states) {
    CodeMirror.defineMode(name, function (config) {
      return CodeMirror.simpleMode(config, states);
    });
  };

  CodeMirror.simpleMode = function (config, states) {
    ensureState(states, "start");
    var states_ = {},
        meta = states.meta || {},
        hasIndentation = false;

    for (var state in states) if (state != meta && states.hasOwnProperty(state)) {
      var list = states_[state] = [],
          orig = states[state];

      for (var i = 0; i < orig.length; i++) {
        var data = orig[i];
        list.push(new Rule(data, states));
        if (data.indent || data.dedent) hasIndentation = true;
      }
    }

    var mode = {
      startState: function () {
        return {
          state: "start",
          pending: null,
          local: null,
          localState: null,
          indent: hasIndentation ? [] : null
        };
      },
      copyState: function (state) {
        var s = {
          state: state.state,
          pending: state.pending,
          local: state.local,
          localState: null,
          indent: state.indent && state.indent.slice(0)
        };
        if (state.localState) s.localState = CodeMirror.copyState(state.local.mode, state.localState);
        if (state.stack) s.stack = state.stack.slice(0);

        for (var pers = state.persistentStates; pers; pers = pers.next) s.persistentStates = {
          mode: pers.mode,
          spec: pers.spec,
          state: pers.state == state.localState ? s.localState : CodeMirror.copyState(pers.mode, pers.state),
          next: s.persistentStates
        };

        return s;
      },
      token: tokenFunction(states_, config),
      innerMode: function (state) {
        return state.local && {
          mode: state.local.mode,
          state: state.localState
        };
      },
      indent: indentFunction(states_, meta)
    };
    if (meta) for (var prop in meta) if (meta.hasOwnProperty(prop)) mode[prop] = meta[prop];
    return mode;
  };

  function ensureState(states, name) {
    if (!states.hasOwnProperty(name)) throw new Error("Undefined state " + name + " in simple mode");
  }

  function toRegex(val, caret) {
    if (!val) return /(?:)/;
    var flags = "";

    if (val instanceof RegExp) {
      if (val.ignoreCase) flags = "i";
      val = val.source;
    } else {
      val = String(val);
    }

    return new RegExp((caret === false ? "" : "^") + "(?:" + val + ")", flags);
  }

  function asToken(val) {
    if (!val) return null;
    if (val.apply) return val;
    if (typeof val == "string") return val.replace(/\./g, " ");
    var result = [];

    for (var i = 0; i < val.length; i++) result.push(val[i] && val[i].replace(/\./g, " "));

    return result;
  }

  function Rule(data, states) {
    if (data.next || data.push) ensureState(states, data.next || data.push);
    this.regex = toRegex(data.regex);
    this.token = asToken(data.token);
    this.data = data;
  }

  function tokenFunction(states, config) {
    return function (stream, state) {
      if (state.pending) {
        var pend = state.pending.shift();
        if (state.pending.length == 0) state.pending = null;
        stream.pos += pend.text.length;
        return pend.token;
      }

      if (state.local) {
        if (state.local.end && stream.match(state.local.end)) {
          var tok = state.local.endToken || null;
          state.local = state.localState = null;
          return tok;
        } else {
          var tok = state.local.mode.token(stream, state.localState),
              m;
          if (state.local.endScan && (m = state.local.endScan.exec(stream.current()))) stream.pos = stream.start + m.index;
          return tok;
        }
      }

      var curState = states[state.state];

      for (var i = 0; i < curState.length; i++) {
        var rule = curState[i];
        var matches = (!rule.data.sol || stream.sol()) && stream.match(rule.regex);

        if (matches) {
          if (rule.data.next) {
            state.state = rule.data.next;
          } else if (rule.data.push) {
            (state.stack || (state.stack = [])).push(state.state);
            state.state = rule.data.push;
          } else if (rule.data.pop && state.stack && state.stack.length) {
            state.state = state.stack.pop();
          }

          if (rule.data.mode) enterLocalMode(config, state, rule.data.mode, rule.token);
          if (rule.data.indent) state.indent.push(stream.indentation() + config.indentUnit);
          if (rule.data.dedent) state.indent.pop();
          var token = rule.token;
          if (token && token.apply) token = token(matches);

          if (matches.length > 2 && rule.token && typeof rule.token != "string") {
            for (var j = 2; j < matches.length; j++) if (matches[j]) (state.pending || (state.pending = [])).push({
              text: matches[j],
              token: rule.token[j - 1]
            });

            stream.backUp(matches[0].length - (matches[1] ? matches[1].length : 0));
            return token[0];
          } else if (token && token.join) {
            return token[0];
          } else {
            return token;
          }
        }
      }

      stream.next();
      return null;
    };
  }

  function cmp(a, b) {
    if (a === b) return true;
    if (!a || typeof a != "object" || !b || typeof b != "object") return false;
    var props = 0;

    for (var prop in a) if (a.hasOwnProperty(prop)) {
      if (!b.hasOwnProperty(prop) || !cmp(a[prop], b[prop])) return false;
      props++;
    }

    for (var prop in b) if (b.hasOwnProperty(prop)) props--;

    return props == 0;
  }

  function enterLocalMode(config, state, spec, token) {
    var pers;
    if (spec.persistent) for (var p = state.persistentStates; p && !pers; p = p.next) if (spec.spec ? cmp(spec.spec, p.spec) : spec.mode == p.mode) pers = p;
    var mode = pers ? pers.mode : spec.mode || CodeMirror.getMode(config, spec.spec);
    var lState = pers ? pers.state : CodeMirror.startState(mode);
    if (spec.persistent && !pers) state.persistentStates = {
      mode: mode,
      spec: spec.spec,
      state: lState,
      next: state.persistentStates
    };
    state.localState = lState;
    state.local = {
      mode: mode,
      end: spec.end && toRegex(spec.end),
      endScan: spec.end && spec.forceEnd !== false && toRegex(spec.end, false),
      endToken: token && token.join ? token[token.length - 1] : token
    };
  }

  function indexOf(val, arr) {
    for (var i = 0; i < arr.length; i++) if (arr[i] === val) return true;
  }

  function indentFunction(states, meta) {
    return function (state, textAfter, line) {
      if (state.local && state.local.mode.indent) return state.local.mode.indent(state.localState, textAfter, line);
      if (state.indent == null || state.local || meta.dontIndentStates && indexOf(state.state, meta.dontIndentStates) > -1) return CodeMirror.Pass;
      var pos = state.indent.length - 1,
          rules = states[state.state];

      scan: for (;;) {
        for (var i = 0; i < rules.length; i++) {
          var rule = rules[i];

          if (rule.data.dedent && rule.data.dedentIfLineStart !== false) {
            var m = rule.regex.exec(textAfter);

            if (m && m[0]) {
              pos--;
              if (rule.next || rule.push) rules = states[rule.next || rule.push];
              textAfter = textAfter.slice(m[0].length);
              continue scan;
            }
          }
        }

        break;
      }

      return pos < 0 ? 0 : state.indent[pos];
    };
  }
}

const VIEW_TYPE_TODOTXT_SOURCE = "trashhalo.obsidian-plugin-todotxt-source";

const replaceUnderscore = text => {
  return text.replace(/[_-]/g, " ");
};

const tokenIsDate = text => text.match(/\d{4}-\d{2}-\d{2}/);

class TodoTxtView extends obsidian.TextFileView {
  constructor(leaf, app) {
    super(leaf);
    this.app = app;
    this.suggests = {
      isShowingSuggestion() {
        return false;
      }

    };
    this.view = this;
    const view = this;
    this.editor = {
      posAtMouse(e) {
        return view.cmEditor.coordsChar({
          left: e.clientX,
          top: e.clientY
        });
      },

      getClickableTokenAt(e) {
        const cm = view.cmEditor,
              token = cm.getTokenAt(e, !0),
              tokenType = token.type;

        if (tokenType) {
          if (token.string.startsWith("@")) {
            return {
              type: "tag",
              text: `#${token.string.substring(1)}`
            };
          } else if (token.string.startsWith("+")) {
            const link = replaceUnderscore(token.string.substring(1));
            console.log(link);
            return {
              type: "internal-link",
              text: link
            };
          } else if (tokenIsDate(token.string)) {
            return {
              type: "internal-link",
              text: token.string
            };
          }

          return null;
        }
      }

    };
    this.render();
  }

  getViewData() {
    return obsidian.MarkdownSourceView.prototype.get.call(this);
  }

  setViewData(data, clear) {
    return obsidian.MarkdownSourceView.prototype.set.call(this, data, clear);
  }

  getViewType() {
    return VIEW_TYPE_TODOTXT_SOURCE;
  }

  getDisplayText() {
    return this.file ? this.file.name : "Todotxt";
  }

  getIcon() {
    return "checkmark";
  }

  onClose() {
    return Promise.resolve();
  }

  render() {
    const container = this.containerEl.children[1];
    container.empty();
    const editorEl = this.editorEl = container.createDiv("markdown-source-view mod-cm5");
    const cm = this.cmEditor = window.CodeMirror(editorEl, {
      mode: "todotxt",
      theme: "obsidian",
      lineWrapping: true,
      styleActiveLine: true,
      configureMouse: function (e, t, n) {
        return {
          addNew: n.altKey && !n.ctrlKey && !n.metaKey
        };
      }
    });
    cm.on("changes", () => this.requestSave());
    editorEl.addEventListener("mousedown", this.onCodeMirrorMousedown.bind(this));
    obsidian.MarkdownSourceView.prototype.updateOptions.call(this);
    setTimeout(() => {
      cm.refresh();
    });
  }

  passIfNoSuggestion() {}

  canAcceptExtension(ext) {
    return ext == "txt";
  }

  onCodeMirrorMousedown(e) {
    return obsidian.MarkdownSourceView.prototype.onCodeMirrorMousedown.call(this, e);
  }

  triggerClickableToken(e, t) {
    return obsidian.MarkdownView.prototype.triggerClickableToken.call(this, e, t);
  }

  getMousePosition(e) {
    return obsidian.MarkdownSourceView.prototype.getMousePosition.call(this, e);
  }

  onFileOpen(e) {
    return obsidian.MarkdownSourceView.prototype.onFileOpen.call(this, e);
  }

}

class TodoTxtPlugin extends obsidian.Plugin {
  async onload() {
    const cm = window.CodeMirror;
    simple(cm);
    cm.defineSimpleMode("todotxt", {
      start: [{
        regex: /[0-9]{4}-[0-9]{2}-[0-9]{2}/,
        token: "number"
      }, {
        regex: /\@\w+/,
        token: "keyword"
      }, {
        regex: /\+\w+/,
        token: "tag"
      }, {
        regex: /\([A-Z]\)/,
        token: "def"
      }]
    });
    this.registerView(VIEW_TYPE_TODOTXT_SOURCE, leaf => {
      return new TodoTxtView(leaf, this.app);
    });
    this.registerExtensions(["txt"], VIEW_TYPE_TODOTXT_SOURCE);
  }

}

exports.VIEW_TYPE_TODOTXT_SOURCE = VIEW_TYPE_TODOTXT_SOURCE;
exports.default = TodoTxtPlugin;
//# sourceMappingURL=main.js.map
