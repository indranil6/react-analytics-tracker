import React, { Component, FormEvent } from "react";

let intervalid: NodeJS.Timeout;
let visibilityChange:
  | keyof DocumentEventMap
  | "msvisibilitychange"
  | "webkitvisibilitychange";
const REPORT_HEARTBEAT_INTERVAL = 4000;

function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}
interface NetworkConnectionInfo {
  rtt?: number;
  type?: string;
  saveData?: boolean;
  downLink?: number;
  effectiveType?: string;
  isOnline: boolean;
}
enum MouseEvents {
  CLICK = "click",
  MOUSE_OVER = "mouseover",
  MOUSE_OUT = "mouseout",
  MOUSE_UP = "mouseup",
  MOUSE_DOWN = "mousedown",
  MOUSE_MOVE = "mousemove",
  MOUSE_ENTER = "mouseenter",
  MOUSE_LEAVE = "mouseleave",
  MOUSE_OVER_OUT = "mouseover mouseout",
  DOUBLE_CLICK = "dblclick",
  CONTEXT_MENU = "contextmenu",
}
enum FormEvents {
  SUBMIT = "submit",
  RESET = "reset",
}
enum InputEvents {
  CHANGE = "change",
  FOCUS = "focus",
  BLUR = "blur",
  KEYPRESS = "keypress",
  SELECT = "select",
  KEYUP = "keyup",
  KEYDOWN = "keydown",
}
enum TouchEvents {
  TOUCH_START = "touchstart",
  TOUCH_MOVE = "touchmove",
  TOUCH_END = "touchend",
  TOUCH_CANCEL = "touchcancel",
}
const EVENTS = [
  ...Object.values(MouseEvents),
  ...Object.values(FormEvents),
  ...Object.values(TouchEvents),
  ...Object.values(InputEvents),
];
console.log("EVENTS:", EVENTS);

interface EventCollection {
  data: string;
  event: string;
  element: string;
  component: string;
  timestamp: number;
  failedCount?: number | undefined;
  [key: string]: any;
}
interface AnalyticsPayload {
  appName?: string;
  appVersion?: string;
  referrer: string;
  url: string;
  pathname: string;
  hostname: string;
  title: string;
  screen: string;
  language: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  sessionId: string;
  network: NetworkConnectionInfo;
  events: Array<EventCollection>;
  [key: string]: any; // for customPayload properties
}
interface TrackData {
  eventData: string | null;
  elementName: string | null;
  componentName: string | null;
}

export interface AnalyticsTrackerProps {
  appName?: string;
  appVersion?: string;
  heartBeatInterval?: number;
  customPayload?: Record<string, any>;
  reportingEndpoint?: string;
  onReport?: (payload: AnalyticsPayload) => void;
  customProperties?: Record<string, any>;
}

export class AnalyticsTracker extends Component<AnalyticsTrackerProps> {
  private heartBeatInterval: number;
  private sessionId: string = "";
  private eventCollections: Array<EventCollection>;
  private observer: IntersectionObserver | undefined;
  private mutationObserver: MutationObserver | undefined;
  private handleVisibilityChange: (() => void) | undefined;

  constructor(props: AnalyticsTrackerProps) {
    super(props);
    this.heartBeatInterval =
      props.heartBeatInterval || REPORT_HEARTBEAT_INTERVAL;

    if (typeof window !== "undefined") {
      this.sessionId =
        window.sessionStorage.getItem("rat:sessionId") ||
        this.generateSessionId();
      window.sessionStorage.setItem("rat:sessionId", this.sessionId);
    }

    this.eventCollections = [];
  }

  private generateSessionId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private getCookieValue(name: string): string {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length, cookie.length);
      }
    }

    return "";
  }

  private constructPayload(): AnalyticsPayload {
    if (typeof window === "undefined") {
      return {
        referrer: "",
        url: "",
        pathname: "",
        hostname: "",
        title: "",
        screen: "",
        language: "",
        utmSource: "",
        utmMedium: "",
        utmCampaign: "",
        utmTerm: "",
        utmContent: "",
        sessionId: "",
        network: { isOnline: false },
        events: [],
      };
    }

    // Load any previously stored events from sessionStorage
    const storedEvents = sessionStorage.getItem("rat:storedEvents");
    const previousEvents: EventCollection[] = storedEvents
      ? JSON.parse(storedEvents)
      : [];

    // Filter out events with a failedCount of 3 or more
    const filteredPreviousEvents = previousEvents.filter(
      (event) => !event.failedCount || event.failedCount < 3
    );

    // Merge stored events with the current eventCollections
    const mergedEvents = [...filteredPreviousEvents, ...this.eventCollections];

    let payload: AnalyticsPayload = {
      appName: this.props.appName || "",
      appVersion: this.props.appVersion || "",
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
      events: mergedEvents?.map((event) => ({
        component: event.component,
        element: event.element,
        data: event.data,
        event: event.event,
        timestamp: event.timestamp,
      })),
    };

    if (this.props.customPayload) {
      Object.assign(payload, this.props.customPayload);
    }

    return payload;
  }

  async report(callback: () => void = () => {}) {
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
            sessionStorage.removeItem("rat:storedEvents");
            callback();
          } else {
            this.storeEventsInSession();
            callback();
          }
        } else if (
          this.props.onReport &&
          typeof this.props.onReport === "function"
        ) {
          this.props.onReport(payload);
          this.eventCollections.length = 0;
          sessionStorage.removeItem("rat:storedEvents");
          callback();
        }
      } catch (error) {
        this.storeEventsInSession();
        callback();
      }
    }
  }

  private storeEventsInSession() {
    // // Load any previously stored events from sessionStorage
    // const storedEvents = sessionStorage.getItem("rat:storedEvents");
    // const previousEvents: EventCollection[] = storedEvents
    //   ? JSON.parse(storedEvents)
    //   : [];

    // // Increment the failedCount for the current event collections
    // const updatedEventCollections = this.eventCollections.map((event) => ({
    //   ...event,
    //   failedCount: event.failedCount ? event.failedCount + 1 : 1,
    // }));

    // // Filter out events with a failedCount of 3 or more
    // const filteredEventCollections = updatedEventCollections.filter(
    //   (event) => event.failedCount < 3
    // );

    // // Merge and store events back in sessionStorage
    // const allEvents = [...previousEvents, ...filteredEventCollections];
    // sessionStorage.setItem("rat:storedEvents", JSON.stringify(allEvents));

    // Clear the current event collections
    this.eventCollections.length = 0;
  }

  getNetworkConnection() {
    if (typeof navigator === "undefined") return null;
    return (
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection ||
      null
    );
  }

  getNetworkConnectionInfo(): NetworkConnectionInfo {
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

  private trackEvent(
    eventName: string,
    data: TrackData,
    isToReportImmediately: boolean = false
  ) {
    let newEventRow: EventCollection = {
      data: data?.eventData || "",
      event: eventName,
      element: data?.elementName || "",
      component: data?.componentName || "",
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
    } else {
      if (isToReportImmediately) {
        this.report();
      }
    }
  }
  public trackCustomEvent(
    eventName: string,
    data: TrackData,
    isToReportImmediately: boolean = false
  ) {
    this.trackEvent(eventName, data, isToReportImmediately);
  }
  handleClick = debounce((event: MouseEvent) => {
    const target =
      (event.target as HTMLElement).closest("[data-component]") || "";

    const elementName =
      (event.target as HTMLElement).getAttribute("data-element") ||
      (event.target as HTMLElement).tagName;

    if (!elementName) {
      return;
    }
    if (event.type !== "click") {
      return;
    }

    const className = (event.target as HTMLElement).getAttribute("class") || "";
    const idName = (event.target as HTMLElement).getAttribute("id") || "";

    const data =
      (event.target as HTMLElement).getAttribute("data-element-data") || "";
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

  handleTriggerEvent = debounce(
    (event: MouseEvent & TouchEvent & FormEvent & InputEvent & Event) => {
      const eventName =
        (event.target as HTMLElement).getAttribute("data-event") || "";
      const target =
        (event.target as HTMLElement).closest("[data-component]") || "";

      const elementName =
        (event.target as HTMLElement).getAttribute("data-element") ||
        (event.target as HTMLElement).tagName;

      const isSameEvent = eventName === event.type;
      if (!isSameEvent) {
        return;
      }

      if (!elementName) {
        return;
      }

      const className =
        (event.target as HTMLElement).getAttribute("class") || "";
      const idName = (event.target as HTMLElement).getAttribute("id") || "";

      const data =
        (event.target as HTMLElement).getAttribute("data-element-data") || "";
      let eventData = JSON.stringify({
        data,
        className,
        id: idName,
      });
      this.trackEvent(eventName, {
        eventData,
        elementName,
        componentName: target ? target.getAttribute("data-component") : "",
      });
    },
    300
  ); // debounce time in milliseconds
  handleIntersect = (entries: IntersectionObserverEntry[]) => {
    if (typeof window === "undefined") return;
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const componentName = entry.target.getAttribute("data-component") || "";
        const data = entry.target.getAttribute("data-component-data") || "";

        const elementName =
          entry.target.getAttribute("data-element") || entry.target.tagName;

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
          elementName: elementName || "",
        });
      }
    });
  };

  observeNewComponents = (mutationsList: MutationRecord[]) => {
    if (Array.isArray(mutationsList) && mutationsList.length > 0) {
      mutationsList.forEach((mutation) => {
        if (mutation.type === "childList") {
          if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
              if (
                node.nodeType === 1 &&
                (node as HTMLElement).hasAttribute("data-component")
              ) {
                this.observer?.observe(node as HTMLElement);
              }
              const childNodes = (node as HTMLElement).querySelectorAll(
                "[data-component]"
              );
              if (childNodes && childNodes.length > 0) {
                childNodes.forEach((childNode) => {
                  this.observer?.observe(childNode as HTMLElement);
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
        this.observer?.observe(component)
      );
    }

    document.addEventListener("click", this.handleClick);

    //find all elements that have data-event attribute and has a value within the EVENTS array and trigger the event

    let allEventNodes = document.querySelectorAll("[data-event]");
    if (allEventNodes && allEventNodes.length > 0) {
      allEventNodes.forEach((event) => {
        let eventValue = (event as HTMLElement).getAttribute("data-event");
        let eventTargetElement = (event as HTMLElement).getAttribute(
          "data-element"
        );
        if (
          eventValue &&
          EVENTS.includes(
            eventValue as MouseEvents | FormEvents | TouchEvents | InputEvents
          )
        ) {
          document.addEventListener(eventValue, this.handleTriggerEvent);
        }
      });
    }

    this.handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        this.report();
      }
    };

    if (typeof document.hidden !== "undefined") {
      visibilityChange = "visibilitychange";
    } else if (typeof (document as any).msHidden !== "undefined") {
      visibilityChange = "msvisibilitychange";
    } else if (typeof (document as any).webkitHidden !== "undefined") {
      visibilityChange = "webkitvisibilitychange";
    }

    document.addEventListener(
      visibilityChange as keyof DocumentEventMap,
      this.handleVisibilityChange as EventListener
    );
    intervalid = setInterval(() => {
      this.report();
    }, this.heartBeatInterval);
  }

  componentWillUnmount() {
    document.removeEventListener("click", this.handleClick);
    this.mutationObserver?.disconnect();
    this.observer?.disconnect();
    if (intervalid) {
      clearInterval(intervalid);
      this.report();
    }
    document.removeEventListener(
      visibilityChange as keyof DocumentEventMap,
      this.handleVisibilityChange as EventListener
    );
    let allEventNodes = document.querySelectorAll("[data-event]");
    if (allEventNodes && allEventNodes.length > 0) {
      allEventNodes.forEach((event) => {
        let eventValue = (event as HTMLElement).getAttribute("data-event");
        if (
          eventValue &&
          EVENTS.includes(
            eventValue as MouseEvents | FormEvents | TouchEvents | InputEvents
          )
        ) {
          document.removeEventListener(eventValue, this.handleTriggerEvent);
        }
      });
    }
  }

  render() {
    return <>{this.props.children}</>;
  }
}

export { AnalyticsPayload };
