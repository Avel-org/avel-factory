import React from "react";

/**
 * What Claude Design's runtime did between the logic and the markup, kept so the converted views
 * render exactly as the design did.
 */

/**
 * The design's logic base class. It isn't a React component: a host component (see
 * `hostLogic`) owns one instance. `setState` applies at once, so `this.state` is current
 * straight after the call, then the host re-renders. Lifecycle methods are called by the host.
 */
export class DCLogic {
  constructor(props) {
    this.props = props || {};
    this.state = {};
    this.__host = null;
  }
  setState(update, cb) {
    const prev = this.state;
    const patch = typeof update === "function" ? update(prev) : update;
    this.state = { ...prev, ...patch };
    if (this.__host) this.__host.setState((s) => ({ __v: s.__v + 1 }), cb);
  }
  forceUpdate() {
    if (this.__host) this.__host.forceUpdate();
  }
  componentDidMount() {}
  componentDidUpdate() {}
  componentWillUnmount() {}
  /** The flat object the views render against (merged over props). */
  renderVals() {
    return {};
  }
}

/** Wraps a DCLogic class and a view into a React component, as Claude Design's host did. */
export function hostLogic(Logic, View, displayName) {
  class Host extends React.Component {
    constructor(props) {
      super(props);
      this.state = { __v: 0 };
      this.logic = new Logic(props);
      this.logic.__host = this;
    }
    componentDidMount() {
      this.logic.componentDidMount();
    }
    componentDidUpdate(prevProps) {
      this.logic.props = this.props;
      this.logic.componentDidUpdate(prevProps);
    }
    componentWillUnmount() {
      this.logic.componentWillUnmount();
    }
    render() {
      this.logic.props = this.props;
      const vals = { ...this.props, ...this.logic.renderVals() };
      return (
        <div className="sc-host" data-sc-name={displayName}>
          <View vals={vals} />
        </div>
      );
    }
  }
  Host.displayName = displayName;
  return Host;
}

/** A style string ("--dot: red; margin-top: 4px") as a React style object; objects pass through. */
export function css(style) {
  if (typeof style !== "string") return style;
  const o = {};
  for (const decl of style.split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    o[prop.startsWith("--") ? prop : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = decl.slice(i + 1).trim();
  }
  return o;
}

/** What a repeat walks: the value when it's an array, else nothing. */
export const list = (x) => (Array.isArray(x) ? x : []);
