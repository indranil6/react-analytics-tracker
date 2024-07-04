import React, { Component } from "react";

let intervalid;
let visibilityChange;
const REPORT_HEARTBEAT_INTERVAL = 4000;
let eventCollections = [];

export class AnalyticsTracker extends Component {
  async report(callback = () => {}) {
    let response = await fetch(this.props.reportingEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventCollections),
    });
    if (response.ok) {
      eventCollections.length = 0;
      callback();
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
    if (eventName === "view") {
      console.log("Tracking view event...");
      if (eventCollections.length > 4) {
        this.report(() => {
          eventCollections.push({
            data: data.eventData,
            event: eventName,
            element: data.elementName,
            component: data.componentName,
          });
        });
      } else {
        eventCollections.push({
          data: data.eventData,
          event: eventName,
          element: data.elementName,
          component: data.componentName,
        });
      }
    } else if (eventName === "click") {
      console.log("Tracking click event...");
      let postData = [];
      postData.push({
        data: data.eventData ? JSON.stringify(data.eventData) : "",
        event: eventName,
        element: data.elementName,
        component: data.componentName,
      });
      eventCollections = eventCollections.concat(postData);
      this.report();
    }
  }

  handleClick = (event) => {
    console.log("Click event caught!");
    const target = event.target.closest("[data-component]");

    if (target) {
      const elementName =
        event.target.getAttribute("data-element") || event.target.tagName;

      const data = event.target.getAttribute("data-element-data");
      console.log("Tracking click event...");
      console.log("Component:", elementName);
      console.log("Data:", data);
      this.trackEvent("click", {
        eventData: data,
        elementName,
        componentName: target.getAttribute("data-component"),
      });
    }
  };

  handleIntersect = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const componentName = entry.target.getAttribute("data-component");
        const data = entry.target.getAttribute("data-element-data");
        console.log("Tracking view event...");
        console.log("Component:", componentName);
        this.trackEvent("view", {
          eventData: data,
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
    }, REPORT_HEARTBEAT_INTERVAL);
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
