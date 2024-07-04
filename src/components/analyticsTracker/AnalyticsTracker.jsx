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

    this.sessionId =
      window.sessionStorage.getItem("sessionId") || this.generateSessionId();
    window.sessionStorage.setItem("rat:sessionId", this.sessionId);
    console.log("Session id:", this.sessionId);
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

    // Return null if the cookie was not found
    return null;
  }
  constructPayload() {
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
        console.log("Sending analytics data to server...");
        console.log("Event collections:", this.eventCollections);

        let payload = this.constructPayload();
        console.log("Payload:", payload);
        if (this.props.customPayload) {
          Object.assign(payload, this.props.customPayload);
        }
        if (this.props.reportingEndpoint) {
          let response = await fetch(this.props.reportingEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(this.eventCollections),
          });
          if (response.ok) {
            console.log("Successfully sent analytics data to server!");
            this.eventCollections.length = 0;
            callback();
          } else {
            console.log(
              "Failed to send analytics data to server:",
              response.status
            );
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
        console.log("Error sending analytics data to server:", error);
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
    console.log(`Event: ${eventName}`, data);

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
      console.log("Tracking view event...");

      if (this.eventCollections.length > 4) {
        this.report(() => {
          console.log("Reported!");
        });
      }
    } else if (eventName === "click") {
      console.log("Tracking click event...");

      this.report();
    }
  }

  handleClick = debounce((event) => {
    console.log("Click event caught!");
    const target = event.target.closest("[data-component]") || null;

    const elementName =
      event.target.getAttribute("data-element") || event.target.tagName;

    const data = event.target.getAttribute("data-element-data");
    console.log("Tracking click event...");
    console.log("Component:", elementName);
    console.log("Data:", data);
    let clickCoords =
      event.nativeEvent.offsetX + "x" + event.nativeEvent.offsetY;
    console.log("Click coordinates:", clickCoords);
    let clickData = JSON.stringify({ clickCoords, data });
    this.trackEvent("click", {
      eventData: clickData,
      elementName,
      componentName: target ? target.getAttribute("data-component") : "",
    });
  }, 300); // debounce time in milliseconds

  handleIntersect = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const componentName = entry.target.getAttribute("data-component");
        const data = entry.target.getAttribute("data-component-data");
        console.log("Tracking view event...");
        console.log("Component:", componentName);
        let scrollPercentage = entry.intersectionRatio * 100;
        console.log("Scroll percentage:", scrollPercentage);
        let scrollPosition = window.pageYOffset;
        console.log("Scroll position:", scrollPosition);
        let scrollData = JSON.stringify({
          scrollPercentage,
          scrollPosition,
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
    mutationsList.forEach((mutation) => {
      console.log("Mutation Type:", mutation.type);
      if (mutation.type === "childList") {
        console.log("Added Nodes:", mutation.addedNodes);
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.hasAttribute("data-component")) {
            console.log("Observing Node:", node);
            this.observer.observe(node);
          }
          node.querySelectorAll("[data-component]").forEach((childNode) => {
            console.log("Observing Child Node:", childNode);
            this.observer.observe(childNode);
          });
        });
      }
    });
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

    document
      .querySelectorAll("[data-component]")
      .forEach((component) => this.observer.observe(component));

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
