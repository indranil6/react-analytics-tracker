import React, { Component } from "react";

let intervalid;
let visibilityChange;
const REPORT_HEARTBEAT_INTERVAL = 4000;
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}
export class AnalyticsTracker extends Component {
  constructor(props) {
    super(props);
    this.heartBeatInterval =
      props.heartBeatInterval || REPORT_HEARTBEAT_INTERVAL;

    if (typeof window !== "undefined") {
      this.sessionId =
        window.sessionStorage.getItem("sessionId") || this.generateSessionId();
      window.sessionStorage.setItem("rat:sessionId", this.sessionId);
    }

    this.eventCollections = [];
  }
  generateSessionId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
  getCookieValue(name) {
    // Create a regular expression to find the cookie with the specified name
    const nameEQ = name + "=";
    const cookies = document.cookie.split(";");

    // Iterate through the cookies
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();

      // Check if the cookie's name matches the specified name
      if (cookie.indexOf(nameEQ) === 0) {
        // Return the value of the cookie
        return cookie.substring(nameEQ.length, cookie.length);
      }
    }

    // Return "" if the cookie was not found
    return "";
  }
  constructPayload() {
    if (typeof window === "undefined") return {};
    let payload = {
      referrer: document.referrer || window.location.ancestorOrigins[0] || "",
      url: window.location.href,
      pathname: window.location.pathname,
      hostname: window.location.hostname,
      title: document.title,
      screen: window.screen.width + "x" + window.screen.height,
      language: navigator.language,
      utmSource: this.getCookieValue("utm_source"),
      utmMedium: this.getCookieValue("utm_medium"),
      utmCampaign: this.getCookieValue("utm_campaign"),
      utmTerm: this.getCookieValue("utm_term"),
      utmContent: this.getCookieValue("utm_content"),
      sessionId: this.sessionId,
      network: this.getNetworkConnectionInfo(),
      events: this.eventCollections,
    };

    if (this.props.customPayload) {
      Object.assign(payload, this.props.customPayload);
    }

    return payload;
  }
  async report(callback = () => {}) {
    if (this.eventCollections.length > 0) {
      try {
        let payload = this.constructPayload();

        if (this.props.customPayload) {
          Object.assign(payload, this.props.customPayload);
        }
        if (this.props.reportingEndpoint) {
          if (
            this.props.onReport &&
            typeof this.props.onReport === "function"
          ) {
            this.props.onReport(payload);
          }
          let response = await fetch(this.props.reportingEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
          if (response.ok) {
            this.eventCollections.length = 0;
            callback();
          } else {
            this.eventCollections.length = 0;
            callback();
          }
        } else if (
          this.props.onReport &&
          typeof this.props.onReport === "function"
        ) {
          this.props.onReport(payload);

          this.eventCollections.length = 0;
          callback();
        }
      } catch (error) {
        this.eventCollections.length = 0;
        callback();
      }
    }
  }

  getNetworkConnection() {
    if (typeof navigator === "undefined") return null;
    return (
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection ||
      null
    );
  }

  getNetworkConnectionInfo() {
    const connection = this.getNetworkConnection();
    if (!connection) {
      return {
        isOnline: typeof navigator !== "undefined" ? navigator.onLine : false,
      };
    }
    return {
      rtt: connection.rtt,
      type: connection.type,
      saveData: connection.saveData,
      downLink: connection.downLink,
      effectiveType: connection.effectiveType,
      isOnline: navigator.onLine,
    };
  }

  trackEvent(eventName, data) {
    let newEventRow = {
      data: data.eventData,
      event: eventName,
      element: data.elementName,
      component: data.componentName,
      timestamp: Date.now(),
    };
    if (this.props.customProperties) {
      Object.assign(newEventRow, this.props.customProperties);
    }
    this.eventCollections.push(newEventRow);
    if (eventName === "view") {
      if (this.eventCollections.length > 4) {
        this.report();
      }
    } else if (eventName === "click") {
      this.report();
    }
  }

  handleClick = debounce((event) => {
    const target = event.target.closest("[data-component]") || null;

    const elementName =
      event.target.getAttribute("data-element") || event.target.tagName;

    const className = event.target.getAttribute("class") || null;
    const idName = event.target.getAttribute("id") || null;

    const data = event.target.getAttribute("data-element-data");
    let x = event.clientX;
    let y = event.clientY;

    let clickCoords = x + "x" + y;

    let clickData = JSON.stringify({
      clickCoords,
      data,
      className,
      id: idName,
    });
    this.trackEvent("click", {
      eventData: clickData,
      elementName,
      componentName: target ? target.getAttribute("data-component") : "",
    });
  }, 300); // debounce time in milliseconds

  handleIntersect = (entries) => {
    if (typeof window === "undefined") return;
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const componentName = entry.target.getAttribute("data-component");
        const data = entry.target.getAttribute("data-component-data");

        let viewedPercentage = entry.intersectionRatio * 100;

        let rect = entry.target.getBoundingClientRect();

        const rectObject = {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
        };

        let scrollPosition = window.scrollY || window.pageYOffset;
        let scrollData = JSON.stringify({
          viewedPercentage,
          scrollPosition,
          bounds: rectObject,
          data: data || "",
        });
        this.trackEvent("view", {
          eventData: scrollData,
          componentName,
          elementName: "",
        });
      }
    });
  };

  observeNewComponents = (mutationsList) => {
    if (Array.isArray(mutationsList) && mutationsList.length > 0) {
      mutationsList.forEach((mutation) => {
        if (mutation.type === "childList") {
          if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1 && node.hasAttribute("data-component")) {
                this.observer.observe(node);
              }
              const childNodes = node.querySelectorAll("[data-component]");
              if (childNodes && childNodes.length > 0) {
                childNodes.forEach((childNode) => {
                  this.observer.observe(childNode);
                });
              }
            });
          }
        }
      });
    }
  };

  componentDidMount() {
    if (typeof window === "undefined") return;

    this.observer = new IntersectionObserver(this.handleIntersect, {
      threshold: 0.1,
    });

    this.mutationObserver = new MutationObserver(this.observeNewComponents);
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
    let allComponentNodes = document.querySelectorAll("[data-component]");

    if (allComponentNodes && allComponentNodes.length > 0) {
      allComponentNodes.forEach((component) =>
        this.observer.observe(component)
      );
    }

    document.addEventListener("click", this.handleClick);

    this.handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        this.report();
      }
    };

    if (typeof document.hidden !== "undefined") {
      visibilityChange = "visibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
      visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
      visibilityChange = "webkitvisibilitychange";
    }

    document.addEventListener(visibilityChange, this.handleVisibilityChange);
    intervalid = setInterval(() => {
      this.report();
    }, this.heartBeatInterval);
  }

  componentWillUnmount() {
    document.removeEventListener("click", this.handleClick);
    this.mutationObserver.disconnect();
    this.observer.disconnect();
    if (intervalid) {
      clearInterval(intervalid);
      this.report();
    }
    document.removeEventListener(visibilityChange, this.handleVisibilityChange);
  }

  render() {
    return <>{this.props.children}</>;
  }
}
